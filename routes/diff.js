const getBeerDiff = require('../lib/get_beer_diff');
const Feed = require('feed');

module.exports = app => {
  app.router.get('/121', async ctx => {
    ctx.state.store = "Bergen, Bergen Storsenter";
    ctx.state.diffs = await getBeerDiff(app, ctx.state.store);
    ctx.render('diff');
  });
  
  app.router.get('/121.xml', async ctx => {
    const diffs = await getBeerDiff(app, "Bergen, Bergen Storsenter");
    let feed = new Feed({
      title: 'Bergen, Bergen Storsenter New Items',
      description: 'New beers at Bergen Storsenter',
      id: 'http://vpdiff.jonpacker.com/121',
      link: 'http://vpdiff.jonpacker.com/121',
      feedLinks: {
        atom: 'http://vpdiff.jonpacker.com/121.xml',
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
