pub(crate) fn wipe_bytes(bytes: &mut [u8]) {
    for byte in bytes {
        unsafe { std::ptr::write_volatile(byte, 0) };
    }
    std::sync::atomic::compiler_fence(std::sync::atomic::Ordering::SeqCst);
}

pub(crate) fn wipe_string(value: &mut String) {
    unsafe { wipe_bytes(value.as_mut_vec()) };
}

/// Owns sensitive material and wipes it when its scope ends, including on an
/// early return caused by `?`. Keeping this responsibility in a guard lets the
/// caller focus on deriving or encoding data rather than cleanup branches.
pub(crate) struct Sensitive<T: Wipe>(T);

pub(crate) trait Wipe {
    fn wipe(&mut self);
}

impl Wipe for u8 {
    fn wipe(&mut self) {
        unsafe { std::ptr::write_volatile(self, 0) };
    }
}

impl<T: Wipe, const N: usize> Wipe for [T; N] {
    fn wipe(&mut self) {
        for value in self {
            value.wipe();
        }
        std::sync::atomic::compiler_fence(std::sync::atomic::Ordering::SeqCst);
    }
}

impl<T: Wipe> Wipe for Vec<T> {
    fn wipe(&mut self) {
        for value in self {
            value.wipe();
        }
        std::sync::atomic::compiler_fence(std::sync::atomic::Ordering::SeqCst);
    }
}

impl Wipe for String {
    fn wipe(&mut self) {
        wipe_string(self);
    }
}

impl<T: Wipe> Sensitive<T> {
    pub(crate) fn new(value: T) -> Self {
        Self(value)
    }
}

impl<const N: usize> Sensitive<[u8; N]> {
    /// Returns a short-lived copy for an API that takes its buffer by value.
    /// The guard's owned copy remains scheduled for wiping.
    pub(crate) fn copy(&self) -> [u8; N] {
        self.0
    }
}

impl<T: Wipe> std::ops::Deref for Sensitive<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T: Wipe> std::ops::DerefMut for Sensitive<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<T: Wipe> Drop for Sensitive<T> {
    fn drop(&mut self) {
        self.0.wipe();
    }
}
