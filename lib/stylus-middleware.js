const stylus = require('stylus');
const nib = require('nib')

module.exports = function(src){
  const middleware = stylus.middleware({
    src: src,
    compile: (str, path) => {
      return stylus(str)
        .set('filename', path)
        .set('compress', process.env.NODE_ENV != 'development')
        .use(nib());
    }
  });

  const compile = (req, res) => new Promise((resolve, reject) => {
    middleware(req, res, err => err ? reject(err) : resolve());
  });

  return async function(ctx, next){
    await compile(ctx.req, ctx.res);
    await next();
  };
};
