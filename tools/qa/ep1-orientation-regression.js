async (page) => {
  const sizes = [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 430, height: 932 }
  ];
  const waitReady = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('.scene-art img')]
      .every(image => [...image.getAnimations()].every(animation => animation.playState === 'finished')));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  };

  const results = [];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.reload();
    await waitReady();
    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      bodyWidth: document.body.scrollWidth,
      bodyHeight: document.body.scrollHeight,
      overflowX: getComputedStyle(document.documentElement).overflowX
    }));
    if (metrics.documentWidth > size.width || metrics.bodyWidth > size.width) {
      throw new Error(`horizontal overflow at ${size.width}x${size.height}`);
    }
    results.push({ viewport: `${size.width}x${size.height}`, metrics });
  }
  return { status: 'PASS', results };
}
