import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeSelect } from '../components/NativeSelect';
import { WordCountSelector } from '../features/dice/components/WordCountSelector';
import { diceColors } from '../features/dice/diceTheme';
import { EntropySyncControl, useEntropySync } from '../features/entropySync';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../features/upstreamUiCopy';
import { NativeSettingsNavigator } from '../components/NativeSettingsNavigator';
import {
  VANITY_SCRIPT_OPTIONS,
  type VanityScriptId,
} from './VanityScreen';

const CONTENT_HORIZONTAL_PADDING = 24;

type Props = {
  readonly autocompleteEnabled: boolean;
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onSetAutocompleteEnabled: (enabled: boolean) => void;
  readonly onSetVanityScript: (script: VanityScriptId) => void;
  readonly onReturnToMethod: () => void;
  readonly vanityScript: VanityScriptId;
};

export function EntropySyncSettingsScreen({
  autocompleteEnabled,
  isActive,
  isDarkMode,
  onSetAutocompleteEnabled,
  onSetVanityScript,
  onReturnToMethod,
  vanityScript,
}: Props) {
  const colors = diceColors(isDarkMode);
  const entropySync = useEntropySync();

  return (
    <SafeAreaView
      edges={[]}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[
        styles.screen,
        { backgroundColor: colors.background },
        !isActive && styles.hidden,
      ]}
      testID="entropy-sync-settings-safe-area"
    >
      <NativeSettingsNavigator
        backgroundColor={colors.background}
        isActive={isActive}
        isDarkMode={isDarkMode}
        label={UPSTREAM_TEXT.keys.tabLabel}
        onReturnToMethod={onReturnToMethod}
        rowBackgroundColor={colors.segment}
        seedColor={colors.accent}
        vanityChildren={
          <View style={[styles.content, { backgroundColor: colors.background }]}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                {UPSTREAM_TEXT.vanity.form.addressType}
              </Text>
              <NativeSelect
                accessibilityLabel={UPSTREAM_TEXT.vanity.form.addressType}
                colors={colors}
                controlTestID="vanity-settings-script"
                onValueChange={onSetVanityScript}
                options={VANITY_SCRIPT_OPTIONS}
                selectedValue={vanityScript}
              />
            </View>
          </View>
        }
        vanityLabel={UPSTREAM_TEXT.vanity.tabLabel}
      >
        <View
          style={[styles.content, { backgroundColor: colors.background }]}
          testID="entropy-sync-settings-screen"
        >
            <WordCountSelector
              colors={colors}
              label={UPSTREAM_TEXT.seedLength.label}
              onSelect={entropySync.selectTargetWords}
              valueLabel={UPSTREAM_TEXT.seedLength.words.replace(
                '{n}',
                String(entropySync.targetWords),
              )}
              wordCount={entropySync.targetWords}
            />
            <View style={[styles.autocompleteControl, { borderTopColor: colors.border }]}>
              <View style={styles.autocompleteCopy}>
                <Text style={[styles.autocompleteLabel, { color: colors.text }]}>
                  {UPSTREAM_UI_FALLBACK_COPY.seedPhrase.autocomplete}
                </Text>
              </View>
              <Switch
                accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.seedPhrase.autocomplete}
                onValueChange={onSetAutocompleteEnabled}
                testID="seed-phrase-autocomplete-setting"
                thumbColor={autocompleteEnabled ? colors.surface : colors.muted}
                trackColor={{ false: colors.segment, true: colors.accent }}
                value={autocompleteEnabled}
              />
            </View>
            <EntropySyncControl
              colors={colors}
              enabled={entropySync.enabled}
              onDisable={entropySync.disable}
              onEnable={() => entropySync.enable()}
              snapshot={entropySync.snapshot}
              testID="entropy-sync-settings"
            />
        </View>
      </NativeSettingsNavigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  autocompleteControl: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
  },
  autocompleteCopy: {
    flex: 1,
    paddingRight: 12,
  },
  autocompleteLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  fieldGroup: {
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 6,
  },
  hidden: {
    display: 'none',
  },
  screen: {
    flex: 1,
  },
});
