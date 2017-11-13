const getBeerDiff = require('../lib/get_beer_diff');
module.exports = app => {
  app.router.get('/121', async ctx => {
    ctx.state.diffs = await getBeerDiff(app, "Bergen, Bergen Storsenter");
    ctx.render('diff');
  });
}
