const Koa = require('koa');
const Pug = require('koa-pug');
const Router = require('koa-router');
const redis = require('./lib/redis')();
const moment = require('moment-timezone');
const millify = require('millify').default
moment.locale('nb');
const dev = process.env.NODE_ENV == 'development';

const app = new Koa();
const privateApp = new Koa();

const router = app.router = new Router();
const privateRouter = privateApp.router = new Router();

app.redis = redis;
const pug = new Pug({ 
  viewPath: './views',
  debug: dev,
  noCache: dev,
  locals: {
    siteTitle: 'Vinmonopolet Differ',
    moment,
    millify
  }
});

app.storeDir = require('minimist')(process.argv.slice(2))['store-dir'];

require('./routes/diff')(app, privateApp);

if (dev) app.use(require('koa-logger')());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(require('./lib/stylus-middleware')('./public'));
app.use(require('koa-static')('./public'));
pug.use(app);

if (dev) privateApp.use(require('koa-logger')());
privateApp.use(privateRouter.routes());
privateApp.use(privateRouter.allowedMethods);

app.listen(10005);
privateApp.listen(10004);
