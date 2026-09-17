import { NativeSelect, type NativeSelectOption } from '../../../components/NativeSelect';
import type { DiceColors } from '../../dice/diceTheme';
import { KEY_STATION_SCRIPT_TYPES, type KeyStationScriptType } from '../keyStation';
import { UPSTREAM_TEXT } from '../../upstreamUiCopy';

type Props = {
  readonly colors: DiceColors;
  readonly onSelect: (scriptType: KeyStationScriptType) => void;
  readonly selected: KeyStationScriptType;
};

const SCRIPT_TYPE_OPTIONS: readonly NativeSelectOption<KeyStationScriptType>[] =
  KEY_STATION_SCRIPT_TYPES.map(scriptType => ({
    label: UPSTREAM_TEXT.keys.scriptTypes[scriptType.id],
    value: scriptType.id,
  }));

/** Reuses Studio's native wheel/dropdown script-type picker. */
export function ScriptTypeTabs({ colors, onSelect, selected }: Props) {
  return (
    <NativeSelect
      accessibilityLabel={UPSTREAM_TEXT.keys.scriptType}
      colors={colors}
      controlTestID="key-station-script-type-picker"
      onValueChange={onSelect}
      options={SCRIPT_TYPE_OPTIONS}
      selectedValue={selected}
    />
  );
}
