async page => page.evaluate(async () => {
  await document.fonts.ready;
  return {
    lang: document.documentElement.lang,
    title: document.title,
    fonts: ['Prata', 'Literata', 'Manrope'].map(family => ({ family, loaded: document.fonts.check(`16px ${family}`) })),
    externalFonts: performance.getEntriesByType('resource').map(entry => entry.name)
      .filter(name => /fonts\.(googleapis|gstatic)\.com/.test(name)),
    localFontResources: performance.getEntriesByType('resource').map(entry => entry.name)
      .filter(name => /\/assets\/fonts\/.*\.woff2/.test(name))
  };
})
