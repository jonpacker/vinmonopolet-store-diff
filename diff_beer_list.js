const getBeerList = require('./get_beer_list');
const vp = require('vinmonopolet');
const fs = require('mz/fs');
const redis = require('redis');
const {promisifyAll} = require('bluebird');
const {diff} = require('just-diff');
const md5 = require('md5');

promisifyAll(redis.RedisClient.prototype);
promisifyAll(redis.Multi.prototype);

const store = 'Bergen, Bergen Storsenter';

module.exports = async () => {
  const beerList = await getBeerList(store, vp.Facet.Category.BEER);
  var savedBeerHash;
  try {
    savedBeerHash = JSON.parse(await fs.readFile(__dirname + '/beer_list.json'));
  } catch (e) {
    savedBeerHash = {};
  }

  const beerHash = beerList.reduce((beers, {code, name, mainProducer, price, chosenStoreStock}) => (beers[code] = {
    code, name, price, 
    stock: chosenStoreStock ? chosenStoreStock.stockLevel : undefined,
    brewery: mainProducer ? mainProducer.name : undefined
  }, beers), {})
  
  await fs.writeFile(__dirname + '/beer_list.json', JSON.stringify(beerHash));

  const beerDiff = diff(savedBeerHash, beerHash).filter(({op, path}) => op != 'replace' && path.length == 1);
  
  beerDiff
    .filter(({op}) => op == 'remove')
    .forEach(op => op.value = savedBeerHash[op.path[0]])

  if (beerDiff.length > 0) {
    const db = redis.createClient();
    await db.zaddAsync(md5(store), Date.now(), JSON.stringify(beerDiff));
    db.quit();
  }

  return beerDiff;
};
