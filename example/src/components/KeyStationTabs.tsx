import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import { KeyStationLifeHash } from '../features/keyStation/components/KeyStationLifeHash';
import type { KeyStationTab } from '../features/keyStation/keyStation';
import { UPSTREAM_TEXT } from '../features/upstreamUiCopy';

type Props = {
  readonly activeTabId: number | null;
  readonly colors: DiceColors;
  readonly controlTestIDPrefix: string;
  readonly onDeleteActiveTab: () => void;
  readonly onOpenKeyStation: () => void;
  readonly onSelectTab: (id: number) => void;
  readonly tabs: readonly KeyStationTab[];
};

export type FingerprintStationTab = {
  readonly fingerprint: string;
  readonly id: number;
  readonly name: string;
};

type FingerprintStationTabsProps = {
  readonly activeTabId: number | null;
  readonly addAccessibilityLabel: string;
  readonly colors: DiceColors;
  readonly deleteAccessibilityLabel: string;
  readonly onDeleteActiveTab: () => void;
  readonly onOpenStation: () => void;
  readonly onSelectTab: (id: number) => void;
  readonly stationAccessibilityLabel: string;
  readonly stationLabel: string;
  readonly tabTestIDPrefix: string;
  readonly tabs: readonly FingerprintStationTab[];
};

/** Shared Station / fingerprint-tab strip used by key-derived workspaces. */
export function FingerprintStationTabs({
  activeTabId,
  addAccessibilityLabel,
  colors,
  controlTestIDPrefix,
  deleteAccessibilityLabel,
  onDeleteActiveTab,
  onOpenStation,
  onSelectTab,
  stationAccessibilityLabel,
  stationLabel,
  tabTestIDPrefix,
  tabs,
}: FingerprintStationTabsProps) {
  const isStationActive = activeTabId === null;

  return (
    <View
      style={[styles.strip, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
      testID={`${tabTestIDPrefix}-strip`}
    >
      <ScrollView
        contentContainerStyle={styles.tabList}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
      >
        <Pressable
          accessibilityLabel={stationAccessibilityLabel}
          accessibilityRole="tab"
          accessibilityState={{ selected: isStationActive }}
          onPress={onOpenStation}
          style={({ pressed }) => [
            styles.tab,
            styles.stationTab,
            { borderBottomColor: isStationActive ? colors.accent : 'transparent' },
            pressed && styles.pressed,
          ]}
          testID={`${tabTestIDPrefix}-lab`}
        >
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.stationLabel, { color: isStationActive ? colors.text : colors.muted }]}
          >
            {stationLabel}
          </Text>
        </Pressable>
        {tabs.map(tab => {
          const selected = tab.id === activeTabId;
          return (
            <Pressable
              accessibilityLabel={tab.name}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              style={({ pressed }) => [
                styles.tab,
                { borderBottomColor: selected ? colors.accent : 'transparent' },
                pressed && styles.pressed,
              ]}
              testID={`${tabTestIDPrefix}-${tab.id}`}
            >
              <KeyStationLifeHash
                compact
                fingerprint={tab.fingerprint}
                imageTestID={`${tabTestIDPrefix}-${tab.id}-lifehash`}
              />
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                numberOfLines={1}
                style={[styles.tabLabel, { color: selected ? colors.text : colors.muted }]}
                testID={`${tabTestIDPrefix}-${tab.id}-label`}
              >
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={[styles.controls, { borderLeftColor: colors.border }]}>
        <Pressable
          accessibilityLabel={addAccessibilityLabel}
          accessibilityRole="button"
          onPress={onOpenStation}
          style={({ pressed }) => [styles.control, pressed && styles.pressed]}
          testID={`${controlTestIDPrefix}-add`}
        >
          <Text style={[styles.controlIcon, { color: colors.accent }]}>+</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={deleteAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: isStationActive }}
          disabled={isStationActive}
          onPress={onDeleteActiveTab}
          style={({ pressed }) => [
            styles.control,
            isStationActive && styles.disabled,
            pressed && styles.pressed,
          ]}
          testID={`${controlTestIDPrefix}-delete`}
        >
          <Text style={[styles.controlIcon, { color: isStationActive ? colors.muted : colors.error }]}>-</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function KeyStationTabs({
  activeTabId,
  colors,
  onDeleteActiveTab,
  onOpenKeyStation,
  onSelectTab,
  tabs,
}: Props) {
  return (
    <FingerprintStationTabs
      activeTabId={activeTabId}
      addAccessibilityLabel={UPSTREAM_TEXT.keys.add}
      colors={colors}
      controlTestIDPrefix="key-station"
      deleteAccessibilityLabel={UPSTREAM_TEXT.keys.delete}
      onDeleteActiveTab={onDeleteActiveTab}
      onOpenStation={onOpenKeyStation}
      onSelectTab={onSelectTab}
      stationAccessibilityLabel={UPSTREAM_TEXT.keys.station}
      stationLabel={UPSTREAM_TEXT.keys.station}
      tabTestIDPrefix="key-station-tab"
      tabs={tabs.map(tab => ({ fingerprint: tab.masterFingerprint, id: tab.id, name: tab.name }))}
    />
  );
}

const styles = StyleSheet.create({
  control: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 42,
  },
  controlIcon: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 28,
  },
  controls: {
    flexDirection: 'row',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.72,
  },
  stationLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  stationTab: {
    minWidth: 112,
  },
  strip: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 48,
  },
  tab: {
    alignItems: 'center',
    borderBottomWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: 148,
    minHeight: 48,
    minWidth: 92,
    paddingHorizontal: 14,
  },
  tabLabel: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  tabList: {
    alignItems: 'stretch',
  },
  tabScroll: {
    flex: 1,
    minWidth: 0,
  },
});
