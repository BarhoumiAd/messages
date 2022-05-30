const Redis = require('ioredis');
const { config } = require('../util/config');
const retention = 86400;
class Cache {
  init() {
    const { logger } = require('./logger');
    this.logger = logger;
    this.redis = new Redis({
      port: config.redis.REDIS_PORT,
      host: config.redis.REDIS_HOST,
      password: config.redis.REDIS_PASS,
    });
    this.attachLoggingEventHandlers();
    this.initialized = true;
  }

  attachLoggingEventHandlers() {
    this.redis.on('connect', () => {
      this.logger.info('Connection to the Redis server is established');
    });
    this.redis.on('ready', () => {
      this.logger.info('Ready to communicate with the Redis server');
    });
    this.redis.on('error', (e) => {
      this.logger.warn(`An error has occurred with Redis: ${e}`);
    });
    this.redis.on('close', () => {
      this.logger.info('Redis server connection has closed');
    });
  }

  async put(context, key, value) {
    context.logger().debug(`CACHE[${key}] = ${JSON.stringify(value).split('"').join("'")}`);
    if (!this.initialized) this.init();
    const serialized = JSON.stringify(value);
    await this.redis.set(key, serialized);
    await this.redis.expire(key, retention);
  }

  async get(key, defaultValue = null) {
    if (!this.initialized) this.init();
    const rawData = await this.redis.get(key);
    if (rawData === null || (Array.isArray(rawData) && rawData.length === 0)) return defaultValue;
    return [JSON.parse(rawData)];
  }

  async getAll(pattern) {
    if (!this.initialized) this.init();
    const keys = await this.redis.keys(pattern);
    if (keys && keys.length > 0) {
      const result = await Promise.all(keys.map((key) => this.get(key)));
      return [].concat.apply([], result);
    }
    return [];
  }

  async expireKeys(keys) {
    for (const key of keys) {
      await this.redis.expire(key, 0);
    }
  }

  async status() {
    if (!this.initialized) return { status: 400, message: 'not initialized' };
    return { message: this.redis.status, endpoint: config.redis.REDIS_HOST };
  }
}

if (!global.cache) {
  global.cache = new Cache();
}

module.exports = { cache: global.cache };
