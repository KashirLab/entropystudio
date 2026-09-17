import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Host, List, ListItem } from '@expo/ui';

import { WordCountSelector } from '../features/dice/components/WordCountSelector';
import { diceColors } from '../features/dice/diceTheme';
import { EntropySyncControl, useEntropySync } from '../features/entropySync';
import { UPSTREAM_TEXT, UPSTREAM_UI_FALLBACK_COPY } from '../features/upstreamUiCopy';

const CONTENT_HORIZONTAL_PADDING = 24;

type Props = {
  readonly autocompleteEnabled: boolean;
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onSetAutocompleteEnabled: (enabled: boolean) => void;
  readonly onReturnToMethod: () => void;
};

export function EntropySyncSettingsScreen({
  autocompleteEnabled,
  isActive,
  isDarkMode,
  onSetAutocompleteEnabled,
  onReturnToMethod,
}: Props) {
  const colors = diceColors(isDarkMode);
  const entropySync = useEntropySync();
  const [activeSettings, setActiveSettings] = useState<'list' | 'keys'>('list');

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeSettings === 'keys') {
        setActiveSettings('list');
      } else {
        onReturnToMethod();
      }
      return true;
    });
    return () => subscription.remove();
  }, [activeSettings, isActive, onReturnToMethod]);

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
      <View
        style={[
          styles.content,
          activeSettings === 'list' && styles.settingsListContent,
        ]}
        testID="entropy-sync-settings-screen"
      >
        {activeSettings === 'list' ? (
          <Host
            colorScheme={isDarkMode ? 'dark' : 'light'}
            seedColor={colors.accent}
            style={styles.nativeListHost}
            useViewportSizeMeasurement
          >
            <List testID="settings-list">
              <ListItem
                onPress={() => setActiveSettings('keys')}
                testID="open-keys-settings"
                trailing="›"
              >
                {UPSTREAM_TEXT.keys.tabLabel}
              </ListItem>
            </List>
          </Host>
        ) : (
          <>
            <Pressable
              accessibilityLabel={UPSTREAM_UI_FALLBACK_COPY.common.back}
              accessibilityRole="button"
              onPress={() => setActiveSettings('list')}
              style={styles.backButton}
              testID="close-keys-settings"
            >
              <Text style={[styles.backButtonText, { color: colors.accent }]}>
                {UPSTREAM_UI_FALLBACK_COPY.common.back}
              </Text>
            </Pressable>
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
          </>
        )}
      </View>
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
  backButton: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 36,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
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
  hidden: {
    display: 'none',
  },
  nativeListHost: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  settingsListContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
