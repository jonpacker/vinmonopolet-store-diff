const request = require('request-promise-native');
const fetchDmCatalog = require('./fetch_dm_catalog');

module.exports = async (opts) => {
  if (opts.productType != 'bourbon') throw new Error("Danmurphys#fetchProducts product types other than bourbon not yet supported");
  let {products, pagination} = await fetchDmCatalog('whisky/american');
  while (pagination.hasNext) {
    const response = await pagination.next();
    products = products.concat(response.products);
    pagination = response.pagination;
  }
  
  return products.reduce((products, product) => (products[product.code] = product, products), {});
}
