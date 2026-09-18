import { useEffect, useState, type ReactElement } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import {
  Group,
  HStack,
  Image,
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
  listRowInsets,
  listSectionSpacing,
  navigationTitle,
  foregroundStyle,
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
  readonly privateDataVisible: boolean;
  readonly rootTitle: string;
};

function isPrivateRow(section: KeyDerivationSection): boolean {
  return (
    section === 'recovery' ||
    section === 'addresses' ||
    section === 'account-private'
  );
}

/** Full-screen SwiftUI navigation for Key Station's derived-key rows. */
export function NativeKeyDerivationNavigator({
  children,
  colors,
  details,
  isActive,
  isDarkMode,
  onReturnToStation,
  privateDataVisible,
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
            <Group
              modifiers={[
                // The hosted overview carries its own 24-point horizontal
                // inset. Remove List's cell inset so its responsive width is
                // not clipped a second time by SwiftUI.
                listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
                listRowBackground(colors.background),
              ]}
            >
              <RNHostView matchContents>{children}</RNHostView>
            </Group>
            {KEY_DERIVATION_SECTION_ROWS.map(row => {
              const privateRow = isPrivateRow(row.id);
              const revealed = privateRow && privateDataVisible;
              const contentColor = revealed ? colors.error : colors.text;

              return (
                <NavigationLink
                  key={row.id}
                  modifiers={[listRowBackground(colors.segment)]}
                  testID={`open-key-derivation-${row.id}`}
                  value={row.id}
                >
                  {privateRow ? (
                    <HStack spacing={4}>
                      <Text modifiers={[foregroundStyle(contentColor)]}>
                        {row.label}
                      </Text>
                      <Image
                        color={contentColor}
                        size={18}
                        systemName={revealed ? 'eye' : 'eye.slash'}
                      />
                    </HStack>
                  ) : (
                    <Text>{row.label}</Text>
                  )}
                </NavigationLink>
              );
            })}
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
