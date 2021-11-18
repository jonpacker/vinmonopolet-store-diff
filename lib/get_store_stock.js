const fs = require('mz/fs');
const md5 = require('md5');
module.exports = async (app, {catalogId}, justGetStream) => {
  const storeDir = app.storeDir || __dirname;
  const fileName = `${storeDir}/product_list_${md5(catalogId)}.json`
  if (!justGetStream) {
    return JSON.parse(await fs.readFile(fileName));
  } else {
    return fs.createReadStream(fileName);
  }
}
