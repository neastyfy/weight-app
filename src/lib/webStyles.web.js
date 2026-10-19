// ТОЛЬКО ДЛЯ БРАУЗЕРА (на iOS используется пустой webStyles.js).
// Убирает браузерные эффекты «нажатия», которые не нужны в приложении:
//   • серую подсветку при касании (мобильный режим),
//   • системную рамку фокуса после щелчка мышью (с клавиатуры фокус по-прежнему виден),
//   • выделение текста на кнопках и плитках при щелчке или перетаскивании;
//   • «оттягивание» всей страницы (из-под неё виден фон браузера) и оттягивание Главной вниз:
//     в Safari картинка шапки не успевает за ним, и мелькает пустая полоса (см. Screen heroTop).
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    * { -webkit-tap-highlight-color: transparent; }
    html, body { overscroll-behavior: none; }
    #hero-scroll { overscroll-behavior-y: none; }
    :focus:not(:focus-visible) { outline: none; }
    [role="button"], [role="tab"], [role="tablist"], [role="checkbox"], [role="radio"],
    [role="adjustable"], [role="slider"], [data-testid="value-picker-track"] {
      user-select: none;
      -webkit-user-select: none;
      outline: none;
    }
  `;
  document.head.appendChild(style);
}
