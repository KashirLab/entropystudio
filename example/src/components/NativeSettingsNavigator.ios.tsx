import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, type ColorValue } from 'react-native';
import {
  Host,
  Group,
  List,
  NavigationDestination,
  NavigationLink,
  NavigationStack,
  RNHostView,
  Text,
} from '@expo/ui/swift-ui';
import {
  background,
  listRowBackground,
  navigationTitle,
  scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers';

import { STUDIO_UI_TEXT } from '../features/studioUiCopy';

type Props = {
  readonly backgroundColor: ColorValue;
  readonly children: React.ReactElement;
  readonly isActive: boolean;
  readonly isDarkMode: boolean;
  readonly label: string;
  readonly onReturnToMethod: () => void;
  readonly rowBackgroundColor: ColorValue;
  readonly seedColor: ColorValue;
};

/** A SwiftUI navigation stack with an RN-hosted settings detail screen. */
export function NativeSettingsNavigator({
  backgroundColor,
  children,
  isActive,
  isDarkMode,
  label,
  onReturnToMethod,
  rowBackgroundColor,
  seedColor,
}: Props) {
  const [path, setPath] = useState<string[]>([]);

  useEffect(() => {
    if (!isActive) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (path.length > 0) {
        setPath([]);
      } else {
        onReturnToMethod();
      }
      return true;
    });
    return () => subscription.remove();
  }, [isActive, onReturnToMethod, path.length]);

  return (
    <Host
      colorScheme={isDarkMode ? 'dark' : 'light'}
      modifiers={[background(backgroundColor)]}
      seedColor={seedColor}
      style={styles.host}
      useViewportSizeMeasurement
    >
      <NavigationStack onPathChange={setPath} path={path}>
        <List
          modifiers={[
            navigationTitle(STUDIO_UI_TEXT.navigation.settings),
            scrollContentBackground('hidden'),
            background(backgroundColor),
          ]}
          testID="settings-list"
        >
          <NavigationLink
            modifiers={[listRowBackground(rowBackgroundColor)]}
            testID="open-keys-settings"
            value="keys"
          >
            <Text>{label}</Text>
          </NavigationLink>
        </List>
        <NavigationDestination value="keys">
          <Group modifiers={[navigationTitle(label), background(backgroundColor)]}>
            <RNHostView>{children}</RNHostView>
          </Group>
        </NavigationDestination>
      </NavigationStack>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
