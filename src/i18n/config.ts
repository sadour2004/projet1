export const locales = ['fr'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'fr'

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
}

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  fr: 'ltr',
}
