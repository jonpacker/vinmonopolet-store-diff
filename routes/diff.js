const getBeerDiff = require('../lib/get_beer_diff');
const Feed = require('feed');
const diffBeerList = require('../lib/diff_beer_list');

const AVAILABLE_STORES = {
  '121': 'Bergen, Bergen Storsenter'
}

module.exports = app => {
  app.router.get('/:store/run', async ctx => {
    ctx.state.store = AVAILABLE_STORES[ctx.params.store];
    const diff = await diffBeerList(app, ctx.state.store)
    if (diff.length == 0) {
      ctx.body = `${new Date().toString()}: No changes found`;
    } else {
      const removes = diff.filter(({op}) => op == 'remove').length;
      const adds = diff.filter(({op}) => op == 'add').length;
      ctx.body = `${new Date().toString()}: Changes found: ${adds} added, ${removes} removed`;
    }
  });
  
  app.router.get('/:store', async ctx => {
    ctx.state.store = AVAILABLE_STORES[ctx.params.store];
    ctx.state.diffs = await getBeerDiff(app, ctx.state.store);
    ctx.render('diff');
  });
  
  app.router.get('/:store/feed.xml', async ctx => {
    const store = AVAILABLE_STORES[ctx.params.store];
    const diffs = await getBeerDiff(app, store);
    let feed = new Feed({
      title: `${store} New Beers`,
      description: `${store} New Beers`,
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
        const beer = `${value.brewery} - ${value.name}`;
        const story = `+${value.stock} ${beer} ${value.price}kr`;
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
