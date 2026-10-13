export function getLocalizedText(bundle, locale, fallbackLocale = 'ru') {
  if (typeof bundle === 'string') return bundle;
  if (!bundle || typeof bundle !== 'object') return '';
  return bundle[locale] ?? bundle[fallbackLocale] ?? Object.values(bundle).find(value => typeof value === 'string') ?? '';
}
