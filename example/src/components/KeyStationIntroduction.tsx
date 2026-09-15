import { useState } from 'react';
import { BottomSheet as AndroidBottomSheet } from '@expo/ui';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet, Host, Text as SwiftText, VStack } from '@expo/ui/swift-ui';
import { padding } from '@expo/ui/swift-ui/modifiers';

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
        Platform.OS === 'ios' ? (
          <Host pointerEvents="none" style={styles.swiftUiHost}>
            <BottomSheet
              fitToContents
              isPresented
              onDismiss={() => setIsDescriptionPopupVisible(false)}
              onIsPresentedChange={setIsDescriptionPopupVisible}
            >
              <VStack alignment="leading" modifiers={[padding({ all: 20 })]} spacing={12}>
                <SwiftText>{UPSTREAM_TEXT.keys.stationIntroduction.description}</SwiftText>
              </VStack>
            </BottomSheet>
          </Host>
        ) : (
          <AndroidBottomSheet
            contentPadding={20}
            isPresented
            onDismiss={() => setIsDescriptionPopupVisible(false)}
            shouldDismissOnClickOutside
          >
            <Text
              style={[styles.description, { color: colors.muted }]}
              testID="key-station-introduction-description"
            >
              {UPSTREAM_TEXT.keys.stationIntroduction.description}
            </Text>
          </AndroidBottomSheet>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
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
  swiftUiHost: {
    position: 'absolute',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    lineHeight: 17,
    textTransform: 'uppercase',
  },
});
