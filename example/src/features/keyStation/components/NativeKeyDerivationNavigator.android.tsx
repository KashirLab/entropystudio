import { useEffect, useState, type ReactElement } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { Host, List, ListItem } from '@expo/ui';

import type { DiceColors } from '../../dice/diceTheme';
import type { KeyDerivationSection } from './keyDerivationSectionRows';
import { KEY_DERIVATION_SECTION_ROWS } from './keyDerivationSectionRows';

type Props = {
  readonly children: ReactElement;
  readonly colors: DiceColors;
  readonly details: Readonly<Record<KeyDerivationSection, ReactElement>>;
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly onReturnToStation: () => void;
  readonly privateDataVisible: boolean;
  readonly rootTitle: string;
};

/** Compose has no SwiftUI navigation stack; preserve the same destination flow. */
export function NativeKeyDerivationNavigator({
  children,
  colors,
  details,
  isActive,
  isDarkMode,
  onReturnToStation,
  privateDataVisible: _privateDataVisible,
  rootTitle: _rootTitle,
}: Props) {
  const [destination, setDestination] = useState<KeyDerivationSection | null>(
    null,
  );
  useEffect(() => {
    if (!isActive) return undefined;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (destination) setDestination(null);
        else onReturnToStation();
        return true;
      },
    );
    return () => subscription.remove();
  }, [destination, isActive, onReturnToStation]);
  if (destination) return details[destination];
  return (
    <View style={styles.screen}>
      {children}
      <Host
        colorScheme={isDarkMode ? 'dark' : 'light'}
        seedColor={colors.accent}
        style={styles.listHost}
      >
        <List testID="key-derivation-navigation-list">
          {KEY_DERIVATION_SECTION_ROWS.map(row => (
            <ListItem
              colors={{ containerColor: colors.segment }}
              key={row.id}
              onPress={() => setDestination(row.id)}
              testID={`open-key-derivation-${row.id}`}
              trailing="›"
            >
              {row.label}
            </ListItem>
          ))}
        </List>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  listHost: { height: 320 },
  screen: { flex: 1 },
});
