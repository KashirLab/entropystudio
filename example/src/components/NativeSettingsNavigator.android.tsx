import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, type ColorValue } from 'react-native';
import { Host, List, ListItem } from '@expo/ui';

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

/** Compose-native list row; Android has no Expo UI navigation-stack component. */
export function NativeSettingsNavigator({
  backgroundColor: _backgroundColor,
  children,
  isActive,
  isDarkMode,
  label,
  onReturnToMethod,
  rowBackgroundColor,
  seedColor,
}: Props) {
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    if (!isActive) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showKeys) {
        setShowKeys(false);
      } else {
        onReturnToMethod();
      }
      return true;
    });
    return () => subscription.remove();
  }, [isActive, onReturnToMethod, showKeys]);

  if (showKeys) return children;

  return (
    <Host
      colorScheme={isDarkMode ? 'dark' : 'light'}
      seedColor={seedColor}
      style={styles.host}
      useViewportSizeMeasurement
    >
      <List testID="settings-list">
        <ListItem
          colors={{ containerColor: rowBackgroundColor }}
          onPress={() => setShowKeys(true)}
          testID="open-keys-settings"
          trailing="›"
        >
          {label}
        </ListItem>
      </List>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
