const getDiff = require('../lib/get_product_diff');
const getStock = require('../lib/get_store_stock');
const Feed = require('feed');
const {runDiff} = require('../lib/diff_product_list');
const {applyVintappdToDiffs, applyVintappdToProductList} = require('../lib/add_vintappd_metadata')
const lrj = require('../lib/long_running_jobs');

const AVAILABLE_STORES = {
  'bystasjonen': { 
    catalogId: 'vp_bystasjonen', 
    storeName: 'Bergen, Bergen Storsenter', 
    displayName: 'Vinmonopolet Bystasjonen',
    module: 'vinmonopolet', 
    productType: 'BEER',
    vintappd: true
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
  'trondheimtorg': {
    catalogId: 'trondheimtorg',
    storeName: 'Trondheim Torg',
    displayName: 'Trondheim Torg',
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
  'tonsberg': {
    catalogId: 'vp_tonsberg',
    storeName: 'Tønsberg',
    displayName: 'Tønsberg',
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
  'valken': {
    catalogId: 'vp_valken',
    storeName: 'Bergen, Valkendorfsgt.',
    displayName: 'Bergen, Valkendorfsgt.',
    module: 'vinmonopolet',
    productType: 'LIQUOR'
  },
  'sarpsborg': {
    catalogId: 'vp_sarpsborg',
    storeName: 'Sarpsborg, Borg',
    displayName: 'Sarpsborg, Borg',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'drammen': {
    catalogId: 'vp_drammen',
    storeName: 'Drammen CC',
    displayName: 'Drammen CC',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'alna': {
    catalogId: 'vp_alna',
    storeName: 'Oslo, Alna',
    displayName: 'Oslo, Alna',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'ski': {
    catalogId: 'vp_ski',
    storeName: 'Ski',
    displayName: 'Ski',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'arna': {
    catalogId: 'vp_arna',
    storeName: 'Bergen, Arna',
    displayName: 'Bergen, Arna',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'asker': {
    catalogId: 'vp_asker',
    storeName: 'Asker',
    displayName: 'Asker',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'lillehammer': {
    catalogId: 'vp_lillehammer',
    storeName: 'Lillehammer',
    displayName: 'Lillehammer',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'herbarium': {
    catalogId: 'vp_herbarium',
    storeName: 'Stavanger, Herbarium',
    displayName: 'Stavanger, Herbarium',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'haugesund': {
    catalogId: 'vp_haugesund',
    storeName: 'Haugesund',
    displayName: 'Haugesund',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'kopervik': {
    catalogId: 'vp_kopervik',
    storeName: 'Karmøy, Kopervik',
    displayName: 'Karmøy, Kopervik',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'karmoyoasen': {
    catalogId: 'vp_karmoyoasen',
    storeName: 'Karmøy, Oasen',
    displayName: 'Karmøy, Oasen',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'sandefjord': {
    catalogId: 'vp_sandefjord',
    storeName: 'Sandefjord',
    displayName: 'Sandefjord',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'larvik': {
    catalogId: 'vp_larvik',
    storeName: 'Larvik',
    displayName: 'Larvik',
    module: 'vinmonopolet',
    productType: 'BEER'
  },
  'kristiansund': {
    catalogId: 'vp_kristiansund',
    storeName: 'Kristansund N.',
    displayName: 'Kristiansund',
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
  'kvadrat',
  'oslostoro',
  'oslocity',
  'akerbrygge',
  'drammen',
  'bodo',
  'lillemarkens',
  'langnes',
  'moa',
  'trondheimtorg',
  'molde',
  'asker',
  'lillehammer'
];

const otherStores = [
  'os',
  'linderud',
  'asane',
  'oslocc',
  'sletten',
  'fyllingsdalen',
  'tonsberg',
  'sarpsborg',
  'arna',
  'ski',
  'alna',
  'haugesund',
  'herbarium',
  'kopervik',
  'karmoyoasen',
  'larvik',
  'sandefjord',
  'kristiansund'
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

  app.router.get('/stores.json', async ctx => {
    ctx.json = true
    ctx.body = [...beerStores, ...otherStores]
  })

  app.router.get('/stock/:store/json', async ctx => {
    const storeSettings = AVAILABLE_STORES[ctx.params.store];
    if (!storeSettings) {
      ctx.status = 404
      return
    }
    let stock = await getStock(app, storeSettings);
    stock = await applyVintappdToProductList(ctx.state.stock, !!ctx.query.clean)

    ctx.json = true
    ctx.body = stock
  })

  app.router.get('/stock/:store', async ctx => {
    ctx.state.storeSettings = AVAILABLE_STORES[ctx.params.store];
    ctx.state.stock = await getStock(app, ctx.state.storeSettings);
    ctx.state.stock = await applyVintappdToProductList(ctx.state.stock, !!ctx.query.clean)
    if (ctx.query.clean) ctx.redirect(ctx.path)
    else ctx.render('stock');
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
    const diffs = await getDiff(app, ctx.state.storeSettings.catalogId, 20);
    ctx.state.diffs = await applyVintappdToDiffs(diffs)
    ctx.render('diff');
  });

  app.router.get('/diff/:store/json', async ctx => {
    const storeSettings = AVAILABLE_STORES[ctx.params.store];
    const diffs = await getDiff(app, storeSettings.catalogId);
    ctx.state.diffs = await applyVintappdToDiffs(diffs)
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
