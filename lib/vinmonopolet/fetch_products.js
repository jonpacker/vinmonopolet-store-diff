const vp = require('vinmonopolet');
const stockData = require('./fetch_product_stock_data');

module.exports = async (opts) => {
  if (!opts.storeName) throw new Error("Vinmonopolet#getProductList requires 'storeName' property");
  if (!opts.productType) throw new Error("Vinmonopolet#getProductList requires 'productType' property");
  const productTypeFacet = vp.Facet.Category[opts.productType];
  if (!productTypeFacet) throw new Error(`Vinmonopolet#getProductList got invalid value in 'productType' property: '${opts.productType}'. Must be one of: ${Object.keys(vp.Facet.Category).join(', ')}`);
  const facets = await vp.getFacets();
  const stores = facets.find(facet => facet.title == 'stores');
  const store = stores.values.find(store => store.name == opts.storeName);
  let {products, pagination} = await vp.getProducts({facets: [store, productTypeFacet]});
  while (pagination.hasNext) {
    const response = await pagination.next();
    products = products.concat(response.products);
    pagination = response.pagination;
  }
  
  const productHash = products.reduce((products, {code, name, price, availability}) => {
    let stockCount = 0
    if (availability.storeAvailability && availability.storeAvailability.mainText) {
      const match = availability.storeAvailability.mainText.match(/\d+/)
      const possibleStockCount = parseInt(match)
      stockCount = isNaN(possibleStockCount) ? 0 : possibleStockCount
    }
    products[code] = {
      code, 
      name, 
      price, 
      link: `https://vinmonopolet.no/_/p/${code}`,
      stock: stockCount
    }
    return products
  }, {})
  
  return productHash;
}

module.exports.canAuditRemovalList = true;
module.exports.auditRemovalList = async (opts, productHash, productDiff) => {
  const removes = productDiff.filter(({op}) => op == 'remove')
  const auditedRemovals = await stockData.getProductsStockDataForStore(opts.storeName, removes.map(({value}) => value.code));
  const falseRemovals = {};
  const auditedProductDiff = productDiff.filter(op => {
    const matchingAuditedRemoval = auditedRemovals.find(({code, inStock, stockLevel}) => {
      return code == op.path[0] && (inStock == false || stockLevel == 0);
    });
    const falseRemoval = op.op == 'remove' && !matchingAuditedRemoval;
    if (falseRemoval) falseRemovals[op.value.code] = op.value;
    return !falseRemoval;
  });
  const auditedProductHash = Object.assign(productHash, falseRemovals);
  return { productHash: auditedProductHash, productDiff: auditedProductDiff };
}
