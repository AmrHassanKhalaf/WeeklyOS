export type TextDirection = 'ltr' | 'rtl'

const ARABIC_TEXT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u

export function hasArabicText(text: string): boolean {
  return ARABIC_TEXT_RE.test(text)
}

export function getLineDirection(text: string): TextDirection {
  return hasArabicText(text) ? 'rtl' : 'ltr'
}
