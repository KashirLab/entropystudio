import { useState } from 'react';
import { BottomSheet } from '@expo/ui';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import { UPSTREAM_TEXT } from '../features/upstreamUiCopy';

type Props = {
  readonly colors: DiceColors;
};

export function KeyStationIntroduction({ colors }: Props) {
  const [isDescriptionPopupVisible, setIsDescriptionPopupVisible] = useState(false);

  return (
    <View style={styles.container} testID="key-station-introduction">
      <Text style={[styles.title, { color: colors.accent }]}>
        {UPSTREAM_TEXT.keys.stationIntroduction.title}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsDescriptionPopupVisible(true)}
        style={styles.headingToggle}
        testID="key-station-introduction-description-toggle"
      >
        <View style={styles.headingContent}>
          <Text
            accessibilityElementsHidden
            style={[styles.disclosureIndicator, { color: colors.muted }]}
            testID="key-station-introduction-description-indicator"
          >
            ▶
          </Text>
          <Text style={[styles.heading, { color: colors.text }]}>
            {UPSTREAM_TEXT.keys.stationIntroduction.heading}
          </Text>
        </View>
      </Pressable>
      {isDescriptionPopupVisible ? (
        <BottomSheet
          contentPadding={20}
          isPresented
          onDismiss={() => setIsDescriptionPopupVisible(false)}
          snapPoints={Platform.OS === 'ios' ? [{ height: 280 }] : undefined}
          shouldDismissOnClickOutside
        >
          <Text
            style={[styles.description, { color: colors.muted }]}
            testID="key-station-introduction-description"
          >
            {UPSTREAM_TEXT.keys.stationIntroduction.description}
          </Text>
        </BottomSheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  description: {
    fontSize: 17,
    lineHeight: 23,
  },
  disclosureIndicator: {
    fontSize: 16,
    lineHeight: 25,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
    marginBottom: 5,
  },
  headingContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  headingToggle: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    lineHeight: 17,
    textTransform: 'uppercase',
  },
});
