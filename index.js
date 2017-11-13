const Koa = require('koa');
const Pug = require('koa-pug');
const Router = require('koa-router');
const redis = require('./lib/redis')();
const dev = process.env.NODE_ENV == 'development';

var app = new Koa();
const router = app.router = new Router();
app.redis = redis;
const pug = new Pug({ 
  viewPath: './views',
  debug: dev,
  noCache: dev,
  locals: {
    siteTitle: 'Vinmonopolet Differ'
  }
});

require('./routes/diff')(app);

if (dev) app.use(require('koa-logger')());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(require('./lib/stylus-middleware')('./public'));
app.use(require('koa-static')('./public'));
pug.use(app);

app.listen(10005);
