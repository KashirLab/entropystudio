import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyStationIntroduction } from '../components/KeyStationIntroduction';
import { FingerprintStationTabs } from '../components/KeyStationTabs';
import { NativeSelect, type NativeSelectOption } from '../components/NativeSelect';
import { diceColors } from '../features/dice/diceTheme';
import { KeyStationEdgeNote } from '../features/keyStation/components/KeyStationEdgeNote';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../features/upstreamUiCopy';

type ScriptType = 'p2sh' | 'p2sh-p2wsh' | 'p2wsh' | 'p2tr';
type KeyOrder = 'sorted' | 'listed';

type Props = {
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
};

const KEY_ORDER_OPTIONS: readonly NativeSelectOption<KeyOrder>[] = [
  { label: UPSTREAM_TEXT.multisig.keyOrders.sorted, value: 'sorted' },
  { label: UPSTREAM_TEXT.multisig.keyOrders.listed, value: 'listed' },
];

const SCRIPT_TYPES: readonly { readonly label: string; readonly value: ScriptType }[] = [
  { label: UPSTREAM_TEXT.multisig.scriptTypes.legacy, value: 'p2sh' },
  { label: UPSTREAM_TEXT.multisig.scriptTypes.nestedSegwit, value: 'p2sh-p2wsh' },
  { label: UPSTREAM_TEXT.multisig.scriptTypes.nativeSegwit, value: 'p2wsh' },
  { label: UPSTREAM_TEXT.multisig.scriptTypes.taproot, value: 'p2tr' },
];

export function MultiSignatureScreen({ isActive, isDarkMode }: Props) {
  const colors = diceColors(isDarkMode);
  const [cosigners, setCosigners] = useState(['', '', '']);
  const [descriptor, setDescriptor] = useState('');
  const [keyOrder, setKeyOrder] = useState<KeyOrder>('sorted');
  const [quorum, setQuorum] = useState('2');
  const [scriptType, setScriptType] = useState<ScriptType>('p2wsh');

  const signerCount = cosigners.length;
  const copy = UPSTREAM_TEXT.multisig;
  const quorumRequirement = UPSTREAM_UI_FALLBACK_COPY.multisig.requirement(
    quorum || '0',
    signerCount,
  );

  return (
    <SafeAreaView
      edges={[]}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[styles.screen, { backgroundColor: colors.background }, !isActive && styles.hidden]}
      testID="multisig-screen-safe-area"
    >
      <FingerprintStationTabs
        activeTabId={null}
        addAccessibilityLabel={copy.add}
        colors={colors}
        controlTestIDPrefix="multisig-station"
        deleteAccessibilityLabel={copy.delete}
        onDeleteActiveTab={() => {}}
        onOpenStation={() => {}}
        onSelectTab={() => {}}
        stationAccessibilityLabel={copy.openStation}
        stationLabel={copy.station}
        tabTestIDPrefix="multisig-tab"
        tabs={[]}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <KeyStationIntroduction
          colors={colors}
          description={copy.description}
          heading={copy.title}
          headingTestID="multisig-screen-title"
          testIDPrefix="multisig-introduction"
        />

        <View style={[styles.section, { borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.importExisting}</Text>
          <Text style={[styles.help, { color: colors.muted }]}>{copy.descriptorHelp}</Text>
          <Text style={[styles.label, { color: colors.text }]}>{copy.descriptorLabel}</Text>
          <TextInput
            multiline
            onChangeText={setDescriptor}
            placeholder={copy.descriptorPlaceholder}
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.descriptorInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={descriptor}
          />
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy.quorum}</Text>
          <Text style={[styles.help, { color: colors.muted }]}>{copy.thresholdHelp}</Text>
          <KeyStationEdgeNote colors={colors} kind="public" testID="multisig-quorum-note">
            <Text style={[styles.requirement, { color: colors.text }]}> 
              {quorumRequirement.beforeQuorum}
              <Text style={styles.requirementValue}>{quorumRequirement.quorum}</Text>
              {quorumRequirement.beforeSignerCount}
              <Text style={styles.requirementValue}>{quorumRequirement.signerCount}</Text>
              {quorumRequirement.afterSignerCount}
            </Text>
          </KeyStationEdgeNote>
          <View style={styles.thresholdRow}>
            <View style={styles.thresholdField}>
              <Text style={[styles.label, { color: colors.text }]}>{copy.thresholdLabels.quorum}</Text>
              <TextInput
                inputMode="numeric"
                onChangeText={setQuorum}
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={quorum}
              />
              <Text style={[styles.help, { color: colors.muted }]}>{copy.signaturesNeeded}</Text>
            </View>
            <View style={styles.thresholdField}>
              <Text style={[styles.label, { color: colors.text }]}>{copy.thresholdLabels.signerCount}</Text>
              <Text style={[styles.input, styles.readOnlyInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}>
                {signerCount}
              </Text>
              <Text style={[styles.help, { color: colors.muted }]}>{copy.totalSigningKeys}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}> 
          <Text style={[styles.label, { color: colors.text }]}>{copy.scriptType}</Text>
          <View style={styles.scriptGrid}>
            {SCRIPT_TYPES.map(option => {
              const selected = option.value === scriptType;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.value}
                  onPress={() => setScriptType(option.value)}
                  style={[styles.scriptButton, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.surface : 'transparent' }]}
                >
                  <Text style={[styles.scriptLabel, { color: selected ? colors.accent : colors.text }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.label, { color: colors.text }]}>{copy.keyOrder}</Text>
          <Text style={[styles.help, { color: colors.muted }]}>{copy.keyOrderHelp}</Text>
          <NativeSelect
            accessibilityLabel={copy.keyOrder}
            colors={colors}
            controlTestID="multisig-key-order"
            onValueChange={setKeyOrder}
            options={KEY_ORDER_OPTIONS}
            selectedValue={keyOrder}
          />
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}> 
          {cosigners.map((value, index) => (
            <View key={index} style={styles.cosigner}>
              <Text style={[styles.label, { color: colors.text }]}>
                {copy.cosignerLabels[index]}
              </Text>
              <TextInput
                multiline
                onChangeText={next => setCosigners(current => current.map((entry, position) => position === index ? next : entry))}
                placeholder={copy.cosignerPlaceholder}
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.cosignerInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={value}
              />
            </View>
          ))}
          <Text style={[styles.help, { color: colors.muted }]}>{copy.keyReuseNote}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, padding: 20, paddingBottom: 32 },
  cosigner: { gap: 6 },
  cosignerInput: { minHeight: 72 },
  descriptorInput: { minHeight: 104 },
  help: { fontSize: 13, lineHeight: 18 },
  hidden: { display: 'none' },
  input: { borderRadius: 6, borderWidth: 1, fontSize: 16, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, textAlignVertical: 'top' },
  label: { fontSize: 15, fontWeight: '700' },
  readOnlyInput: { textAlignVertical: 'center' },
  requirement: { fontSize: 14, lineHeight: 20 },
  requirementValue: { fontFamily: 'monospace', fontWeight: '700' },
  screen: { flex: 1 },
  scriptButton: { alignItems: 'center', borderRadius: 6, borderWidth: 1, flexBasis: '48%', flexGrow: 1, justifyContent: 'center', minHeight: 44, padding: 8 },
  scriptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scriptLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  section: { borderRadius: 8, borderWidth: 1, gap: 10, padding: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  thresholdField: { flex: 1, gap: 6 },
  thresholdRow: { flexDirection: 'row', gap: 12 },
});