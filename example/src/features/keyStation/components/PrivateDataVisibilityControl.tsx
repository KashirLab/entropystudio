import { Host, Icon } from '@expo/ui';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import type { DiceColors } from '../../dice/diceTheme';
import { UPSTREAM_TEXT } from '../../upstreamUiCopy';

type Props = {
  readonly colors: DiceColors;
  readonly contentWidth?: number;
  readonly onChange: (visible: boolean) => void;
  readonly testID?: string;
  readonly visible: boolean;
};

type FieldLabelProps = {
  readonly colors: DiceColors;
  readonly label: string;
  readonly onChange: (visible: boolean) => void;
  readonly testID?: string;
  readonly visible: boolean;
};

/** A private result label whose eye and action share the privacy bar's state. */
export function PrivateDataFieldLabel({
  colors,
  label,
  onChange,
  testID,
  visible,
}: FieldLabelProps) {
  const state = visible
    ? UPSTREAM_TEXT.result.privateDataVisible
    : UPSTREAM_TEXT.result.privateDataHidden;
  const contentColor = visible ? colors.error : colors.text;

  return (
    <Pressable
      accessibilityLabel={`${label}. ${state}`}
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => onChange(!visible)}
      style={styles.fieldLabel}
      testID={testID}
    >
      <Text style={[styles.fieldLabelText, { color: contentColor }]}>{label}</Text>
      <Host matchContents style={styles.iconHost}>
        <Icon
          color={contentColor}
          name={visible ? 'eye' : 'eye.slash'}
          size={18}
        />
      </Host>
    </Pressable>
  );
}

/** The shared Key Station privacy bar for recovery material. */
export function PrivateDataVisibilityControl({
  colors,
  contentWidth,
  onChange,
  testID = 'toggle-private-data-visibility',
  visible,
}: Props) {
  const state = visible
    ? UPSTREAM_TEXT.result.privateDataVisible
    : UPSTREAM_TEXT.result.privateDataHidden;

  return (
    <Pressable
      accessibilityLabel={state}
      accessibilityRole="switch"
      accessibilityState={{ checked: visible }}
      onPress={() => onChange(!visible)}
      style={[
        styles.privacyBar,
        {
          backgroundColor: visible ? `${colors.error}1A` : colors.segment,
          borderColor: visible ? colors.error : colors.border,
          ...(contentWidth === undefined ? {} : { width: contentWidth }),
        },
      ]}
      testID={testID}
    >
      <Switch
        accessibilityElementsHidden
        pointerEvents="none"
        thumbColor={visible ? colors.error : undefined}
        trackColor={{ false: colors.border, true: `${colors.error}88` }}
        value={visible}
      />
      <View style={styles.privacyBarCopy}>
        <Text
          style={[
            styles.privacyBarState,
            { color: visible ? colors.error : colors.text },
          ]}
        >
          {state}
        </Text>
        <Text style={[styles.privacyBarHint, { color: colors.muted }]}>
          {visible
            ? UPSTREAM_TEXT.result.hidePrivateDataHint
            : UPSTREAM_TEXT.result.revealPrivateDataHint}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  privacyBar: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  privacyBarCopy: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  privacyBarHint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
  privacyBarState: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  fieldLabel: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
  },
  fieldLabelText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  iconHost: { alignSelf: 'center' },
});
