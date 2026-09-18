use crate::wipe::Sensitive;

#[uniffi::export]
pub fn sha256(input: Vec<u8>) -> Vec<u8> {
    let input = Sensitive::new(input);
    let mut digest = Sensitive::new([0u8; 32]);
    unsafe {
        entropylab_wasm::el_sha256(input.as_ptr(), input.len(), digest.as_mut_ptr());
    }
    let result = digest.to_vec();
    result
}
