const request = require('request-promise-native');
const cheerio = require('cheerio');

async function fetchCatalogAtUrl(url) {
  const $ = await request({
    uri: url,
    transform: body => cheerio.load(body)
  });
  const products = [];
  //make sure page size is highest possible
  const maxPageSizeButton = $('.product-count li:last-child a');
  if (!maxPageSizeButton.is('.selected')) {
    return await fetchCatalogAtUrl(maxPageSizeButton.attr('href'));
  }
  $('.independent-product-module').each((i, productModule) => {
    productModule = $(productModule);
    const titleLink = productModule.find('.independent-product-module-title a')
    const productName = titleLink.text().trim();
    const productCode = titleLink.attr('href').match(/product\/(.*)\//i)[1];
    const stockInfo = productModule.find('.independent-product-side-container');
    const inStock = stockInfo.find('#hdavailable').length > 0;
    const priceInfo = productModule.find('.price-secondary .price').text();
    var price = undefined;
    if (priceInfo) {
      price = parseFloat(priceInfo.replace('$', ''));
    }
    products.push({
      name: productName,
      code: productCode,
      stock: inStock,
      link: `https://www.danmurphys.com.au/product/${productCode}/_`,
      price
    });
  });
  const nextButton = $('.last.next');
  const hasNext = nextButton.length > 0;
  const next = async () => await fetchCatalogAtUrl(nextButton.attr('href'))
  return { products, pagination: { hasNext, next } }
}

module.exports = async function fetchCatalog(path) {
  return await fetchCatalogAtUrl(`https://www.danmurphys.com.au/${path}`);
}
