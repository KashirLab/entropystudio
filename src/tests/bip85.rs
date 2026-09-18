use super::*;

const ROOT: &str = "xprv9s21ZrQH143K2LBWUUQRFXhucrQqBpKdRRxNVq2zBqsx8HVqFk2uYo8kmbaLLHRdqtQpUm98uKfu3vca1LqdGhUtyoFnCNkfmXRyPXLjbKb";

fn request(application: Bip85Application) -> Bip85Request {
    Bip85Request { root_xprv: ROOT.to_owned(), application, index: "0".to_owned(), word_count: 24, size: 32 }
}

#[test]
fn bip85_matches_official_bip39_vector() {
    let result = bip85_derive(request(Bip85Application::Bip39)).unwrap();
    assert_eq!(result.path, "m/83696968'/39'/0'/24'/0'");
    assert_eq!(result.entropy_hex, "ae131e2312cdc61331542efe0d1077bac5ea803adf24b313a4f0e48e9c51f37f");
    assert_eq!(result.secret, "puppy ocean match cereal symbol another shed magic wrap hammer bulb intact gadget divorce twin tonight reason outdoor destroy simple truth cigar social volcano");
}

#[test]
fn bip85_matches_upstream_application_outputs() {
    let wif = bip85_derive(request(Bip85Application::Wif)).unwrap();
    assert_eq!(wif.path, "m/83696968'/2'/0'");
    assert_eq!(wif.secret, "Kzyv4uF39d4Jrw2W7UryTHwZr1zQVNk4dAFyqE6BuMrMh1Za7uhp");

    let mut hex = request(Bip85Application::Hex);
    hex.size = 32;
    assert_eq!(bip85_derive(hex).unwrap().secret.len(), 64);

    let mut base64 = request(Bip85Application::PasswordBase64);
    base64.size = 21;
    assert_eq!(bip85_derive(base64).unwrap().secret, "dKLoepugzdVJvdL56ogNV");
}

#[test]
fn bip85_rejects_non_root_and_invalid_requests() {
    let mut bad_root = request(Bip85Application::Wif);
    bad_root.root_xprv = "xpub661MyMwAqRbcFkPHucMnrGNzDwb6teAX1RbKQmqtEF8kK3Z7LZ59qafCjB9eCRLiTVG3uxBxgKvRgbubRhqSKXnGGb1aoaqLrpMBDrVxga8".to_owned();
    assert!(matches!(bip85_derive(bad_root), Err(EntropyStudioError::InvalidBip85Root)));
    let mut bad_size = request(Bip85Application::Hex);
    bad_size.size = 15;
    assert!(matches!(bip85_derive(bad_size), Err(EntropyStudioError::InvalidBip85Request)));
}
