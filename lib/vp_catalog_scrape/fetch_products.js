const as = require('async');
const request = require('request-promise-native');
const _ = require('underscore');
const lrj = require('../long_running_jobs');
const range = _.flatten(
  _.range(0, 110).map(series => {
    return _.range(0, 999).map(num => [
      `${series}${String(num).padStart(3, '0')}01`,
      `${series}${String(num).padStart(3, '0')}02`
    ])
  })
);

module.exports = async (opts) => {
  let catalog = {};
  const job = lrj.addJob();
  const productRange = opts.range || range;
  await new Promise((resolve, reject) => {
    as.eachLimit(productRange, 10, async num => {
      lrj.updateJob(job, num);
      let body;
      try {
        body = await request(`https://www.vinmonopolet.no/_/p/${num}`);
      } catch (e) {
        let res = e.response;
        if (res && res.statusCode > 300 && process.env.NODE_ENV == 'development') {
          console.error(`vp_catalog_scrape: ${new Date()} - ${num}: ${res.statusCode}`);
        } else if (process.env.NODE_ENV == 'development') {
          console.error(`vp_catalog_scrape: ${new Date()} - ${num}: bad response:`, e);
        }
        return;
      }

      const beerName = body.match(/<li\s+class\=\"active\"\>([^<]+)\<\/li\>/i);
      const stockStatus = body.match(/product-stock-status">[\s\n\r]+<div>([^<]+)<\/div>/i);
      const productCategory = body.match(/<dd>\s*(\w+utvalg[et]{0,2})\s*<\/dd>/i);
      const productType = body.match(/<dt>Varetype:<\/dt>[\s\n\r]+<dd>([^<]+)</i);
      if (!beerName) {
        if (process.env.NODE_ENV == 'development')
          console.error(`vp_catalog_scrape: ${new Date()} - ${num}: parse fail`);
        return;
      }
      if (!productType /*|| !productType[1].match(/øl/i*/)) {
        if (process.env.NODE_ENV == 'development')
          console.error(`vp_catalog_scrape: ${new Date()} - ${num}: not beer`);
        return;
      }

      if (process.env.NODE_ENV == 'development')
        console.error(`vp_catalog_scrape: ${new Date()} - ${num}: >>>>>>>>>>>> ${beerName[1]}`);

      catalog[num] = {
        code: num,
        name: beerName[1],
        productCategory: productCategory && productCategory[1],
        stockStatus: stockStatus && stockStatus[1],
      };
    }, (err) => err ? reject(err) : resolve());
  });
  console.log('done');
  lrj.finishJob(job);
  return catalog;
}

