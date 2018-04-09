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
  'akerbrygge': {
    catalogId: 'vp_akerbrygge',
    storeName: 'Oslo, Aker Brygge',
    displayName: 'Vinmonopolet Aker Brygge',
    module: 'vinmonopolet',
    productType: 'BEER'
  }, 
  'kvadrat': {
    catalogId: 'vp_kvadrat',
    storeName: 'Sandnes, Kvadrat',
    displayName: 'Vinmonopolet Sandnes, Kvadrat',
    module: 'vinmonopolet',
    productType: 'BEER'
  }, 
  'bankkvartalet': {
    catalogId: 'vp_bankkvartalet',
    storeName: 'Trondheim, Bankkvartalet',
    displayName: 'Vinmonopolet Bankkvartalet',
    module: 'vinmonopolet',
    productType: 'BEER'
  }, 
  'moa': {
    catalogId: 'vp_moa',
    storeName: 'Ålesund, Moa',
    displayName: 'Vinmonopolet Ålesund, Moa',
    module: 'vinmonopolet',
    productType: 'BEER'
  }, 
  'langnes': {
    catalogId: 'vp_langnes',
    storeName: 'Tromsø, Langnes',
    displayName: 'Vinmonopolet Tromsø, Langnes',
    module: 'vinmonopolet',
    productType: 'BEER'
  }, 
  'molde': {
    catalogId: 'vp_molde',
    storeName: 'Molde',
    displayName: 'Vinmonopolet Molde',
    module: 'vinmonopolet',
    productType: 'BEER'
  }, 
  'lillemarkens': {
    catalogId: 'vp_lillemarkens',
    storeName: 'Kristiansand, Lillemarkens',
    displayName: 'Vinmonopolet Kristiansand, Lillemarkens',
    module: 'vinmonopolet',
    productType: 'BEER'
  }, 
  'bodo': {
    catalogId: 'vp_bodo',
    storeName: 'Bodø, City Nord',
    displayName: 'Vinmonopolet Bodø, City Nord',
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

const beerStores = [
  'bystasjonen',
  'akerbrygge',
  'bodo',
  'lillemarkens',
  'kvadrat',
  'langnes',
  'moa',
  'bankkvartalet',
  'molde'
];

module.exports = (app, privateApp) => {
  privateApp.router.get('/diff/run_all', async ctx => {
    const diffTasks = beerStores.map(store => runDiff(app, AVAILABLE_STORES[store]));
    const diffs = await Promise.all(diffTasks);
    const statusLog = diffs.map((diff, i) => {
      if (diff.length == 0) {
        return `${beerStores[i]} - ${new Date().toString()}: No changes found`;
      } else {
        const removes = diff.filter(({op}) => op == 'remove').length;
        const adds = diff.filter(({op}) => op == 'add').length;
        return `${beerStores[i]} - ${new Date().toString()}: Changes found: ${adds} added, ${removes} removed`;
      }
    });
    ctx.body = statusLog.join('\n');
  });
  
  privateApp.router.get('/diff/:store/run', async ctx => {
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
  
  let recentUpdateCache = {};
  let recentUpdateCacheTime = 0;
  
  const getRecentBeerUpdates = async () => {
    if (Date.now() - recentUpdateCacheTime < 1000 * 60) {
      return recentUpdateCache;
    }
    
    const fetchDiffs = beerStores.map(store => getDiff(app, AVAILABLE_STORES[store].catalogId, 1));
    const diffs = await Promise.all(fetchDiffs);
    diffs.forEach((diff, i) => {
      recentUpdateCache[beerStores[i]] = diff[0];
    });
    recentUpdateCacheTime = Date.now();
    return recentUpdateCache;
  }
  
  app.router.get('/', async ctx => {
    ctx.render('index', {beerStores, AVAILABLE_STORES});
  });
  
  app.router.get('/diff/:store', async ctx => {
    ctx.state.storeSettings = AVAILABLE_STORES[ctx.params.store];
    ctx.state.diffs = await getDiff(app, ctx.state.storeSettings.catalogId);
    ctx.render('diff');
  });

  app.router.get('/diff/:store.json', async ctx => {
    const storeSettings = AVAILABLE_STORES[ctx.params.store];
    const diffs = await getDiff(app, storeSettings.catalogId);
    ctx.json(diffs);
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
