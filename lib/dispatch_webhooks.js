const request = require('request-promise-native');
module.exports = async (app, {catalogId, storeName}, diff) => {
  const adds = diff.filter(({op}) => op == 'add');
  if (adds.length == 0) return;
  const hooks = await app.redis.hvalsAsync(`vpdiff_slack_webhooks_${catalogId}`);
  if (!hooks || hooks.length == 0) return;

  try { 
    await Promise.all(hooks.map(async hook => {
      await Promise.all(adds.map(async ({value}) => {
        let infoString = '';
        if (value.stock) {
          infoString = `${value.stock} in stock`;
        } else if (value.stockStatus) {
          infoString = `${value.stockStatus} - Utvalg: ${value.productCategory || '-'}`;
        }
        if (infoString) infoString = `(${infoString})`;
        await request({
          uri: hook,
          method: 'POST',
          body: {
            username: "vpdiff",
            icon_url: "http://vpdiff.jonpacker.com/img/vp-logo.png",
            text: `Added at ${storeName}: <https://vinmonopolet.no/_/p/${value.code}|${value.name}> ${infoString}`
          },
          json: true
        }); 
      }));
    }));
  } catch (e) {
    console.error(e);
  }
}
