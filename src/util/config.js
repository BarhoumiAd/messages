class Config {
  constructor() {
    this.mode = process.env.MODE || '';

    this.pgHost = process.env.PG_HOST;
    this.pgPort = process.env.PG_PORT;
    this.pgUser = process.env.PG_USER;
    this.pgPassword = process.env.PG_PASSWORD;
    this.pgDbName = process.env.PG_DB || 'qlik';
    this.APIV1 = '/api/v1';
    this.PORT = 3000;
  }

  devMode() {
    return this.mode.toLowerCase() === 'development';
  }
}

const config = new Config();
module.exports = { config };
