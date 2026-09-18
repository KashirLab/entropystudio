use crate::bip39::bip39_entropy_bytes;
use crate::error::EntropyStudioError;
use crate::hash::sha256;
use crate::wipe::Sensitive;

#[derive(Debug, Clone, Copy, uniffi::Enum)]
pub enum DiceRollMethod {
    Coldcard,
    Coleman,
}

#[derive(Debug, uniffi::Record)]
pub struct HashedDiceState {
    pub allowed_faces: Vec<String>,
    pub can_derive: bool,
    pub estimated_entropy_bits: f64,
    pub has_rolls: bool,
    pub invalid_faces: String,
    pub progress: f64,
    pub recommended_rolls: u8,
    pub roll_count: u32,
}

#[uniffi::export]
pub fn hashed_dice_state(
    rolls: String,
    target_words: u8,
) -> Result<HashedDiceState, EntropyStudioError> {
    let rolls = Sensitive::new(rolls);
    let recommended_rolls = recommended_dice_rolls(target_words)?;
    let mut invalid_faces = String::new();
    let mut roll_count = 0;

    for face in rolls.chars() {
        match face {
            '1'..='6' => roll_count += 1,
            separator if is_dice_separator(separator) => {}
            _ => invalid_faces.push(face),
        }
    }
    Ok(HashedDiceState {
        allowed_faces: ('1'..='6').map(|face| face.to_string()).collect(),
        can_derive: roll_count > 0,
        estimated_entropy_bits: roll_count as f64 * 6_f64.log2(),
        has_rolls: roll_count > 0,
        invalid_faces,
        progress: (roll_count as f64 / f64::from(recommended_rolls)).min(1.0),
        recommended_rolls,
        roll_count,
    })
}

#[uniffi::export]
pub fn dice_rolls_to_entropy(
    rolls: String,
    method: DiceRollMethod,
    target_words: u8,
) -> Result<Vec<u8>, EntropyStudioError> {
    let rolls = Sensitive::new(rolls);
    let entropy_length = bip39_entropy_bytes(target_words)?;
    let mut hash_input = Sensitive::new(Vec::with_capacity(rolls.len()));

    for face in rolls.chars() {
        match face {
            '1'..='6' => hash_input.push(match method {
                DiceRollMethod::Coldcard => face as u8,
                DiceRollMethod::Coleman if face == '6' => b'0',
                DiceRollMethod::Coleman => face as u8,
            }),
            separator if is_dice_separator(separator) => {}
            _ => {
                return Err(EntropyStudioError::InvalidDiceRolls);
            }
        }
    }
    if hash_input.is_empty() {
        return Err(EntropyStudioError::NoDiceRolls);
    }

    let digest = Sensitive::new(sha256(hash_input.to_vec()));
    let result = digest[..entropy_length].to_vec();
    Ok(result)
}

pub(crate) fn recommended_dice_rolls(target_words: u8) -> Result<u8, EntropyStudioError> {
    match target_words {
        12 => Ok(50),
        15 => Ok(62),
        18 => Ok(75),
        21 => Ok(87),
        24 => Ok(99),
        _ => Err(EntropyStudioError::UnsupportedDiceWordCount),
    }
}

pub(crate) fn is_dice_separator(character: char) -> bool {
    character.is_whitespace() || matches!(character, ',' | ';' | '|')
}
