import { Redactor } from "@redactpii/node";

const NINE_DIGIT_ID = /\b\d{3}[ -]?\d{3}[ -]?\d{3}\b/g;
const POSTAL_CODE = /\b[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d\b/g;
const DATE = /\b\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}\b/g;
const INVISIBLE_CHARACTERS = /(?![\n\t])[\p{Cc}\p{Cf}]/gu;
const MARKUP_TAG = /<\/?[a-z_][\w-]*>/gi;
const EXTRA_BLANK_LINES = /\n{3,}/g;
const CRISIS =
  /\b(suicid\w*|kill(ing)? myself|end(ing)? my life|(want|wanted|wanting) to die|(don'?t|do not) want to (live|be alive)|self[- ]?harm\w*|hurt(ing)? myself|overdos\w*)\b/i;

const redactor = new Redactor({ customRules: [NINE_DIGIT_ID, POSTAL_CODE, DATE] });

/** Removes invisible characters and tags that could pose as prompt delimiters. */
export const sanitize = (text: string): string =>
  text.normalize("NFKC").replace(INVISIBLE_CHARACTERS, "").replace(MARKUP_TAG, "").replace(EXTRA_BLANK_LINES, "\n\n").trim();

export const redactPii = (text: string): string => redactor.redact(text);

export const isCrisis = (text: string): boolean => CRISIS.test(text);
