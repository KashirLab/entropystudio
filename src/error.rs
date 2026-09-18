use std::error::Error;
use std::fmt;

#[derive(Debug, uniffi::Error)]
pub enum EntropyStudioError {
    InvalidMnemonic,
    InvalidEntropy,
    InvalidLifeHashFingerprint,
    InvalidMasterKey,
    InvalidBip85Root,
    InvalidBip85Request,
    InvalidBip85ChildKey,
    InvalidNumberBaseInput,
    InvalidDiceRolls,
    NoDiceRolls,
    UnsupportedDiceWordCount,
    InvalidCardTranscript,
    NoCards,
    DuplicateCard,
    EmptyPrivateKey,
    InvalidWifPrivateKey,
    InvalidHexPrivateKey,
    InvalidMiniPrivateKeyFormat,
    InvalidMiniPrivateKey,
    InvalidPrivateKeyRange,
    EmptyBrainWallet,
    TrimmedBrainWalletEmpty,
    InvalidVanityInput,
    VanityRunCleared,
}

impl fmt::Display for EntropyStudioError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{self:?}")
    }
}

impl Error for EntropyStudioError {}
