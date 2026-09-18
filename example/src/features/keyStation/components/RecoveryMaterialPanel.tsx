import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DiceColors } from '../../dice/diceTheme';
import { UPSTREAM_TEXT } from '../../upstreamUiCopy';

export type EntropyResult =
  | {
      readonly entropy: string;
      readonly masterSeed?: string;
      readonly mnemonic?: string;
      readonly rootXprv?: string;
      readonly wifCompressed?: string;
      readonly wifUncompressed?: string;
      readonly error?: never;
    }
  | {
      readonly entropy?: never;
      readonly masterSeed?: never;
      readonly mnemonic?: never;
      readonly rootXprv?: never;
      readonly wifCompressed?: never;
      readonly wifUncompressed?: never;
      readonly error: string;
    };

type Props = {
  readonly afterMnemonic?: ReactNode;
  readonly colors: DiceColors;
  readonly entropyLabel: string;
  readonly masterSeedLabel?: string;
  readonly mnemonicLabel?: string;
  readonly rootXprvLabel?: string;
  /** Shared visibility state for values that recreate or spend. */
  readonly privateDataVisible?: boolean;
  readonly wifCompressedLabel?: string;
  readonly wifUncompressedLabel?: string;
  readonly result: EntropyResult | null;
};

export function RecoveryMaterialPanel({
  afterMnemonic,
  colors,
  entropyLabel,
  masterSeedLabel,
  mnemonicLabel,
  rootXprvLabel,
  privateDataVisible = true,
  wifCompressedLabel,
  wifUncompressedLabel,
  result,
}: Props) {
  if (!result) {
    return null;
  }

  return (
    <View style={styles.result}>
      {result.error ? (
        <Text
          style={[styles.error, { color: colors.error }]}
          testID="dice-error"
        >
          {result.error}
        </Text>
      ) : (
        <>
          {wifCompressedLabel && result.wifCompressed ? (
            <>
              <Text
                style={[styles.label, { color: colors.text }]}
                testID="wif-compressed-label"
              >
                {wifCompressedLabel}
              </Text>
              <Text
                selectable
                style={[styles.entropy, { color: privateDataVisible ? colors.privateValue : colors.muted }]}
                testID="wif-compressed-output"
              >
                {privateDataVisible
                  ? result.wifCompressed
                  : UPSTREAM_TEXT.result.privateValueMask}
              </Text>
            </>
          ) : null}
          {wifUncompressedLabel && result.wifUncompressed ? (
            <>
              <Text
                style={[styles.label, styles.wifUncompressedLabel, { color: colors.text }]}
                testID="wif-uncompressed-label"
              >
                {wifUncompressedLabel}
              </Text>
              <Text
                selectable
                style={[styles.entropy, { color: privateDataVisible ? colors.privateValue : colors.muted }]}
                testID="wif-uncompressed-output"
              >
                {privateDataVisible
                  ? result.wifUncompressed
                  : UPSTREAM_TEXT.result.privateValueMask}
              </Text>
            </>
          ) : null}
          {mnemonicLabel && result.mnemonic ? (
            <>
              <Text
                style={[styles.label, { color: colors.text }]}
                testID="result-seed-phrase-label"
              >
                {mnemonicLabel}
              </Text>
              <Text
                selectable
                style={[styles.entropy, { color: privateDataVisible ? colors.privateValue : colors.muted }]}
                testID="result-seed-phrase-output"
              >
                {privateDataVisible
                  ? result.mnemonic
                  : UPSTREAM_TEXT.result.privateValueMask}
              </Text>
            </>
          ) : null}
          {mnemonicLabel && result.mnemonic && privateDataVisible
            ? afterMnemonic
            : null}
          <Text
            style={[
              styles.label,
              ((mnemonicLabel && result.mnemonic) ||
                (wifCompressedLabel && result.wifCompressed) ||
                (wifUncompressedLabel && result.wifUncompressed)) &&
                styles.entropyLabelAfterValue,
              { color: colors.text },
            ]}
            testID="result-entropy-label"
          >
            {entropyLabel}
          </Text>
          <Text
            selectable
            style={[styles.entropy, { color: privateDataVisible ? colors.privateValue : colors.muted }]}
            testID="entropy-output"
          >
            {privateDataVisible
              ? result.entropy
              : UPSTREAM_TEXT.result.privateValueMask}
          </Text>
          {masterSeedLabel && result.masterSeed ? (
            <>
              <Text
                style={[styles.label, styles.masterSeedLabel, { color: colors.text }]}
                testID="master-seed-label"
              >
                {masterSeedLabel}
              </Text>
              <Text
                selectable
                style={[styles.entropy, { color: privateDataVisible ? colors.privateValue : colors.muted }]}
                testID="master-seed-output"
              >
                {privateDataVisible
                  ? result.masterSeed
                  : UPSTREAM_TEXT.result.privateValueMask}
              </Text>
            </>
          ) : null}
          {rootXprvLabel && result.rootXprv ? (
            <>
              <Text
                style={[styles.label, styles.rootXprvLabel, { color: colors.text }]}
                testID="root-xprv-label"
              >
                {rootXprvLabel}
              </Text>
              <Text
                selectable
                style={[styles.entropy, { color: privateDataVisible ? colors.privateValue : colors.muted }]}
                testID="root-xprv-output"
              >
                {privateDataVisible
                  ? result.rootXprv
                  : UPSTREAM_TEXT.result.privateValueMask}
              </Text>
            </>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  entropy: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  error: {
    fontSize: 15,
    lineHeight: 23,
  },
  entropyLabelAfterValue: { marginTop: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  masterSeedLabel: { marginTop: 16 },
  rootXprvLabel: { marginTop: 16 },
  result: { paddingBottom: 4 },
  wifUncompressedLabel: { marginTop: 16 },
});
