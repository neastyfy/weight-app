// ВРЕМЕННЫЙ экран для разработки: витрина дизайн-системы.
// Здесь можно проверить темы, шрифт на всех языках, компоненты и маскотов.
// Тексты на этом экране намеренно не переводятся. Удалить перед выпуском приложения.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, IconBadge, PressableScale, Screen, ScreenHeader, SegmentedControl, TextField } from '@/components';
import { MASCOT_IDS, MASCOT_STATES, Mascot } from '@/features/mascots';
import { useProfile } from '@/features/profile';
import { LANGUAGES, useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

const THEME_OPTIONS = [
  { value: 'system', label: 'Система' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

const LANGUAGE_OPTIONS = LANGUAGES.map((language) => ({ value: language.code, label: language.code.toUpperCase() }));

// Особые буквы каждого языка — проверка, что шрифт их отображает
const FONT_SAMPLES = [
  { language: 'English', sample: 'Aa Bb Cc 0123456789' },
  { language: 'Deutsch', sample: 'Ä Ö Ü ä ö ü ß' },
  { language: 'Polski', sample: 'Ą Ć Ę Ł Ń Ó Ś Ź Ż' },
  { language: 'Čeština', sample: 'Č Ď Ě Ň Ř Š Ť Ů Ž' },
  { language: 'Русский', sample: 'Ё Ж Щ Ы Э Ю Я' },
  { language: 'Українська', sample: 'Є І Ї Ґ є і ї ґ' },
  { language: 'Қазақша', sample: 'Ә Ғ Қ Ң Ө Ұ Ү Һ І' },
];

const TYPOGRAPHY_SAMPLES = [
  { variant: 'largeTitle', label: 'largeTitle — 34' },
  { variant: 'title', label: 'title — 26' },
  { variant: 'heading', label: 'heading — 22' },
  { variant: 'subheading', label: 'subheading — 17' },
  { variant: 'body', label: 'body — 17' },
  { variant: 'caption', label: 'caption — 15' },
  { variant: 'small', label: 'small — 13' },
  { variant: 'number', label: '0,0' },
];

const COLOR_SAMPLES = ['primary', 'success', 'pink', 'sky', 'warning', 'purple', 'error', 'background', 'surface', 'text'];

const BADGE_SAMPLES = [
  { icon: 'scale-outline', tone: 'primary' },
  { icon: 'trophy-outline', tone: 'success' },
  { icon: 'heart-outline', tone: 'pink' },
  { icon: 'flame', tone: 'warning' },
  { icon: 'moon-outline', tone: 'purple' },
];

export default function DesignPreviewScreen() {
  const { colors, radius, spacing, mode, setMode } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const [mascotId, setMascotId] = useState(MASCOT_IDS[0]);
  const [mascotState, setMascotState] = useState('idle');
  const [text, setText] = useState('');
  const { resetAllData } = useProfile();

  const mascotOptions = MASCOT_IDS.map((id) => ({ value: id, label: t(`mascots.${id}.name`) }));

  return (
    <Screen pushed>
      <ScreenHeader title="Витрина дизайна" showBack />

      <Section title="Данные" hint="Удаляет профиль и записи веса на этом устройстве и открывает онбординг">
        <Button title="Сбросить данные и начать заново" variant="secondary" icon="refresh" onPress={resetAllData} />
      </Section>

      <Section title="Тема">
        <SegmentedControl options={THEME_OPTIONS} value={mode} onChange={setMode} />
      </Section>

      <Section title="Язык интерфейса" hint="Меняет подписи вкладок и заглушек">
        <SegmentedControl options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} />
      </Section>

      <Section title="Маскоты">
        <SegmentedControl options={mascotOptions} value={mascotId} onChange={setMascotId} />
        <View style={styles.mascotStage}>
          <Mascot mascotId={mascotId} state={mascotState} size={220} />
        </View>
        <AppText variant="subheading" align="center">
          {t(`mascots.${mascotId}.name`)}
        </AppText>
        <AppText variant="caption" color="textSecondary" align="center">
          {t(`mascots.${mascotId}.role`)}
        </AppText>
        <View style={styles.thumbRow}>
          {MASCOT_STATES.map((state) => (
            <PressableScale key={state} onPress={() => setMascotState(state)} style={styles.mascotThumb}>
              <Mascot mascotId={mascotId} state={state} size={48} />
              <AppText variant="small" color={state === mascotState ? 'primary' : 'textSecondary'} numberOfLines={1}>
                {state}
              </AppText>
            </PressableScale>
          ))}
        </View>
      </Section>

      <Section title="Кнопки">
        <Button title="Основная кнопка" icon="arrow-forward" onPress={() => {}} />
        <Button title="Вторичная кнопка" variant="secondary" onPress={() => {}} />
        <Button title="Текстовая кнопка" variant="text" onPress={() => {}} />
        <Button title="Отключённая" disabled onPress={() => {}} />
        <Button title="Отключённая вторичная" variant="secondary" disabled onPress={() => {}} />
      </Section>

      <Section title="Поля ввода">
        <TextField label="Обычное поле" placeholder="Введите текст" value={text} onChangeText={setText} hint="Подсказка под полем" />
        <TextField label="С единицей измерения" placeholder="0,0" suffix="кг" keyboardType="decimal-pad" />
        <TextField label="С ошибкой" placeholder="Введите значение" error="Пример текста ошибки" />
        <TextField label="Отключённое" placeholder="Недоступно" disabled />
      </Section>

      <Section title="Иконки">
        <View style={[styles.row, { gap: spacing.sm }]}>
          {BADGE_SAMPLES.map((badge) => (
            <IconBadge key={badge.tone} icon={badge.icon} tone={badge.tone} />
          ))}
        </View>
      </Section>

      <Section title="Типографика">
        {TYPOGRAPHY_SAMPLES.map((item) => (
          <AppText key={item.variant} variant={item.variant}>
            {item.label}
          </AppText>
        ))}
      </Section>

      <Section title="Шрифт на всех языках">
        {FONT_SAMPLES.map((item) => (
          <View key={item.language} style={styles.fontRow}>
            <AppText variant="caption" color="textSecondary">
              {item.language}
            </AppText>
            <AppText variant="subheading">{item.sample}</AppText>
          </View>
        ))}
      </Section>

      <Section title="Цвета">
        <View style={[styles.row, { gap: spacing.sm }]}>
          {COLOR_SAMPLES.map((name) => (
            <View key={name} style={styles.swatchItem}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: colors[name], borderRadius: radius.md, borderColor: colors.border },
                ]}
              />
              <AppText variant="small" color="textSecondary">
                {name}
              </AppText>
            </View>
          ))}
        </View>
      </Section>
    </Screen>
  );
}

// Блок витрины: заголовок + карточка с содержимым
function Section({ title, hint, children }) {
  return (
    <Card>
      <AppText variant="heading">{title}</AppText>
      {hint ? (
        <AppText variant="caption" color="textSecondary">
          {hint}
        </AppText>
      ) : null}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mascotStage: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  mascotThumb: {
    alignItems: 'center',
    width: 68,
  },
  fontRow: {
    gap: 2,
  },
  swatchItem: {
    alignItems: 'center',
    gap: 4,
    width: 72,
  },
  swatch: {
    width: 48,
    height: 48,
    borderWidth: 1,
  },
});
