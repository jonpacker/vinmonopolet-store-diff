var redis = require('redis');
const bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
module.exports = () => redis.createClient(process.env.REDIS_PORT || 6397);
