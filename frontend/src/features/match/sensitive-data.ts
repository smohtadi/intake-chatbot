const CARD_NUMBER = /\b(?:\d[ -]?){13,19}\b/;
const NINE_DIGIT_ID = /\b\d{3}[ -]?\d{2}[ -]?\d{4}\b/;

/** A light heuristic for card numbers and 9-digit ID numbers. It warns, never blocks. */
export function looksSensitive(text: string): boolean {
  return CARD_NUMBER.test(text) || NINE_DIGIT_ID.test(text);
}
