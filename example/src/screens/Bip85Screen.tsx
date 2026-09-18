import { useEffect, useMemo, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeSelect, type NativeSelectOption } from '../components/NativeSelect';
import { FingerprintStationTabs } from '../components/KeyStationTabs';
import {
  PrivateDataFieldLabel,
  PrivateDataVisibilityControl,
} from '../features/keyStation/components/PrivateDataVisibilityControl';
import { KeyStationEdgeNote } from '../features/keyStation/components/KeyStationEdgeNote';
import { KeyStationLifeHash } from '../features/keyStation/components/KeyStationLifeHash';
import { KeyStationIntroduction } from '../components/KeyStationIntroduction';
import { diceColors, type DiceColors } from '../features/dice/diceTheme';
import type { KeyStationTab } from '../features/keyStation/keyStation';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../features/upstreamUiCopy';
import {
  Bip85Application,
  EntropyStudioError_Tags,
  bip85Derive,
  bip85Path,
} from '../native/entropyStudio';
import type { Bip85Result } from '../native/entropyStudio';

type ApplicationId = 'bip39' | 'wif' | 'xprv' | 'hex' | 'password-base64' | 'password-base85';

type Props = {
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly tabs: readonly KeyStationTab[];
};

const APPLICATION_OPTIONS: readonly NativeSelectOption<ApplicationId>[] = [
  { label: UPSTREAM_TEXT.bip85.form.applicationOptions.bip39, value: 'bip39' },
  { label: UPSTREAM_TEXT.bip85.form.applicationOptions.wif, value: 'wif' },
  { label: UPSTREAM_TEXT.bip85.form.applicationOptions.xprv, value: 'xprv' },
  { label: UPSTREAM_TEXT.bip85.form.applicationOptions.hex, value: 'hex' },
  { label: UPSTREAM_TEXT.bip85.form.applicationOptions.passwordBase64, value: 'password-base64' },
  { label: UPSTREAM_TEXT.bip85.form.applicationOptions.passwordBase85, value: 'password-base85' },
];

const WORD_OPTIONS: readonly NativeSelectOption<number>[] = [
  { label: UPSTREAM_TEXT.bip85.form.words.twelve, value: 12 },
  { label: UPSTREAM_TEXT.bip85.form.words.fifteen, value: 15 },
  { label: UPSTREAM_TEXT.bip85.form.words.eighteen, value: 18 },
  { label: UPSTREAM_TEXT.bip85.form.words.twentyOne, value: 21 },
  { label: UPSTREAM_TEXT.bip85.form.words.twentyFour, value: 24 },
];

function nativeApplication(application: ApplicationId): Bip85Application {
  switch (application) {
    case 'bip39': return Bip85Application.Bip39;
    case 'wif': return Bip85Application.Wif;
    case 'xprv': return Bip85Application.Xprv;
    case 'hex': return Bip85Application.Hex;
    case 'password-base64': return Bip85Application.PasswordBase64;
    case 'password-base85': return Bip85Application.PasswordBase85;
  }
}

function errorCopy(error: unknown): string {
  const tag = (error as { tag?: EntropyStudioError_Tags } | null)?.tag;
  if (tag === EntropyStudioError_Tags.InvalidBip85Root) return UPSTREAM_TEXT.bip85.errors.root;
  return UPSTREAM_TEXT.error.generic;
}

function secretLabel(result: Bip85Result): string {
  const copy = UPSTREAM_UI_FALLBACK_COPY.bip85;
  switch (result.application) {
    case Bip85Application.Bip39:
      return copy.bip39SecretLabel(result.wordCount);
    case Bip85Application.Wif:
      return copy.wifSecretLabel(result.isTestnet);
    case Bip85Application.Xprv:
      return copy.xprvSecretLabel(result.isTestnet);
    case Bip85Application.Hex:
      return copy.hexSecretLabel(result.size);
    case Bip85Application.PasswordBase64:
      return copy.passwordBase64SecretLabel(result.size);
    case Bip85Application.PasswordBase85:
      return copy.passwordBase85SecretLabel(result.size);
  }
}

function sourceOptionStyle(colors: DiceColors, selected: boolean) {
  return [
    styles.sourceOption,
    {
      backgroundColor: selected ? colors.surface : 'transparent',
      borderColor: selected ? colors.accent : colors.border,
    },
  ];
}

function rootInputStyle(colors: DiceColors, height: number) {
  return [
    styles.input,
    styles.rootInput,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
      height,
    },
  ];
}

export function Bip85Screen({ isActive, isDarkMode, tabs }: Props) {
  const colors = diceColors(isDarkMode);
  const sourceTabs = tabs.filter(tab => Boolean(tab.rootXprv));
  const [application, setApplication] = useState<ApplicationId>('bip39');
  const [index, setIndex] = useState('0');
  const [manualRoot, setManualRoot] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(24);
  const [size, setSize] = useState('32');
  const [rootInputHeight, setRootInputHeight] = useState(96);
  const [children, setChildren] = useState<readonly Bip85Result[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [privateVisible, setPrivateVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const copyStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedSource = sourceTabs.find(tab => tab.id === selectedSourceId) ?? null;
  const activeChild = selectedChildIndex === null ? null : children[selectedChildIndex] ?? null;
  const nativeApp = nativeApplication(application);
  const parsedSize = Number(size);
  const path = useMemo(() => {
    try {
      return bip85Path(nativeApp, index, wordCount, parsedSize);
    } catch {
      return '';
    }
  }, [index, nativeApp, parsedSize, wordCount]);

  useEffect(() => () => {
    if (copyStatusTimer.current !== null) {
      clearTimeout(copyStatusTimer.current);
    }
  }, []);

  function selectStation() {
    setSelectedChildIndex(null);
    setPrivateVisible(false);
    setCopyStatus('');
  }

  function deriveChild() {
    const rootXprv = manualRoot.trim() || selectedSource?.rootXprv || '';
    if (!rootXprv) {
      setError(UPSTREAM_TEXT.bip85.errors.parent);
      return;
    }
    try {
      const result = bip85Derive({
        application: nativeApp,
        index,
        rootXprv,
        size: parsedSize,
        wordCount,
      });
      setChildren(current => [...current, result]);
      setSelectedChildIndex(children.length);
      setPrivateVisible(false);
      setCopyStatus('');
      setError('');
    } catch (exception) {
      setError(errorCopy(exception));
    }
  }

  function deleteActiveChild() {
    if (selectedChildIndex === null) return;
    setChildren(current => current.filter((_, position) => position !== selectedChildIndex));
    setSelectedChildIndex(null);
    setPrivateVisible(false);
    setCopyStatus('');
  }

  async function copyActiveChildSeedPhrase() {
    if (!activeChild) return;
    try {
      await Clipboard.setStringAsync(activeChild.secret);
      setCopyStatus(UPSTREAM_TEXT.vanity.result.copied);
      if (copyStatusTimer.current !== null) {
        clearTimeout(copyStatusTimer.current);
      }
      copyStatusTimer.current = setTimeout(() => setCopyStatus(''), 1600);
    } catch {
      // Clipboard access can be unavailable in an unsupported runtime.
    }
  }

  return (
    <SafeAreaView
      edges={[]}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[styles.screen, { backgroundColor: colors.background }, !isActive && styles.hidden]}
      testID="bip85-screen-safe-area"
    >
      <FingerprintStationTabs
        activeTabId={selectedChildIndex === null ? null : selectedChildIndex + 1}
        addAccessibilityLabel={UPSTREAM_TEXT.bip85.actions.add}
        colors={colors}
        controlTestIDPrefix="bip85-tab"
        deleteAccessibilityLabel={UPSTREAM_TEXT.bip85.actions.delete}
        onDeleteActiveTab={deleteActiveChild}
        onOpenStation={selectStation}
        onSelectTab={id => {
          setSelectedChildIndex(id - 1);
          setPrivateVisible(false);
          setCopyStatus('');
        }}
        stationAccessibilityLabel={UPSTREAM_TEXT.bip85.station}
        stationLabel={UPSTREAM_TEXT.bip85.station}
        tabTestIDPrefix="bip85-tab"
        tabs={children.map((child, position) => ({
          fingerprint: child.fingerprint,
          id: position + 1,
          name: child.fingerprint,
        }))}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeChild ? (
          <View>
            <View style={styles.summary}>
              <View style={styles.summaryHeader}>
                <KeyStationLifeHash
                  fingerprint={activeChild.fingerprint}
                  imageTestID="bip85-child-fingerprint-lifehash"
                />
                <View style={styles.summaryDetails}>
                  <Text
                    selectable
                    style={[styles.fingerprint, { color: colors.text }]}
                    testID="bip85-child-fingerprint"
                  >
                    {activeChild.fingerprint}
                  </Text>
                  <Text selectable style={[styles.path, { color: colors.muted }]}>
                    {activeChild.path}
                  </Text>
                  <View style={styles.parentRelationship}>
                    <Text style={[styles.parentCopy, { color: colors.muted }]}>
                      {UPSTREAM_TEXT.bip85.result.childOfParent}
                    </Text>
                    <KeyStationLifeHash
                      compact
                      fingerprint={activeChild.parentFingerprint}
                      imageTestID="bip85-parent-fingerprint-lifehash"
                    />
                    <Text
                      selectable
                      style={[styles.parentFingerprint, { color: colors.text }]}
                    >
                      {activeChild.parentFingerprint}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <KeyStationEdgeNote
              colors={colors}
              kind="private"
              testID="bip85-child-private-description"
            >
              <Text style={[styles.help, { color: colors.muted }]}>
                {UPSTREAM_UI_FALLBACK_COPY.bip85.childPrivacyDescription}
              </Text>
            </KeyStationEdgeNote>
            <PrivateDataVisibilityControl
              colors={colors}
              onChange={setPrivateVisible}
              testID="bip85-private-toggle"
              visible={privateVisible}
            />
            <PrivateDataFieldLabel
              colors={colors}
              label={secretLabel(activeChild)}
              onChange={setPrivateVisible}
              testID="bip85-child-secret-visibility"
              visible={privateVisible}
            />
            <Text selectable style={[styles.secret, { color: colors.privateValue }]} testID="bip85-child-secret">
              {privateVisible ? activeChild.secret : UPSTREAM_TEXT.result.privateValueMask}
            </Text>
            <PrivateDataFieldLabel
              colors={colors}
              label={UPSTREAM_TEXT.bip85.result.derivedEntropy}
              onChange={setPrivateVisible}
              testID="bip85-child-entropy-visibility"
              visible={privateVisible}
            />
            <Text selectable style={[styles.secret, { color: colors.privateValue }]}>
              {privateVisible ? activeChild.entropyHex : UPSTREAM_TEXT.result.privateValueMask}
            </Text>
            <KeyStationEdgeNote
              colors={colors}
              kind="private"
              testID="bip85-copy-child-seed-phrase-note"
            >
              <Text style={[styles.help, { color: colors.text }]}>
                {UPSTREAM_UI_FALLBACK_COPY.bip85.copyChildSeedPhraseNote}
              </Text>
            </KeyStationEdgeNote>
            <View style={styles.copyActions}>
              <Pressable
                accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.bip85.copyChildSeedPhrase}
                accessibilityRole="button"
                onPress={copyActiveChildSeedPhrase}
                style={[styles.copyButton, { borderColor: colors.border }]}
                testID="bip85-copy-child-seed-phrase"
              >
                <Text style={{ color: colors.accent }}>
                  {UPSTREAM_UI_FALLBACK_COPY.bip85.copyChildSeedPhrase}
                </Text>
              </Pressable>
              {copyStatus ? (
                <Text accessibilityLiveRegion="polite" style={[styles.help, { color: colors.muted }]} testID="bip85-copy-status">
                  {copyStatus}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <>
            <KeyStationIntroduction
              colors={colors}
              description={UPSTREAM_TEXT.bip85.intro.description}
              heading={UPSTREAM_TEXT.bip85.intro.title}
              headingTestID="bip85-screen-title"
              testIDPrefix="bip85-introduction"
            />
            <KeyStationEdgeNote colors={colors} kind="public">
              <Text style={[styles.help, { color: colors.text }]}>{UPSTREAM_TEXT.bip85.source.note}</Text>
            </KeyStationEdgeNote>
            <KeyStationEdgeNote colors={colors} kind="private">
              <Text style={[styles.help, { color: colors.text }]}>{UPSTREAM_TEXT.bip85.source.retention}</Text>
            </KeyStationEdgeNote>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>{UPSTREAM_TEXT.bip85.source.heading}</Text>
              <View style={styles.sourceOptions}>
                {sourceTabs.map(tab => {
                  const selected = selectedSource?.id === tab.id;
                  return (
                    <Pressable
                      accessibilityLabel={tab.name}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      key={tab.id}
                      onPress={() => {
                        setSelectedSourceId(tab.id);
                        setManualRoot(tab.rootXprv ?? '');
                        setError('');
                      }}
                      style={sourceOptionStyle(colors, selected)}
                      testID={`bip85-source-${tab.id}`}
                    >
                      <Text style={{ color: selected ? colors.text : colors.muted }}>{tab.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>{UPSTREAM_TEXT.bip85.source.root}</Text>
              <TextInput
                accessibilityLabel={UPSTREAM_TEXT.bip85.source.root}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                numberOfLines={4}
                onChangeText={value => { setManualRoot(value); setError(''); }}
                onContentSizeChange={event => {
                  setRootInputHeight(Math.max(96, Math.ceil(event.nativeEvent.contentSize.height)));
                }}
                placeholder={UPSTREAM_TEXT.bip85.source.rootPlaceholder}
                placeholderTextColor={colors.placeholder}
                scrollEnabled={false}
                spellCheck={false}
                style={rootInputStyle(colors, rootInputHeight)}
                testID="bip85-root-input"
                value={manualRoot}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>{UPSTREAM_TEXT.bip85.form.application}</Text>
              <NativeSelect accessibilityLabel={UPSTREAM_TEXT.bip85.form.application} colors={colors} controlTestID="bip85-application" onValueChange={setApplication} options={APPLICATION_OPTIONS} selectedValue={application} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>{UPSTREAM_TEXT.bip85.form.index}</Text>
              <TextInput accessibilityLabel={UPSTREAM_TEXT.bip85.form.index} keyboardType="number-pad" onChangeText={setIndex} style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} testID="bip85-index" value={index} />
              <Text style={[styles.help, { color: colors.muted }]}>{UPSTREAM_TEXT.bip85.form.indexHelp}</Text>
            </View>
            {application === 'bip39' ? (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>{UPSTREAM_TEXT.bip85.form.wordCount}</Text>
                <NativeSelect accessibilityLabel={UPSTREAM_TEXT.bip85.form.wordCount} colors={colors} controlTestID="bip85-word-count" onValueChange={setWordCount} options={WORD_OPTIONS} selectedValue={wordCount} />
                <Text style={[styles.help, { color: colors.muted }]}>{UPSTREAM_TEXT.bip85.form.wordHelp}</Text>
              </View>
            ) : application === 'hex' || application === 'password-base64' || application === 'password-base85' ? (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>{application === 'hex' ? UPSTREAM_TEXT.bip85.form.hexBytes : UPSTREAM_TEXT.bip85.form.passwordLength}</Text>
                <TextInput keyboardType="number-pad" onChangeText={setSize} style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} testID="bip85-size" value={size} />
                <Text style={[styles.help, { color: colors.muted }]}>{application === 'hex' ? UPSTREAM_TEXT.bip85.form.hexHelp : UPSTREAM_TEXT.bip85.form.passwordHelp}</Text>
              </View>
            ) : null}
            <Text style={[styles.path, { color: colors.muted }]}>{UPSTREAM_TEXT.bip85.form.path} {path}</Text>
            {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
            <View style={styles.actions}>
              <Pressable accessibilityLabel={UPSTREAM_TEXT.bip85.actions.derive} accessibilityRole="button" onPress={deriveChild} style={[styles.primaryButton, { backgroundColor: colors.accent }]} testID="bip85-derive">
                <Text style={{ color: colors.onAccent }}>{UPSTREAM_TEXT.bip85.actions.derive}</Text>
              </Pressable>
              <Pressable accessibilityLabel={UPSTREAM_TEXT.bip85.actions.clear} accessibilityRole="button" onPress={() => { setManualRoot(''); setSelectedSourceId(null); setError(''); }} style={[styles.secondaryButton, { borderColor: colors.border }]} testID="bip85-clear-parent">
                <Text style={{ color: colors.accent }}>{UPSTREAM_TEXT.bip85.actions.clear}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  content: { padding: 24, paddingBottom: 36 },
  copyActions: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  copyButton: { alignItems: 'center', borderRadius: 8, borderWidth: 1, minHeight: 44, paddingHorizontal: 14, justifyContent: 'center' },
  error: { fontSize: 14, lineHeight: 20, marginTop: 12 },
  fieldGroup: { gap: 6, marginTop: 18 },
  fieldLabel: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  fingerprint: { fontFamily: 'monospace', fontSize: 18, fontWeight: '700', lineHeight: 24 },
  help: { fontSize: 13, lineHeight: 19 },
  hidden: { display: 'none' },
  input: { borderRadius: 8, borderWidth: 1, fontSize: 16, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10 },
  parentCopy: { fontSize: 13, lineHeight: 19, marginRight: 6 },
  parentFingerprint: { fontFamily: 'monospace', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  parentRelationship: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  path: { fontFamily: 'monospace', fontSize: 13, lineHeight: 20, marginTop: 2 },
  primaryButton: { alignItems: 'center', borderRadius: 8, flex: 1, minHeight: 44, padding: 12 },
  rootInput: { minHeight: 96, textAlignVertical: 'top' },
  screen: { flex: 1 },
  secondaryButton: { alignItems: 'center', borderRadius: 8, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  secret: { fontFamily: 'monospace', fontSize: 14, lineHeight: 21, marginBottom: 16 },
  section: { marginTop: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 8 },
  sourceOption: { borderRadius: 8, borderWidth: 1, padding: 10 },
  sourceOptions: { gap: 8 },
  summary: { marginBottom: 18 },
  summaryDetails: { flex: 1, minWidth: 0 },
  summaryHeader: { alignItems: 'center', flexDirection: 'row' },
});
