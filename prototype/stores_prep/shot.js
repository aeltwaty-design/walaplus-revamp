const {chromium} = require('playwright');
(async () => {
  const dir = process.argv[2], out = process.argv[3];
  const b = await chromium.launch();
  const p = await b.newPage({deviceScaleFactor: 3, viewport: {width: 800, height: 1200}});
  await p.goto('file://' + dir + '/pieces.html');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  for (const id of ['banner1', 'banner2', 'banner3', 'card1', 'card4']) {
    await p.locator('#' + id).screenshot({path: out + '/' + id + '.png', omitBackground: true});
  }
  await b.close();
})();
