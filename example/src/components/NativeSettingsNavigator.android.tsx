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
  readonly vanityChildren: React.ReactElement;
  readonly vanityLabel: string;
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
  vanityChildren,
  vanityLabel,
}: Props) {
  const [activeDestination, setActiveDestination] = useState<'keys' | 'vanity' | null>(null);

  useEffect(() => {
    if (!isActive) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeDestination) {
        setActiveDestination(null);
      } else {
        onReturnToMethod();
      }
      return true;
    });
    return () => subscription.remove();
  }, [activeDestination, isActive, onReturnToMethod]);

  if (activeDestination === 'keys') return children;
  if (activeDestination === 'vanity') return vanityChildren;

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
          onPress={() => setActiveDestination('keys')}
          testID="open-keys-settings"
          trailing="›"
        >
          {label}
        </ListItem>
        <ListItem
          colors={{ containerColor: rowBackgroundColor }}
          onPress={() => setActiveDestination('vanity')}
          testID="open-vanity-settings"
          trailing="›"
        >
          {vanityLabel}
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
