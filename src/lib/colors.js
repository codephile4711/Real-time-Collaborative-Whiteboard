// 8 pastel hex values for sticky notes
export const STICKY_COLORS = [
  '#fff9db', // Pastel Yellow
  '#e3fafc', // Pastel Cyan
  '#e8f7ff', // Pastel Light Blue
  '#ebfbee', // Pastel Green
  '#fff0f6', // Pastel Pink
  '#f3f0ff', // Pastel Purple
  '#ffe8cc', // Pastel Orange
  '#fff5f5', // Pastel Red
];

// Vibrant colors for users presence cursors/names
export const PRESENCE_COLORS = [
  '#e64980', // Pink
  '#be4bdb', // Grape
  '#7950f2', // Violet
  '#228be6', // Blue
  '#12b886', // Teal
  '#40c057', // Green
  '#fab005', // Yellow
  '#fd7e14', // Orange
];

export function getRandomPresenceColor() {
  return PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];
}

export function getRandomStickyColor() {
  return STICKY_COLORS[0]; // Default yellow, or random
}
