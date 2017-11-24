const fs = require('mz/fs');
const {diff} = require('just-diff');
const md5 = require('md5');

exports.runDiff = async (opts) => {
  let getProductHash;
  try {
    getProductHash = require(`./${opts.module}/fetch_products`)
  } catch (e) {
    throw new Error(`#runDiff: no such module: '${opts.module}'`);
  }
  
  if (!opts.catalogId) throw new Error("#runDiff - you must specify a 'catalogId', this can be arbitrary, it is just an identifier for this product set");
  
  let productHash = await getProductHash(opts);
  const storeMd5 = md5(opts.catalogId);
  const storeDir = app.storeDir || __dirname;
  const storeFile = `${storeDir}/product_list_${storeMd5}.json`;
  var savedProductHash;
  try {
    savedProductHash = JSON.parse(await fs.readFile(storeFile));
  } catch (e) { }

  let productDiff = diff(savedProductHash, productHash).filter(({op, path}) => op != 'replace' && path.length == 1);
  
  const removes = productDiff.filter(({op}) => op == 'remove')
  removes.forEach(op => op.value = savedProductHash[op.path[0]])
  
  if (getProductHash.canAuditRemovalList) {
    {productHash, productDiff} = getProductHash.auditRemovalList(productHash, productDiff);
  }
  
  await fs.writeFile(storeFile, JSON.stringify(productHash));
  
  if (productDiff.length > 0) {
    await app.redis.zaddAsync(storeMd5, Date.now(), JSON.stringify(productDiff));
  }

  return productDiff;
};
