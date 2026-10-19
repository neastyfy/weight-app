// Заголовок, слова которого появляются мягкой «волной» снизу вверх.
// Пример: <AnimatedTitle variant="title">Выбери маскота</AnimatedTitle>
// Анимация запускается при появлении компонента (смените key, чтобы проиграть заново).
// style — для строки целиком, textStyle — для самого текста (например, тень на картинке).
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Appear } from './Appear';

const FIRST_DELAY = 60; // мс до первого слова
const WORD_DELAY = 45; // мс между словами

export function AnimatedTitle({ children, variant = 'title', align, color, style, textStyle }) {
  const words = String(children).split(' ');

  return (
    <View
      style={[styles.row, align === 'center' && styles.center, style]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={String(children)}
    >
      {words.map((word, index) => (
        <Appear key={`${index}-${word}`} delay={FIRST_DELAY + index * WORD_DELAY}>
          <AppText variant={variant} color={color} style={textStyle}>
            {index < words.length - 1 ? `${word} ` : word}
          </AppText>
        </Appear>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  center: {
    justifyContent: 'center',
  },
});
