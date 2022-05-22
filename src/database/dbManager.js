const { v4: uuidv4 } = require('uuid');
const INSERT_QUERY = 'INSERT INTO qlik.message(id, text, palindrome) values ($1, $2, $3)';
const GET_QUERY = 'SELECT * FROM qlik.message {WHERE_CLAUSE}';
const DELETE_QUERY = 'DELETE FROM qlik.message {WHERE_CLAUSE}';
const UPDATE_QUERY = 'UPDATE qlik.message set text = $1, palindrome = $2 {WHERE_CLAUSE}';

class DatabaseMgr {
  async save(context, message) {
    const id = uuidv4();
    const { text } = message;
    const palindrome = this._isPalindrome(text);
    await context.sql().query(INSERT_QUERY, [id, text, palindrome]);
    return { id, text, palindrome };
  }

  _isPalindrome(text) {
    let start = 0;
    let end = text.length - 1;
    while (start < end) {
      if (text[start] !== text[end]) return false;
      start += 1;
      end -= 1;
    }
    return true;
  }

  async get(context) {
    const positionalParams = [];
    let query = '';
    if (context.req.params.id) {
      query = GET_QUERY.split('{WHERE_CLAUSE}').join(`WHERE id = $1`);
      positionalParams.push(context.req.params.id);
    } else query = GET_QUERY.split('{WHERE_CLAUSE}').join('');
    const result = await context.sql().query(query, positionalParams);
    return result.rows;
  }

  async update(context, id, message) {
    const { text } = message;
    const palindrome = this._isPalindrome(text);
    const query = UPDATE_QUERY.split('{WHERE_CLAUSE}').join(`WHERE id = $3`);
    const positionalParams = [text, palindrome, id];
    await context.sql().query(query, positionalParams);
    return { id, text, palindrome };
  }

  async delete(context, id) {
    const positionalParams = [];
    const query = DELETE_QUERY.split('{WHERE_CLAUSE}').join(`WHERE id = $1`);
    positionalParams.push(id);
    await context.sql().query(query, positionalParams);
  }

  async pgHealth(context) {
    let healthy = true;
    try {
      const health = await context.sql().query(`SELECT 1;`);
      healthy = health.rowCount === 1;
    } catch (error) {
      healthy = false;
      context.logger().error(`Postgres is down: ${error.message}`);
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      return healthy;
    }
  }
}

if (!global.databaseMgr) {
  global.databaseMgr = new DatabaseMgr();
}

module.exports = { databaseMgr: global.databaseMgr };
