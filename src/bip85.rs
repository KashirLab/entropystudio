use std::str::FromStr;

use bitcoin::{
    bip32::{ChildNumber, DerivationPath, Xpriv},
    secp256k1::Secp256k1,
};

use crate::bip39::mnemonic_to_master_fingerprint;
use crate::error::EntropyStudioError;
use crate::hash::sha256;
use crate::wipe::{wipe_bytes, wipe_string};

const PURPOSE: u32 = 83_696_968;

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum Bip85Application {
    Bip39,
    Wif,
    Xprv,
    Hex,
    PasswordBase64,
    PasswordBase85,
}

#[derive(Debug, uniffi::Record)]
pub struct Bip85Request {
    pub root_xprv: String,
    pub application: Bip85Application,
    pub index: String,
    pub word_count: u8,
    pub size: u8,
}

#[derive(Debug, uniffi::Record)]
pub struct Bip85Result {
    pub application: Bip85Application,
    pub entropy_hex: String,
    pub fingerprint: String,
    pub fingerprint_kind: String,
    pub is_testnet: bool,
    pub parent_fingerprint: String,
    pub path: String,
    pub secret: String,
    pub size: u8,
    pub word_count: u8,
}

#[uniffi::export]
pub fn bip85_derive(mut request: Bip85Request) -> Result<Bip85Result, EntropyStudioError> {
    let index = parse_child_index(&mut request.index)?;
    let (path, path_indices) = application_path(request.application, request.word_count, request.size, index)?;
    let root = parse_root_xprv(&mut request.root_xprv)?;
    let secp = Secp256k1::new();
    let parent_fingerprint = root.fingerprint(&secp).to_string();
    let mut entropy = bip85_extended::derive(&secp, &root, &path_indices)
        .map_err(|_| EntropyStudioError::InvalidBip85ChildKey)?;
    let entropy_hex = entropy_hex(request.application, request.word_count, request.size, &entropy)?;

    let (secret, fingerprint, fingerprint_kind) = match request.application {
        Bip85Application::Bip39 => {
            let mnemonic = bip85_extended::to_mnemonic(&secp, &root, request.word_count as u32, index)
                .map_err(|_| EntropyStudioError::InvalidBip85Request)?
                .to_string();
            let fingerprint = mnemonic_to_master_fingerprint(mnemonic.clone(), String::new())?;
            (mnemonic, fingerprint, "master".to_owned())
        }
        Bip85Application::Wif => {
            let key = bip85_extended::to_wif(&secp, &root, index)
                .map_err(|_| EntropyStudioError::InvalidBip85Request)?;
            (key.to_wif(), key.public_key(&secp).pubkey_hash().to_string()[..8].to_owned(), "key".to_owned())
        }
        Bip85Application::Xprv => {
            let key = bip85_extended::to_xprv(&secp, &root, index)
                .map_err(|_| EntropyStudioError::InvalidBip85ChildKey)?;
            let fingerprint = key.fingerprint(&secp).to_string();
            (key.to_string(), fingerprint, "master".to_owned())
        }
        Bip85Application::Hex => {
            let secret = bip85_extended::to_hex(&secp, &root, request.size as u32, index)
                .map_err(|_| EntropyStudioError::InvalidBip85Request)?;
            (secret, child_fingerprint(&entropy), "child".to_owned())
        }
        Bip85Application::PasswordBase64 => {
            let secret = bip85_extended::to_pwd_base64(&secp, &root, request.size as u32, index)
                .map_err(|_| EntropyStudioError::InvalidBip85Request)?;
            (secret, child_fingerprint(&entropy), "child".to_owned())
        }
        Bip85Application::PasswordBase85 => {
            let secret = bip85_extended::to_pwd_base85(&secp, &root, request.size as u32, index)
                .map_err(|_| EntropyStudioError::InvalidBip85Request)?;
            (secret, child_fingerprint(&entropy), "child".to_owned())
        }
    };

    wipe_bytes(&mut entropy);
    Ok(Bip85Result {
        application: request.application,
        entropy_hex,
        fingerprint,
        fingerprint_kind,
        is_testnet: !root.network.is_mainnet(),
        parent_fingerprint,
        path,
        secret,
        size: request.size,
        word_count: request.word_count,
    })
}

#[uniffi::export]
pub fn bip85_path(
    application: Bip85Application,
    mut index: String,
    word_count: u8,
    size: u8,
) -> Result<String, EntropyStudioError> {
    let index = parse_child_index(&mut index)?;
    application_path(application, word_count, size, index).map(|(path, _)| path)
}

fn parse_child_index(value: &mut String) -> Result<u32, EntropyStudioError> {
    let result = value
        .trim()
        .parse::<u32>()
        .ok()
        .filter(|index| *index < (1 << 31))
        .ok_or(EntropyStudioError::InvalidBip85Request);
    wipe_string(value);
    result
}

fn parse_root_xprv(value: &mut String) -> Result<Xpriv, EntropyStudioError> {
    let root = Xpriv::from_str(value.trim());
    wipe_string(value);
    let root = root.map_err(|_| EntropyStudioError::InvalidBip85Root)?;
    if root.depth != 0 {
        return Err(EntropyStudioError::InvalidBip85Root);
    }
    Ok(root)
}

fn application_path(
    application: Bip85Application,
    word_count: u8,
    size: u8,
    index: u32,
) -> Result<(String, DerivationPath), EntropyStudioError> {
    let mut parts = vec![PURPOSE];
    match application {
        Bip85Application::Bip39 if matches!(word_count, 12 | 15 | 18 | 21 | 24) => parts.extend([39, 0, word_count as u32, index]),
        Bip85Application::Bip39 => return Err(EntropyStudioError::InvalidBip85Request),
        Bip85Application::Wif => parts.extend([2, index]),
        Bip85Application::Xprv => parts.extend([32, index]),
        Bip85Application::Hex if (16..=64).contains(&size) => parts.extend([128169, size as u32, index]),
        Bip85Application::Hex => return Err(EntropyStudioError::InvalidBip85Request),
        Bip85Application::PasswordBase64 if (20..=86).contains(&size) => parts.extend([707764, size as u32, index]),
        Bip85Application::PasswordBase64 => return Err(EntropyStudioError::InvalidBip85Request),
        Bip85Application::PasswordBase85 if (10..=80).contains(&size) => parts.extend([707785, size as u32, index]),
        Bip85Application::PasswordBase85 => return Err(EntropyStudioError::InvalidBip85Request),
    }
    let child_numbers = parts
        .iter()
        .map(|part| ChildNumber::from_hardened_idx(*part).map_err(|_| EntropyStudioError::InvalidBip85Request))
        .collect::<Result<Vec<_>, _>>()?;
    let path = format!("m/{}", parts.iter().map(|part| format!("{part}'")).collect::<Vec<_>>().join("/"));
    // bip85_extended starts after its own 83696968' purpose node.
    Ok((path, DerivationPath::from(child_numbers[1..].to_vec())))
}

fn entropy_hex(application: Bip85Application, word_count: u8, size: u8, entropy: &[u8]) -> Result<String, EntropyStudioError> {
    let length = match application {
        Bip85Application::Bip39 => match word_count { 12 => 16, 15 => 20, 18 => 24, 21 => 28, 24 => 32, _ => return Err(EntropyStudioError::InvalidBip85Request) },
        Bip85Application::Wif => 32,
        Bip85Application::Xprv => 32,
        Bip85Application::Hex => size as usize,
        Bip85Application::PasswordBase64 | Bip85Application::PasswordBase85 => 64,
    };
    let bytes = if matches!(application, Bip85Application::Xprv) { entropy.get(32..64) } else { entropy.get(..length) }.ok_or(EntropyStudioError::InvalidBip85ChildKey)?;
    Ok(hex::encode(bytes))
}

fn child_fingerprint(entropy: &[u8]) -> String {
    hex::encode(&sha256(entropy.to_vec())[..4])
}
