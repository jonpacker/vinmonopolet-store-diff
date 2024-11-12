var redis = require('redis');
const bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
module.exports = () => redis.createClient({ host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379 });
