import { Host, List, ListItem } from '@expo/ui';
import { StyleSheet } from 'react-native';

import type { DiceColors } from '../../dice/diceTheme';
import { KEY_DERIVATION_SECTION_ROWS, type KeyDerivationSection } from './keyDerivationSectionRows';

export type { KeyDerivationSection } from './keyDerivationSectionRows';

type Props = {
  readonly colors: DiceColors;
  readonly isDarkMode: boolean;
  readonly onOpen: (section: KeyDerivationSection) => void;
};

/** Native settings-style rows for wallet and selected-account data. */
export function KeyDerivationSectionList({ colors, isDarkMode, onOpen }: Props) {
  return (
    <Host
      colorScheme={isDarkMode ? 'dark' : 'light'}
      seedColor={colors.accent}
      style={[styles.host, { backgroundColor: colors.background }]}
    >
      <List testID="key-derivation-section-list">
        {KEY_DERIVATION_SECTION_ROWS.map(row => (
          <ListItem
            colors={{ containerColor: colors.segment, contentColor: colors.text, trailingContentColor: colors.muted }}
            key={row.id}
            onPress={() => onOpen(row.id)}
            testID={`open-key-derivation-${row.id}`}
            trailing="›"
          >
            {row.label}
          </ListItem>
        ))}
      </List>
    </Host>
  );
}

const styles = StyleSheet.create({ host: { height: 320 } });
