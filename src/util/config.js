class Config {
  constructor() {
    this.mode = process.env.MODE || '';

    this.pgHost = process.env.PG_HOST;
    this.pgPort = process.env.PG_PORT;
    this.pgUser = process.env.PG_USER;
    this.pgPassword = process.env.PG_PASSWORD;
    this.pgDbName = process.env.PG_DB || 'qlik';
    this.redis = {
      REDIS_UNAME: process.env.REDIS_UNAME,
      REDIS_PORT: process.env.REDIS_PORT,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PASS: process.env.REDIS_PASS,
    };
    this.APIV1 = '/api/v1';
    this.PORT = 3000;
    this.SYNCUP_PERIOD = 5000;
  }

  devMode() {
    return this.mode.toLowerCase() === 'development';
  }
}

const config = new Config();
module.exports = { config };
