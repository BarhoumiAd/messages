const { readSrcFile } = require('../util/util');

async function setup(context) {
  try {
    console.log(`Setting up the database.`);
    context.logger().debug(`Setting up the database.`);
    const result = await context
      .sql()
      .query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'qlik';`);
    if (result.rowCount === 0) {
      console.log(`In Condition`);
      const schema = readSrcFile('database/schema.sql');
      console.log(`schema: ${schema}`);
      await context.sql().query(schema);
      console.log(`Here`);
    }
  } catch (error) {
    console.log(`error message: ${error.message}`);
    console.log(`[ERROR]: ${JSON.stringify(error, null, 2)}`);
  }
}

module.exports = { setup };
