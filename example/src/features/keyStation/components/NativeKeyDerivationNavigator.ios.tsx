import { useEffect, useState, type ReactElement } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import {
  Group,
  List,
  NavigationDestination,
  NavigationLink,
  NavigationStack,
  RNHostView,
  Host,
  Text,
} from '@expo/ui/swift-ui';
import {
  background,
  listRowBackground,
  listSectionSpacing,
  navigationTitle,
  scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers';

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
  readonly rootTitle: string;
};

/** Full-screen SwiftUI navigation for Key Station's derived-key rows. */
export function NativeKeyDerivationNavigator({
  children,
  colors,
  details,
  isActive,
  isDarkMode,
  onReturnToStation,
  rootTitle,
}: Props) {
  // Keep the SwiftUI route in React state, as Settings does. An uncontrolled
  // NavigationStack owns its path in SwiftUI state, which can be recreated
  // when the hosted React Native destination completes its first layout.
  const [path, setPath] = useState<string[]>([]);

  useEffect(() => {
    if (!isActive) {
      setPath([]);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (path.length > 0) {
        setPath([]);
      } else {
        onReturnToStation();
      }
      return true;
    });
    return () => subscription.remove();
  }, [isActive, onReturnToStation, path.length]);

  return (
    <Host
      colorScheme={isDarkMode ? 'dark' : 'light'}
      modifiers={[background(colors.background)]}
      seedColor={colors.accent}
      style={styles.host}
      useViewportSizeMeasurement
    >
      <NavigationStack onPathChange={setPath} path={path}>
        <Group
          modifiers={[
            navigationTitle(rootTitle),
            background(colors.background),
          ]}
        >
          <List
            modifiers={[
              background(colors.background),
              // Keep the Settings-style inset rows while removing only the
              // empty inter-section space above the overview content.
              listSectionSpacing(0),
              scrollContentBackground('hidden'),
            ]}
            testID="key-derivation-navigation-list"
          >
            <Group modifiers={[listRowBackground(colors.background)]}>
              <RNHostView matchContents>{children}</RNHostView>
            </Group>
            {KEY_DERIVATION_SECTION_ROWS.map(row => (
              <NavigationLink
                key={row.id}
                modifiers={[listRowBackground(colors.segment)]}
                testID={`open-key-derivation-${row.id}`}
                value={row.id}
              >
                <Text>{row.label}</Text>
              </NavigationLink>
            ))}
          </List>
        </Group>
        {KEY_DERIVATION_SECTION_ROWS.map(({ id: section }) => (
          <NavigationDestination key={section} value={section}>
            <Group modifiers={[background(colors.background)]}>
              <RNHostView>{details[section]}</RNHostView>
            </Group>
          </NavigationDestination>
        ))}
      </NavigationStack>
    </Host>
  );
}

const styles = StyleSheet.create({ host: { flex: 1 } });
