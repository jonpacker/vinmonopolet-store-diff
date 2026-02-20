const vp = require('vinmonopolet');
const stockData = require('./fetch_product_stock_data');
const Facet = require('vinmonopolet/src/models/Facet')
const fetch = require('node-fetch')

async function getFacets() {
  const res = await fetch('https://www.vinmonopolet.no/vmpws/v2/vmp/products/search?q=:relevance:mainCategory:&searchType=product&fields=FULL')
  const searchResult = await res.json()
  return searchResult.facets.map(f => new Facet(f))
}

module.exports = async (opts) => {
  if (!opts.storeName) throw new Error("Vinmonopolet#getProductList requires 'storeName' property");
  if (!opts.productType) throw new Error("Vinmonopolet#getProductList requires 'productType' property");
  const productTypeFacet = vp.Facet.Category[opts.productType];
  if (!productTypeFacet) throw new Error(`Vinmonopolet#getProductList got invalid value in 'productType' property: '${opts.productType}'. Must be one of: ${Object.keys(vp.Facet.Category).join(', ')}`);
  const facets = await getFacets();
  const stores = facets.find(facet => facet.name == 'På lager i butikk');
  const store = stores.values.find(store => store.name == opts.storeName);
  let {products, pagination} = await vp.getProducts({sort: ['name', 'asc'], facets: [store, productTypeFacet]});
  var i = 0
  while (pagination.hasNext) {
    console.log(`fetching page ${i++}`)
    const response = await pagination.next();
    products = products.concat(response.products);
    pagination = response.pagination;
  }

  console.log(`done, got ${products.length} of expected ${pagination.totalResults} products`)
  
  const productHash = {}
  let index = 0
  for (const {code, name, price, productAvailability, mainSubCategory, mainCountry} of products) {
    let stockCount = 0
    if (productAvailability
        && productAvailability.storesAvailability
        && productAvailability.storesAvailability.infos
        && productAvailability.storesAvailability.infos.length > 0) {
      const availability = productAvailability.storesAvailability.infos[0].availability
      const match = availability.match(/\d+ i/)
      const possibleStockCount = parseInt(match)
      stockCount = isNaN(possibleStockCount) ? 0 : possibleStockCount
    }

    productHash[code] = {
      code, 
      name, 
      price, 
      link: `https://www.vinmonopolet.no/_/p/${code}`,
      stock: stockCount,
      category: mainSubCategory && mainSubCategory.name,
      country: mainCountry && mainCountry.name
    }
  }

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
