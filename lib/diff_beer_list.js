const getBeerList = require('./get_beer_list');
const vp = require('vinmonopolet');
const fs = require('mz/fs');
const {promisifyAll} = require('bluebird');
const {diff} = require('just-diff');
const md5 = require('md5');
const {getProductsStockDataForStore} = require('./fetch_product_stock_data');

module.exports = async (app, store) => {
  const beerList = await getBeerList(store, vp.Facet.Category.BEER);
  const storeMd5 = md5(store);
  const storeDir = app.storeDir || __dirname;
  const storeFile = `${storeDir}/beer_list_${storeMd5}.json`;
  var savedBeerHash;
  try {
    savedBeerHash = JSON.parse(await fs.readFile(storeFile));
  } catch (e) {
    savedBeerHash = {};
  }

  const beerHash = beerList.reduce((beers, {code, name, mainProducer, price, chosenStoreStock}) => (beers[code] = {
    code, name, price, 
    stock: chosenStoreStock ? chosenStoreStock.stockLevel : undefined,
    brewery: mainProducer ? mainProducer.name : undefined
  }, beers), {})
  delete beerHash["7893702"];
  
  await fs.writeFile(storeFile, JSON.stringify(beerHash));

  let beerDiff = diff(savedBeerHash, beerHash).filter(({op, path}) => op != 'replace' && path.length == 1);
  
  const removes = beerDiff.filter(({op}) => op == 'remove')
  removes.forEach(op => op.value = savedBeerHash[op.path[0]])
  
  // audit removals.
  const removalsFullData = await getProductsStockDataForStore(store, removes.map(({value}) => value.code));
  beerDiff = beerDiff.filter(({op, path}) => {
    return !!removalsFullData.find(({code, inStock, stockLevel}) => {
      return code == path[0] && (inStock == false || stockLevel == 0);
    });
  });

  if (beerDiff.length > 0) {
    await app.redis.zaddAsync(md5(store), Date.now(), JSON.stringify(beerDiff));
  }

  return beerDiff;
};
