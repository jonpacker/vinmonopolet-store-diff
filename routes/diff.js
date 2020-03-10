const getDiff = require('../lib/get_product_diff');
const getStock = require('../lib/get_store_stock');
const Feed = require('feed');
const {runDiff} = require('../lib/diff_product_list');
const lrj = require('../lib/long_running_jobs');

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
  'linderud': {
    catalogId: 'vp_linderud',
    storeName: 'Oslo, Linderud',
    displayName: 'Vinmonopolet Oslo, Linderud',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'os': {
    catalogId: 'vp_os',
    storeName: 'Os',
    displayName: 'Vinmonopolet Os',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'asane': {
    catalogId: 'vp_asane',
    storeName: 'Bergen, Åsane',
    displayName: 'Vinmonopolet Åsane',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'oslocc': {
    catalogId: 'vp_oslocc',
    storeName: 'Oslo, CC Vest',
    displayName: 'Vinmonopolet Oslo, CC Vest',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'oslocity': {
    catalogId: 'vp_oslocity',
    storeName: 'Oslo, Oslo City',
    displayName: 'Vinmonopolet Oslo City',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
<<<<<<< HEAD
=======
  'oslostoro': {
    catalogId: 'vp_oslostoro',
    storeName: 'Oslo, Storo',
    displayName: 'Vinmonopolet Oslo, Storo',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'sletten': {
    catalogId: 'vp_sletten',
    storeName: 'Bergen, Sletten',
    displayName: 'Bergen, Sletten',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'fyllingsdalen': {
    catalogId: 'vp_fyllingsdalen',
    storeName: 'Bergen, Fyllingsdalen',
    displayName: 'Bergen, Fyllingsdalen',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'dmbourbon': { 
    catalogId: 'dm_bourbon',
    displayName: "Dan Murphy's Online Bourbon Selection",
    module: 'danmurphys', 
    productType: 'bourbon' 
  },
  'vp_cat': {
    catalogId: 'vp_beer_cat',
    displayName: 'Vinmonopolet Fullstendig Ølutvalg',
    module: 'vp_catalog_scrape',
    runsLong: true
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

const otherStores = [
  'os',
  'linderud',
  'asane',
  'oslocc',
  'sletten',
  'fyllingsdalen',
  'oslostoro',
  'oslocity'
]

module.exports = (app, privateApp) => {
  privateApp.router.get('/diff/run_all', async ctx => {
    const allStores = beerStores.concat(otherStores);
    const diffTasks = allStores.map(store => runDiff(app, AVAILABLE_STORES[store]));
    const diffs = await Promise.all(diffTasks);
    const statusLog = diffs.map((diff, i) => {
      if (diff.length == 0) {
        return `${allStores[i]} - ${new Date().toString()}: No changes found`;
      } else {
        const removes = diff.filter(({op}) => op == 'remove').length;
        const adds = diff.filter(({op}) => op == 'add').length;
        return `${allStores[i]} - ${new Date().toString()}: Changes found: ${adds} added, ${removes} removed`;
      }
    });
    ctx.body = statusLog.join('\n');
  });
  
  privateApp.router.get('/diff/:store/run', async ctx => {
    ctx.state.store = AVAILABLE_STORES[ctx.params.store];
    if (ctx.state.store.runsLong) {
      runDiff(app, ctx.state.store);
      const jobId = lrj.getLastRunJob();
      ctx.body = `${new Date()}: Started job "${ctx.params.store}". Possible job ID: ${jobId}`;
      return
    }
    const diff = await runDiff(app, ctx.state.store)
    if (diff.length == 0) {
      ctx.body = `${new Date().toString()}: No changes found`;
    } else {
      const removes = diff.filter(({op}) => op == 'remove').length;
      const adds = diff.filter(({op}) => op == 'add').length;
      ctx.body = `${new Date().toString()}: Changes found: ${adds} added, ${removes} removed`;
    }
  });

  app.router.get('/diff/job/:jobid', ctx => {
    let status;
    try {
      status = lrj.getJobStatus(ctx.params.jobid);
      ctx.body = status
    } catch (e) {
      ctx.status = 404;
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
    ctx.render('index', {beerStores, otherStores, AVAILABLE_STORES});
  });

  app.router.get('/stock/:store', async ctx => {
    ctx.state.storeSettings = AVAILABLE_STORES[ctx.params.store];
    ctx.state.stock = await getStock(app, ctx.state.storeSettings);
    ctx.render('stock');
  });

  app.router.post('/diff/:store/add_slack_webhook', async ctx => {
    const body = await new Promise((resolve, reject) => {
      let bodyString = '';
      ctx.req.on('data', chunk => bodyString += chunk);
      ctx.req.on('end', () => {
        try {
          resolve(JSON.parse(bodyString));
        } catch (e) {
          reject(e);
        }
      });
    });
    if (!body.hook || !body.key) {
      ctx.status = 400;
      ctx.json = true;
      ctx.body = {error: 'please specify a "hook" property for the webhook and a "key" property for a reference key for deletion'};
    }
    const storeSettings = AVAILABLE_STORES[ctx.params.store];
    if (!storeSettings) {
      ctx.status = 404;
      ctx.json = true;
      ctx.body = {error: 'no such store: ' + ctx.params.store};
    }
    await app.redis.hmsetAsync(`vpdiff_slack_webhooks_${storeSettings.catalogId}`, body.key, body.hook);
    ctx.status = 201;
    ctx.body = "OK";
  });

  app.router.delete('/diff/:store/slack_webhooks/:key', async ctx => {
    const storeSettings = AVAILABLE_STORES[ctx.params.store];
    if (!storeSettings) {
      ctx.status = 404;
      ctx.json = true;
      ctx.body = {error: 'no such store: ' + ctx.params.store};
    }
    ctx.body = await app.redis.hdelAsync(`vpdiff_slack_webhooks_${storeSettings.catalogId}`, ctx.params.key);
  });

  privateApp.router.get('/diff/:store/slack_webhooks', async ctx => {
    const storeSettings = AVAILABLE_STORES[ctx.params.store];
    if (!storeSettings) {
      ctx.status = 404;
      ctx.json = true;
      ctx.body = {error: 'no such store: ' + ctx.params.store};
    }
    ctx.body = await app.redis.hkeysAsync(`vpdiff_slack_webhooks_${storeSettings.catalogId}`);
  });
  
  app.router.get('/diff/:store', async ctx => {
    ctx.state.storeSettings = AVAILABLE_STORES[ctx.params.store];
    ctx.state.diffs = await getDiff(app, ctx.state.storeSettings.catalogId);
    ctx.render('diff');
  });

  app.router.get('/diff/:store/json', async ctx => {
    const storeSettings = AVAILABLE_STORES[ctx.params.store];
    const diffs = await getDiff(app, storeSettings.catalogId);
    ctx.body = JSON.stringify(diffs);
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
