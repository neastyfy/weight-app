// Сетка выбора маскота (как «Выбери маскота» в референсе).
// Пример: <MascotPicker value={mascotId} onChange={setMascotId} />
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { SelectionIndicator } from '@/components/SelectableRow';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

import { Mascot } from './Mascot';
import { MASCOT_IDS } from './mascotRegistry';

export function MascotPicker({ value, onChange }) {
  const { colors, radius, spacing } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.grid, { gap: spacing.sm }]} accessibilityRole="radiogroup">
      {MASCOT_IDS.map((id) => {
        const selected = id === value;
        return (
          // две колонки; при 20 маскотах сетка просто станет длиннее
          <View key={id} style={styles.cell}>
            <PressableScale
              onPress={() => onChange(id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={t(`mascots.${id}.name`)}
              style={({ focused }) => [
                styles.tile,
                {
                  borderRadius: radius.lg,
                  padding: spacing.sm,
                  backgroundColor: selected ? colors.primarySoft : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
                focused && { boxShadow: `0px 0px 0px 3px ${colors.focusRing}` },
              ]}
            >
              <View style={styles.stage}>
                <Mascot mascotId={id} state={selected ? 'happy' : 'idle'} size={110} />
              </View>
              <AppText variant="subheading" align="center">
                {t(`mascots.${id}.name`)}
              </AppText>
              <AppText variant="small" color="textSecondary" align="center">
                {t(`mascots.${id}.role`)}
              </AppText>
              <View style={styles.check}>
                <SelectionIndicator selected={selected} size={26} />
              </View>
            </PressableScale>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  tile: {
    borderWidth: 2,
    gap: 4,
  },
  stage: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
