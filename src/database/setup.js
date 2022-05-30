const { readSrcFile } = require('../util/util');

async function setup(context) {
  context.logger().debug(`Setting up the database.`);
  const result = await context
    .sql()
    .query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'qlik';`);
  if (result.rowCount === 0) {
    const schema = readSrcFile('database/schema.sql');
    await context.sql().query(schema);
  }
}

module.exports = { setup };
