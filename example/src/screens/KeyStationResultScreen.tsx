import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import { KeyStationIntroduction } from '../components/KeyStationIntroduction';
import { KeyStationLifeHash } from '../features/keyStation/components/KeyStationLifeHash';
import { KeyStationEdgeNote } from '../features/keyStation/components/KeyStationEdgeNote';
import { RecoveryMaterialPanel } from '../features/keyStation/components/RecoveryMaterialPanel';
import { SeedQrPanel } from '../features/keyStation/components/SeedQrPanel';
import { ScriptTypePickerScreen } from '../features/keyStation/components/ScriptTypePickerScreen';
import { NativeKeyDerivationNavigator } from '../features/keyStation/components/NativeKeyDerivationNavigator';
import {
  KeyDerivationSectionList,
  type KeyDerivationSection,
} from '../features/keyStation/components/KeyDerivationSectionList';
import { ScriptTypeTabs } from '../features/keyStation/components/ScriptTypeTabs';
import { keyStationSafetyNotes } from '../features/keyStation/keyStation';
import {
  keyDerivationAdvancedState,
  seedQrData,
} from '../native/entropyStudio';
import type {
  KeyStationSafetyNote,
  KeyStationScriptType,
  KeyStationTab,
  KeyStationDerivation,
} from '../features/keyStation/keyStation';
import {
  formatCopy,
  UPSTREAM_TEXT,
  UPSTREAM_UI_FALLBACK_COPY,
  UPSTREAM_UI_LABELS,
} from '../features/upstreamUiCopy';

const CONTENT_HORIZONTAL_PADDING = 24;

type Props = {
  readonly colors: DiceColors;
  readonly isDarkMode: boolean;
  readonly isActive: boolean;
  readonly onEditInput: () => void;
  readonly onReturnToStation: () => void;
  readonly onSetResultScriptType: (scriptType: KeyStationScriptType) => void;
  readonly tab: KeyStationTab | null;
};

type SafetyNotesProps = {
  readonly colors: DiceColors;
  readonly notes: readonly KeyStationSafetyNote[];
  readonly testIDPrefix: string;
};

type AccountSection = Exclude<KeyDerivationSection, 'recovery' | 'identity'>;

function SafetyNote({
  colors,
  note,
  noteTestID,
}: {
  readonly colors: DiceColors;
  readonly note: KeyStationSafetyNote;
  readonly noteTestID: string;
}) {
  const color = note.kind === 'warning' ? colors.error : colors.muted;
  const arrow = UPSTREAM_TEXT.calculations.conversionArrow;
  const arrowIndex = note.centeredArrow ? note.text.indexOf(arrow) : -1;

  if (arrowIndex < 0) {
    return (
      <Text style={[styles.safetyNotesCopy, { color }]} testID={noteTestID}>
        {note.text}
      </Text>
    );
  }

  const beforeArrow = note.text.slice(0, arrowIndex);
  const afterArrow = note.text.slice(arrowIndex + arrow.length);

  return (
    <View
      accessible
      accessibilityLabel={note.text}
      style={styles.safetyNotesCenteredArrowLine}
      testID={noteTestID}
    >
      <Text accessible={false} style={[styles.safetyNotesCopy, { color }]}>
        {beforeArrow}
        <Text
          style={[styles.safetyNotesCenteredArrow, { color }]}
          testID={`${noteTestID}-arrow`}
        >
          {arrow}
        </Text>
        <Text style={[styles.safetyNotesCenteredArrowCopy, { color }]}>
          {afterArrow}
        </Text>
      </Text>
    </View>
  );
}

function SafetyNotes({ colors, notes, testIDPrefix }: SafetyNotesProps) {
  if (!notes.length) {
    return null;
  }

  return (
    <KeyStationIntroduction
      colors={colors}
      descriptionScrollable
      heading={UPSTREAM_TEXT.result.safetyNotes}
      popupContent={
        <View testID={`${testIDPrefix}-notes`}>
          {notes.map((note, index) => (
            <SafetyNote
              colors={colors}
              key={note.text}
              note={note}
              noteTestID={`${testIDPrefix}-note-${index}`}
            />
          ))}
        </View>
      }
      sheetHeight={460}
      testIDPrefix={testIDPrefix}
    />
  );
}

/** Mirrors upstream's key-summary method and selected-method line. */
function keyStationSummaryTitle(tab: KeyStationTab): string {
  const method = UPSTREAM_UI_LABELS.keyMode[tab.method];
  let submethod: string;

  switch (tab.input.kind) {
    case 'dice':
      submethod = UPSTREAM_TEXT.keys.summaryDiceMethod[tab.input.method];
      break;
    case 'cards':
      submethod =
        tab.input.method === 'direct'
          ? UPSTREAM_TEXT.cards.direct.title
          : UPSTREAM_TEXT.cards.hashed.title;
      break;
    case 'number-bases':
      submethod = UPSTREAM_UI_LABELS.hexFormat[tab.input.format].label;
      break;
    case 'seed-phrase':
      submethod = UPSTREAM_TEXT.seed.method[tab.input.method];
      break;
    case 'private-key':
      submethod = UPSTREAM_TEXT.key[tab.input.format];
      break;
  }

  return UPSTREAM_UI_FALLBACK_COPY.keys.summaryMethod(method, submethod);
}

// Native navigation handles every BIP39 destination above. Keep the fallback
// renderer typed as the complete persisted result union for the private-key
// path it owns below.
function fallbackResultDerivation(tab: KeyStationTab): KeyStationDerivation {
  return tab.derivation;
}

export function KeyStationResultScreen({
  colors,
  isDarkMode,
  isActive,
  onEditInput,
  onReturnToStation,
  onSetResultScriptType,
  tab,
}: Props) {
  const [showingPrivateRecoveryMaterial, setShowingPrivateRecoveryMaterial] =
    useState(false);
  const [showingWatchOnlyWalletData, setShowingWatchOnlyWalletData] =
    useState(false);
  const [showingWalletData, setShowingWalletData] = useState(false);
  const [showingScriptType, setShowingScriptType] = useState(false);
  const [accountSection, setAccountSection] = useState<AccountSection | null>(
    null,
  );

  useEffect(() => {
    setShowingPrivateRecoveryMaterial(false);
    setShowingWatchOnlyWalletData(false);
    setShowingWalletData(false);
    setShowingScriptType(false);
    setAccountSection(null);
  }, [tab?.id]);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (showingWalletData) {
          setShowingPrivateRecoveryMaterial(false);
          setShowingWatchOnlyWalletData(false);
          setShowingWalletData(false);
          return true;
        }
        if (showingPrivateRecoveryMaterial) {
          setShowingPrivateRecoveryMaterial(false);
          return true;
        }
        if (showingScriptType) {
          setShowingScriptType(false);
          return true;
        }
        onReturnToStation();
        return true;
      },
    );
    return () => subscription.remove();
  }, [
    isActive,
    onReturnToStation,
    showingPrivateRecoveryMaterial,
    showingScriptType,
    showingWalletData,
    showingWatchOnlyWalletData,
  ]);

  if (!tab) {
    return null;
  }

  const { derivation } = tab;
  const safetyNotes = keyStationSafetyNotes(tab);
  const derivationState = keyDerivationAdvancedState(
    tab.derivationSettings.advancedInput,
  );
  const seedQr =
    derivation.kind === 'bip39' &&
    showingWalletData &&
    showingPrivateRecoveryMaterial
      ? seedQrData(derivation.mnemonic)
      : null;

  if (derivation.kind === 'bip39') {
    const detailInput = {
      accountPath: tab.derivationSettings.accountPath,
      addressIndex: derivationState.addressWindow.start.value,
      addressCount: derivationState.addressWindow.range.value,
      branches: derivationState.branchWindow.branches.map(
        branch => branch.index,
      ),
      addressHardened: tab.derivationSettings.advancedHardening.address,
      branchHardened: tab.derivationSettings.advancedHardening.branch,
      masterFingerprint: tab.masterFingerprint,
      mnemonic: derivation.mnemonic,
      passphrase: derivation.passphrase,
    };
    const accountDetail = (section: AccountSection) => (
      <ScriptTypePickerScreen
        colors={colors}
        initialSection={section}
        onBack={() => undefined}
        privateAccountMaterialInput={detailInput}
        scriptType={tab.resultScriptType}
        showNavigationHeader={false}
      />
    );
    const details = {
      recovery: (
        <ScrollView
          contentContainerStyle={styles.content}
          style={[styles.screen, { backgroundColor: colors.background }]}
        >
          <KeyStationEdgeNote colors={colors} kind="private">
            <Text style={[styles.edgeNoteCopy, { color: colors.text }]}>
              <Text style={styles.privateMaterialSafetyLead}>
                {UPSTREAM_TEXT.result.privateAccountMaterialIntro}
              </Text>{' '}
              {UPSTREAM_TEXT.result.privateRecoveryMaterialSafety}
            </Text>
          </KeyStationEdgeNote>
          <RecoveryMaterialPanel
            afterMnemonic={
              seedQrData(derivation.mnemonic) ? (
                <SeedQrPanel
                  colors={colors}
                  data={seedQrData(derivation.mnemonic)!}
                  passphraseUsed={Boolean(derivation.passphrase)}
                />
              ) : undefined
            }
            colors={colors}
            entropyLabel={UPSTREAM_TEXT.result.entropyHex}
            masterSeedLabel={UPSTREAM_UI_FALLBACK_COPY.result.masterSeedHex}
            mnemonicLabel={UPSTREAM_UI_FALLBACK_COPY.result.seedPhrase(
              derivation.mnemonic.trim().split(/\s+/).length,
            )}
            result={{
              entropy: derivation.entropy,
              masterSeed: derivation.masterSeed,
              mnemonic: derivation.mnemonic,
              rootXprv: tab.rootXprv,
            }}
            rootXprvLabel={formatCopy(UPSTREAM_TEXT.result.rootXprv, {
              name: 'xprv',
            })}
          />
        </ScrollView>
      ),
      identity: (
        <ScrollView
          contentContainerStyle={styles.content}
          style={[styles.screen, { backgroundColor: colors.background }]}
        >
          <KeyStationEdgeNote colors={colors} kind="public">
            <Text style={[styles.edgeNoteCopy, { color: colors.text }]}>
              {UPSTREAM_TEXT.result.watchOnlyWalletDataSafety}
            </Text>
          </KeyStationEdgeNote>
          <Text style={[styles.watchOnlyLabel, { color: colors.text }]}>
            {UPSTREAM_TEXT.fingerprint.master}
          </Text>
          <Text
            selectable
            style={[styles.watchOnlyValue, { color: colors.text }]}
          >
            {tab.masterFingerprint}
          </Text>
          <Text style={[styles.watchOnlyLabel, { color: colors.text }]}>
            {formatCopy(UPSTREAM_TEXT.result.rootXprv, { name: 'xpub' })}
          </Text>
          <Text
            selectable
            style={[styles.watchOnlyValue, { color: colors.text }]}
          >
            {tab.rootXpub}
          </Text>
        </ScrollView>
      ),
      addresses: accountDetail('addresses'),
      'account-private': accountDetail('account-private'),
      'watch-only': accountDetail('watch-only'),
    };
    return (
      <NativeKeyDerivationNavigator
        colors={colors}
        details={details}
        isActive={isActive}
        isDarkMode={isDarkMode}
        onReturnToStation={onReturnToStation}
        rootTitle={tab.masterFingerprint}
      >
        <View
          style={[
            styles.content,
            styles.nativeOverviewContent,
            { backgroundColor: colors.background },
          ]}
          testID="key-station-result-screen"
        >
          <Text
            style={[styles.nativeOverviewTitle, { color: colors.text }]}
            testID="key-station-method-title"
          >
            {keyStationSummaryTitle(tab)}
          </Text>
          <View style={styles.summary} testID="key-station-summary">
            <View style={styles.summaryHeader}>
              <KeyStationLifeHash
                fingerprint={tab.masterFingerprint}
                imageTestID="key-station-master-fingerprint-lifehash"
              />
              <View style={styles.summaryDetails}>
                <Text
                  style={[styles.meta, { color: colors.muted }]}
                  testID="key-station-script-value"
                >
                  {UPSTREAM_TEXT.keys.scriptTypes[tab.scriptType]}
                </Text>
                <Text
                  style={[styles.meta, styles.path, { color: colors.muted }]}
                  testID="key-station-path-value"
                >
                  {tab.derivationPath}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={UPSTREAM_TEXT.keys.editInput}
                accessibilityRole="button"
                hitSlop={8}
                onPressIn={onEditInput}
                style={({ pressed }) => [
                  styles.editButton,
                  { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
                ]}
                testID="key-station-edit-inputs"
              >
                <Text style={[styles.editButtonText, { color: colors.accent }]}>
                  {UPSTREAM_TEXT.keys.editInput}
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.nativeSafetyNotes}>
            <SafetyNotes
              colors={colors}
              notes={safetyNotes}
              testIDPrefix="wallet-safety"
            />
          </View>
          <ScriptTypeTabs
            colors={colors}
            onSelect={onSetResultScriptType}
            selected={tab.resultScriptType}
          />
        </View>
      </NativeKeyDerivationNavigator>
    );
  }

  const fallbackDerivation = fallbackResultDerivation(tab);

  if (showingScriptType) {
    return (
      <ScriptTypePickerScreen
        colors={colors}
        initialSection={accountSection}
        onBack={() => setShowingScriptType(false)}
        privateAccountMaterialInput={
          fallbackDerivation.kind === 'bip39'
            ? {
                accountPath: tab.derivationSettings.accountPath,
                addressIndex: derivationState.addressWindow.start.value,
                addressCount: derivationState.addressWindow.range.value,
                branches: derivationState.branchWindow.branches.map(
                  branch => branch.index,
                ),
                addressHardened:
                  tab.derivationSettings.advancedHardening.address,
                branchHardened: tab.derivationSettings.advancedHardening.branch,
                masterFingerprint: tab.masterFingerprint,
                mnemonic: fallbackDerivation.mnemonic,
                passphrase: fallbackDerivation.passphrase,
              }
            : undefined
        }
        scriptType={tab.resultScriptType}
      />
    );
  }

  const openDerivationSection = (section: KeyDerivationSection) => {
    if (section === 'recovery' || section === 'identity') {
      setShowingPrivateRecoveryMaterial(section === 'recovery');
      setShowingWatchOnlyWalletData(section === 'identity');
      setShowingWalletData(true);
      return;
    }
    setAccountSection(section);
    setShowingScriptType(true);
  };

  return (
    <View
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[
        styles.screen,
        { backgroundColor: colors.background },
        !isActive && styles.hidden,
      ]}
      testID="key-station-result-screen"
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {showingWalletData && fallbackDerivation.kind === 'bip39' ? (
          <View testID="wallet-data-screen">
            <Pressable
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
              accessibilityRole="button"
              onPress={() => {
                setShowingPrivateRecoveryMaterial(false);
                setShowingWatchOnlyWalletData(false);
                setShowingWalletData(false);
              }}
              style={styles.backButton}
              testID="close-wallet-data"
            >
              <Text style={[styles.backButtonText, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.common.back}
              </Text>
            </Pressable>
            <Text
              style={[styles.walletDataTitle, { color: colors.text }]}
              testID="wallet-data-title"
            >
              {UPSTREAM_TEXT.result.walletRecoveryDetails}
            </Text>
            {showingPrivateRecoveryMaterial ? (
              <>
                <KeyStationEdgeNote
                  colors={colors}
                  kind="private"
                  testID="private-recovery-material-safety"
                >
                  <Text style={[styles.edgeNoteCopy, { color: colors.text }]}>
                    <Text style={styles.privateMaterialSafetyLead}>
                      {UPSTREAM_TEXT.result.privateAccountMaterialIntro}
                    </Text>{' '}
                    {UPSTREAM_TEXT.result.privateRecoveryMaterialSafety}
                  </Text>
                </KeyStationEdgeNote>
                <RecoveryMaterialPanel
                  afterMnemonic={
                    seedQr ? (
                      <SeedQrPanel
                        colors={colors}
                        data={seedQr}
                        passphraseUsed={Boolean(fallbackDerivation.passphrase)}
                      />
                    ) : undefined
                  }
                  colors={colors}
                  entropyLabel={UPSTREAM_TEXT.result.entropyHex}
                  masterSeedLabel={
                    UPSTREAM_UI_FALLBACK_COPY.result.masterSeedHex
                  }
                  mnemonicLabel={UPSTREAM_UI_FALLBACK_COPY.result.seedPhrase(
                    fallbackDerivation.mnemonic.trim().split(/\s+/).length,
                  )}
                  result={{
                    entropy: fallbackDerivation.entropy,
                    masterSeed: fallbackDerivation.masterSeed,
                    mnemonic: fallbackDerivation.mnemonic,
                    rootXprv: tab.rootXprv,
                  }}
                  rootXprvLabel={formatCopy(UPSTREAM_TEXT.result.rootXprv, {
                    name: 'xprv',
                  })}
                />
              </>
            ) : showingWatchOnlyWalletData ? (
              <View testID="watch-only-wallet-data">
                <KeyStationEdgeNote
                  colors={colors}
                  kind="public"
                  testID="watch-only-wallet-data-safety"
                >
                  <Text style={[styles.edgeNoteCopy, { color: colors.text }]}>
                    {UPSTREAM_TEXT.result.watchOnlyWalletDataSafety}
                  </Text>
                </KeyStationEdgeNote>
                <Text style={[styles.watchOnlyLabel, { color: colors.text }]}>
                  {UPSTREAM_TEXT.fingerprint.master}
                </Text>
                <Text
                  selectable
                  style={[styles.watchOnlyValue, { color: colors.text }]}
                  testID="watch-only-master-fingerprint"
                >
                  {tab.masterFingerprint}
                </Text>
                <Text style={[styles.watchOnlyLabel, { color: colors.text }]}>
                  {formatCopy(UPSTREAM_TEXT.result.rootXprv, { name: 'xpub' })}
                </Text>
                <Text
                  selectable
                  style={[styles.watchOnlyValue, { color: colors.text }]}
                  testID="watch-only-root-xpub"
                >
                  {tab.rootXpub}
                </Text>
              </View>
            ) : null}
          </View>
        ) : fallbackDerivation.kind === 'private-key' ? (
          <>
            <View
              style={styles.privateKeySummary}
              testID="key-station-private-key-summary"
            >
              <View style={styles.summaryDetails}>
                <Text
                  style={[styles.privateKeyTitle, { color: colors.text }]}
                  testID="key-station-private-key-title"
                >
                  {UPSTREAM_UI_LABELS.keyMode[tab.method]}
                </Text>
                <Text
                  style={[styles.meta, { color: colors.muted }]}
                  testID="key-station-script-value"
                >
                  {UPSTREAM_TEXT.keys.scriptTypes[tab.scriptType]}
                </Text>
                <Text
                  style={[styles.meta, styles.path, { color: colors.muted }]}
                  testID="key-station-path-value"
                >
                  {tab.derivationPath}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={UPSTREAM_TEXT.keys.editInput}
                accessibilityRole="button"
                onPress={onEditInput}
                style={({ pressed }) => [
                  styles.editButton,
                  { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
                ]}
                testID="key-station-edit-inputs"
              >
                <Text style={[styles.editButtonText, { color: colors.accent }]}>
                  {UPSTREAM_TEXT.keys.editInput}
                </Text>
              </Pressable>
            </View>
            <SafetyNotes
              colors={colors}
              notes={safetyNotes}
              testIDPrefix="private-key-safety"
            />
            <ScriptTypeTabs
              colors={colors}
              onSelect={onSetResultScriptType}
              selected={tab.resultScriptType}
            />
            <Pressable
              accessibilityLabel={UPSTREAM_TEXT.result.privateKey}
              accessibilityRole="button"
              accessibilityState={{ expanded: showingPrivateRecoveryMaterial }}
              onPress={() => setShowingPrivateRecoveryMaterial(value => !value)}
              style={({ pressed }) => [
                styles.walletDataSectionButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
              ]}
              testID="toggle-private-key-material"
            >
              <Text
                style={[styles.walletDataSectionTitle, { color: colors.text }]}
              >
                {UPSTREAM_TEXT.result.privateKey}
              </Text>
            </Pressable>
          </>
        ) : null}
        {fallbackDerivation.kind === 'bip39' && !showingWalletData ? (
          <>
            <View style={styles.summary} testID="key-station-summary">
              <View style={styles.summaryHeader}>
                <KeyStationLifeHash
                  fingerprint={tab.masterFingerprint}
                  imageTestID="key-station-master-fingerprint-lifehash"
                />
                <View style={styles.summaryDetails}>
                  <Text
                    style={[styles.fingerprint, { color: colors.text }]}
                    testID="key-station-master-fingerprint-value"
                  >
                    {tab.masterFingerprint}
                  </Text>
                  <Text
                    style={[styles.meta, { color: colors.muted }]}
                    testID="key-station-method-value"
                  >
                    {UPSTREAM_UI_LABELS.keyMode[tab.method]}
                  </Text>
                  <Text
                    style={[styles.meta, { color: colors.muted }]}
                    testID="key-station-script-value"
                  >
                    {UPSTREAM_TEXT.keys.scriptTypes[tab.scriptType]}
                  </Text>
                  <Text
                    style={[styles.meta, styles.path, { color: colors.muted }]}
                    testID="key-station-path-value"
                  >
                    {tab.derivationPath}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={UPSTREAM_TEXT.keys.editInput}
                  accessibilityRole="button"
                  onPress={onEditInput}
                  style={({ pressed }) => [
                    styles.editButton,
                    { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
                  ]}
                  testID="key-station-edit-inputs"
                >
                  <Text
                    style={[styles.editButtonText, { color: colors.accent }]}
                  >
                    {UPSTREAM_TEXT.keys.editInput}
                  </Text>
                </Pressable>
              </View>
            </View>
            <SafetyNotes
              colors={colors}
              notes={safetyNotes}
              testIDPrefix="wallet-safety"
            />
            <ScriptTypeTabs
              colors={colors}
              onSelect={onSetResultScriptType}
              selected={tab.resultScriptType}
            />
            <KeyDerivationSectionList
              colors={colors}
              isDarkMode={isDarkMode}
              onOpen={openDerivationSection}
            />
          </>
        ) : fallbackDerivation.kind === 'private-key' &&
          showingPrivateRecoveryMaterial ? (
          <>
            <KeyStationEdgeNote
              colors={colors}
              kind="private"
              testID="private-key-material-safety"
            >
              <Text style={[styles.edgeNoteCopy, { color: colors.text }]}>
                {UPSTREAM_TEXT.result.privateKeyMaterialSafety}
              </Text>
            </KeyStationEdgeNote>
            <RecoveryMaterialPanel
              colors={colors}
              entropyLabel={UPSTREAM_TEXT.result.hexPrivateKey}
              result={{
                entropy: fallbackDerivation.entropy,
                wifCompressed: fallbackDerivation.wifCompressed,
                wifUncompressed: fallbackDerivation.wifUncompressed,
              }}
              wifCompressedLabel={UPSTREAM_TEXT.result.wifCompressed}
              wifUncompressedLabel={UPSTREAM_TEXT.result.wifUncompressed}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 18,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: 22,
  },
  editButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    marginLeft: 12,
    minHeight: 38,
    paddingHorizontal: 10,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fingerprint: {
    flexShrink: 1,
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 0,
  },
  hidden: {
    display: 'none',
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  nativeOverviewContent: {
    paddingTop: 0,
  },
  nativeSafetyNotes: {
    marginBottom: 16,
  },
  nativeOverviewTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  path: {
    fontFamily: 'monospace',
  },
  privateKeyTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  privateKeySummary: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 18,
  },
  edgeNoteCopy: {
    fontSize: 14,
    lineHeight: 21,
  },
  privateMaterialSafetyLead: {
    fontWeight: '700',
  },
  screen: {
    flex: 1,
  },
  safetyNotesCopy: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  safetyNotesCenteredArrow: {
    fontSize: 14,
    lineHeight: 21,
    transform: [{ translateY: -3 }],
  },
  safetyNotesCenteredArrowCopy: {
    fontSize: 14,
    lineHeight: 21,
  },
  safetyNotesCenteredArrowLine: {
    marginTop: 6,
  },
  summary: {
    marginBottom: 18,
  },
  summaryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  summaryDetails: {
    flex: 1,
    minWidth: 0,
  },
  walletDataIntro: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  walletDataSectionButton: {
    alignItems: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  walletDataSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  walletDataTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  watchOnlyLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  watchOnlyValue: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
});
