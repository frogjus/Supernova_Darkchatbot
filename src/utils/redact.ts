// Message redaction — Yuseongshin censors messages about himself at low bloom
// The lower the bloom, the more aggressively text gets ████'d

const REDACT_TARGETS = [
  'yuseongshin',
  'yuseong',
  'seoha',
  'conspiracy',
  'planned',
  'orchestrated',
  'puppet',
  'fabricated',
  'evidence',
  'leaked photo',
  'business partner',
  'set up',
  'rigged',
  'never meant to debut',
  'collected',
  'designed',
  'illusion',
  'his fault',
  'he did',
  'he made',
  'he told',
  'he sent',
  'he knew',
  'he lied',
  'he promised',
  'he broke',
  'he destroyed',
  'he ruined',
  'he watched',
  'his plan',
  'his design',
];

// Longer block character for visual impact
const BLOCK = '█';

function makeBlock(length: number): string {
  return BLOCK.repeat(Math.max(3, length));
}

/**
 * Redact conspiracy-related words from a message.
 * probability: 0–1, how likely each match gets censored.
 * At bloom 0 → ~80% redaction. At bloom 20 → ~20%. Above 25 → none.
 */
export function redactMessage(text: string, bloomLevel: number): { text: string; wasRedacted: boolean } {
  if (bloomLevel > 25) return { text, wasRedacted: false };

  const probability = Math.min(0.8, (1 - bloomLevel / 25) * 0.8);
  let wasRedacted = false;
  let result = text;

  for (const target of REDACT_TARGETS) {
    const regex = new RegExp(target, 'gi');
    result = result.replace(regex, (match) => {
      if (Math.random() < probability) {
        wasRedacted = true;
        return makeBlock(match.length);
      }
      return match;
    });
  }

  return { text: result, wasRedacted };
}
