import { ListItem } from '@expo/ui';
import { Host, List } from '@expo/ui/swift-ui';
import { background, listRowBackground, scrollContentBackground } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import type { DiceColors } from '../../dice/diceTheme';
import { KEY_DERIVATION_SECTION_ROWS, type KeyDerivationSection } from './keyDerivationSectionRows';

export type { KeyDerivationSection } from './keyDerivationSectionRows';

type Props = {
  readonly colors: DiceColors;
  readonly isDarkMode: boolean;
  readonly onOpen: (section: KeyDerivationSection) => void;
};

/** Mirrors the Settings list's SwiftUI background and row treatment. */
export function KeyDerivationSectionList({ colors, isDarkMode, onOpen }: Props) {
  return (
    <Host
      colorScheme={isDarkMode ? 'dark' : 'light'}
      modifiers={[background(colors.background)]}
      seedColor={colors.accent}
      style={styles.host}
    >
      <List modifiers={[background(colors.background), scrollContentBackground('hidden')]} testID="key-derivation-section-list">
        {KEY_DERIVATION_SECTION_ROWS.map(row => (
          <ListItem
            key={row.id}
            modifiers={[listRowBackground(colors.segment)]}
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
