import { UPSTREAM_TEXT } from '../../upstreamUiCopy';

export type KeyDerivationSection = 'recovery' | 'identity' | 'addresses' | 'account-private' | 'watch-only';

export const KEY_DERIVATION_SECTION_ROWS: readonly {
  readonly id: KeyDerivationSection;
  readonly label: string;
}[] = [
  { id: 'recovery', label: UPSTREAM_TEXT.result.privateRecoveryMaterial },
  { id: 'identity', label: UPSTREAM_TEXT.result.walletIdentity },
  { id: 'addresses', label: UPSTREAM_TEXT.result.addresses },
  { id: 'account-private', label: UPSTREAM_TEXT.result.accountPrivateKeyExports },
  { id: 'watch-only', label: UPSTREAM_TEXT.result.watchOnlyExports },
];
