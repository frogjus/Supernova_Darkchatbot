// Zalgo text corruption — combining Unicode characters that stack above/below letters
const ZALGO_UP = [
  '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', '\u0307',
  '\u0308', '\u0309', '\u030A', '\u030B', '\u030C', '\u030D', '\u030E', '\u030F',
  '\u0310', '\u0311', '\u0312', '\u0313', '\u0314', '\u0315',
];
const ZALGO_DOWN = [
  '\u0316', '\u0317', '\u0318', '\u0319', '\u031A', '\u031B', '\u031C', '\u031D',
  '\u031E', '\u031F', '\u0320', '\u0321', '\u0322', '\u0323', '\u0324', '\u0325',
];

/**
 * Corrupt text with zalgo combining characters.
 * intensity: 0 (none) to 1 (maximum corruption)
 */
export function zalgoify(text: string, intensity: number): string {
  if (intensity <= 0) return text;
  const clamped = Math.min(1, intensity);
  const maxMarks = Math.ceil(clamped * 3);

  return text
    .split('')
    .map((char) => {
      if (char === ' ') return char;
      let result = char;
      const upCount = Math.floor(Math.random() * (maxMarks + 1));
      const downCount = Math.floor(Math.random() * (maxMarks + 1));
      for (let i = 0; i < upCount; i++) {
        result += ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)];
      }
      for (let i = 0; i < downCount; i++) {
        result += ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)];
      }
      return result;
    })
    .join('');
}
