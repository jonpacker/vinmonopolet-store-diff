const getDiff = require('../lib/get_product_diff');
const Feed = require('feed');
const {runDiff} = require('../lib/diff_product_list');

const AVAILABLE_STORES = {
  'bystasjonen': { 
    catalogId: 'vp_bystasjonen', 
    storeName: 'Bergen, Bergen Storsenter', 
    displayName: 'Vinmonopolet Bystasjonen',
    module: 'vinmonopolet', 
    productType: 'BEER' 
  },
  'dmbourbon': { 
    catalogId: 'dm_bourbon',
    displayName: "Dan Murphy's Online Bourbon Selection",
    module: 'danmurphys', 
    productType: 'bourbon' 
  }
}

module.exports = app => {
  app.router.get('/diff/:store/run', async ctx => {
    ctx.state.store = AVAILABLE_STORES[ctx.params.store];
    const diff = await runDiff(app, ctx.state.store)
    if (diff.length == 0) {
      ctx.body = `${new Date().toString()}: No changes found`;
    } else {
      const removes = diff.filter(({op}) => op == 'remove').length;
      const adds = diff.filter(({op}) => op == 'add').length;
      ctx.body = `${new Date().toString()}: Changes found: ${adds} added, ${removes} removed`;
    }
  });
  
  app.router.get('/diff/:store', async ctx => {
    ctx.state.storeSettings = AVAILABLE_STORES[ctx.params.store];
    ctx.state.diffs = await getDiff(app, ctx.state.storeSettings.catalogId);
    ctx.render('diff');
  });
  
  app.router.get('/diff/:store/feed.xml', async ctx => {
    ctx.state.storeSettings = AVAILABLE_STORES[ctx.params.store];
    const diffs = await getDiff(app, ctx.state.storeSettings.catalogId);
    let feed = new Feed({
      title: `${store} Updates`,
      description: `${store} Updates`,
      id: `http://vpdiff.jonpacker.com/${ctx.params.store}`,
      link: `http://vpdiff.jonpacker.com/${ctx.params.store}`,
      feedLinks: {
        atom: `http://vpdiff.jonpacker.com/${ctx.params.store}/feed.xml`,
      },
      author: {
        name: 'Jon Packer',
        email: 'contact@jonpacker.com',
        link: 'http://jonpacker.com'
      }
    })
    diffs.forEach(diff => {
      diff.added.forEach(({value}) => {
        const story = `+${value.name} - ${value.price}`;
        feed.addItem({
          title: beer,
          id: `${value.code}_${diff.seen.valueOf()}`,
          link: `https://vinmonopolet.no/_/p/${value.code}`,
          description: story,
          date: diff.seen
        });
      });
    })
    ctx.type = 'application/atom+xml';
    ctx.body = feed.atom1();
  });
}
