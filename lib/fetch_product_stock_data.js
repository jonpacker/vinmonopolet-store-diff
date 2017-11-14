const request = require('request-promise-native');
exports.getProductStockData = async (productId) => {
  return await request({
    uri: `https://app.vinmonopolet.no/vmpws/v2/vmpSite/products/${productId}/stock`,
    qs: {
      latitude: "60",
      longitude: "5", 
      pageSize: "400"
    },
    json: true
  });
}

exports.getProductsStockData = async (productIds) => {
  return await Promise.all(productIds.map(id => exports.getProductStockData(id)));
}

exports.getProductsStockDataForStore = async (storeName, productIds) => {
  const products = await exports.getProductsStockData(productIds);
  return products.map(product => {
    const store = product.stores.find(({displayName}) => displayName == storeName);
    return {
      code: product.product.code,
      inStock: !!store,
      stockLevel: store ? store.stockInfo.stockLevel : 0
    }
  })
}
