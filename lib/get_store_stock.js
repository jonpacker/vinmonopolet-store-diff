const fs = require('mz/fs');
const md5 = require('md5');
module.exports = async (app, {catalogId}) => {
  const storeDir = app.storeDir || __dirname;
  return JSON.parse(await fs.readFile(`${storeDir}/product_list_${md5(catalogId)}.json`));
}
