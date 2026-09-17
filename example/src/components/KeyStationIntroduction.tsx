import { useState, type ReactNode } from 'react';
import { BottomSheet } from '@expo/ui';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DiceColors } from '../features/dice/diceTheme';
import { UPSTREAM_TEXT } from '../features/upstreamUiCopy';

type Props = {
  readonly colors: DiceColors;
  readonly description?: string;
  readonly descriptionScrollable?: boolean;
  readonly heading?: string;
  readonly headingTestID?: string;
  readonly popupContent?: ReactNode;
  readonly sheetHeight?: number;
  readonly testIDPrefix?: string;
};

export function KeyStationIntroduction({
  colors,
  description = UPSTREAM_TEXT.keys.stationIntroduction.description,
  descriptionScrollable = false,
  heading = UPSTREAM_TEXT.keys.stationIntroduction.heading,
  headingTestID,
  popupContent,
  sheetHeight = 280,
  testIDPrefix = 'key-station-introduction',
}: Props) {
  const [isDescriptionPopupVisible, setIsDescriptionPopupVisible] = useState(false);

  return (
    <View style={styles.container} testID={testIDPrefix}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsDescriptionPopupVisible(true)}
        style={styles.headingToggle}
        testID={`${testIDPrefix}-description-toggle`}
      >
        <View style={styles.headingContent}>
          <Text
            accessibilityElementsHidden
            style={[styles.disclosureIndicator, { color: colors.muted }]}
            testID={`${testIDPrefix}-description-indicator`}
          >
            ▶
          </Text>
          <Text style={[styles.heading, { color: colors.text }]} testID={headingTestID}>
            {heading}
          </Text>
        </View>
      </Pressable>
      {isDescriptionPopupVisible ? (
        <BottomSheet
          contentPadding={20}
          isPresented
          onDismiss={() => setIsDescriptionPopupVisible(false)}
          snapPoints={Platform.OS === 'ios' ? [{ height: sheetHeight }] : undefined}
          shouldDismissOnClickOutside
        >
          {descriptionScrollable ? (
            <ScrollView
              showsVerticalScrollIndicator
              style={{ height: sheetHeight - 40 }}
              testID={`${testIDPrefix}-description-scroll`}
            >
              {popupContent ?? (
                <Text
                  style={[styles.description, { color: colors.muted }]}
                  testID={`${testIDPrefix}-description`}
                >
                  {description}
                </Text>
              )}
            </ScrollView>
          ) : popupContent ? (
            popupContent
          ) : (
            <Text
              style={[styles.description, { color: colors.muted }]}
              testID={`${testIDPrefix}-description`}
            >
              {description}
            </Text>
          )}
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
});
