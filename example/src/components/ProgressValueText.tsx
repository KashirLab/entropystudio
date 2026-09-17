import { StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

type Props = {
  readonly style?: StyleProp<TextStyle>;
  readonly testID: string;
  readonly text: string;
  readonly textColor: string;
  readonly valueColor: string;
};

/** Renders upstream metadata rows, whose leading value carries the state color. */
export function ProgressValueText({
  style,
  testID,
  text,
  textColor,
  valueColor,
}: Props) {
  return (
    <Text style={[style, { color: textColor }]} testID={testID}>
      {text.split('\n').map((line, index) => {
        const match = line.match(/^(\d+(?:\.\d+)?)(.*)$/u);
        return (
          <Text key={`${index}:${line}`}>
            {index ? '\n' : ''}
            {match ? (
              <>
                <Text style={[styles.value, { color: valueColor }]}>
                  {match[1]}
                </Text>
                {match[2]}
              </>
            ) : (
              line
            )}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  value: {
    fontWeight: '700',
  },
});
