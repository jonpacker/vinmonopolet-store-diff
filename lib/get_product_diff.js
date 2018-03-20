const md5 = require('md5');
module.exports = async (app, catalogId, count = 10) => {
  const rawChangesets = await app.redis.zrevrangeAsync(md5(catalogId), 0, count, "WITHSCORES");
  const changesets = [];
  for (let i = 0; i < rawChangesets.length; i += 2) {
    const diff = JSON.parse(rawChangesets[i]);
    const seen = new Date(parseInt(rawChangesets[i+1]));
    changesets.push({
      seen,
      added: diff.filter(({op}) => op == 'add'),
      removed: diff.filter(({op}) => op == 'remove')
    })
  }
  return changesets;
}
