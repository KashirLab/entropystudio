import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { DiceColors } from '../../dice/diceTheme';

type Props = {
  readonly children: ReactNode;
  readonly colors: DiceColors;
  readonly kind: 'private' | 'public';
  readonly style?: object;
  readonly testID?: string;
};

/** Native equivalent of EntropyLab's coloured-left-edge `.edge-note`. */
export function KeyStationEdgeNote({ children, colors, kind, style, testID }: Props) {
  const isPrivate = kind === 'private';

  return (
    <View
      style={[
        styles.note,
        {
          backgroundColor: isPrivate ? colors.privateNoteBackground : colors.publicNoteBackground,
          borderLeftColor: isPrivate ? colors.error : colors.publicNotice,
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    borderLeftWidth: 3,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
