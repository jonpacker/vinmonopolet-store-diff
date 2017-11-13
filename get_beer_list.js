const vp = require('vinmonopolet');

module.exports = async (storeName, productTypeFacet) => {
  const facets = await vp.getFacets();
  const stores = facets.find(facet => facet.title == 'stores');
  const store = stores.values.find(store => store.name == storeName);
  let {products, pagination} = await vp.getProducts({facets: [store, productTypeFacet]});
  while (pagination.hasNext) {
    const response = await pagination.next();
    products = products.concat(response.products);
    pagination = response.pagination;
  }
  
  return products;
}
