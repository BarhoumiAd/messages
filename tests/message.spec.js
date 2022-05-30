const request = require('supertest');
const { Pool } = require('pg');
const app = require('../src/app.js');
const { config } = require('../src/util/config');
jest.setTimeout(20 * 10000);

jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn().mockImplementation((sql, positionalParams) => {
      if (sql === 'SELECT 1;') return { rowCount: 1 };
      if (sql === `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'qlik';`)
        return { rowCount: 0 };
      if (positionalParams && positionalParams[0] === '8e236ed7-ef53-4238-b0a4-54c5f4292edf')
        return { rows: [] };
      if (positionalParams && positionalParams[0] === 'wrong-id') return { rows: [] };
      const rows = [
        {
          id: '8e236ed7-ef53-4238-b0a4-54c5f4293edf',
          text: 'level',
          palindrome: true,
        },
      ];
      return { rows };
    }),
    end: jest.fn(),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('ioredis', (setting) => {
  const readFunc = jest.fn().mockImplementation((key) => {
    return JSON.stringify({
      id: '8e236ed7-ef53-4238-b0a4-54c5f4293edf',
      text: 'Message saved in cache',
      palindrome: false,
    });
  });
  return function (uname, port, hostname, password) {
    return {
      get: readFunc,
      set: function (key, value) {
        return value;
      },
      disconnect: () => {},
      quit: () => {},
      on: () => {},
      expire: () => {},
    };
  };
});

describe('I can', () => {
  it('add a message with a palindrome text', async function (done) {
    try {
      const message = {
        text: 'level',
      };
      const result = await request(app)
        .post(`${config.APIV1}/messages`)
        .set('Content-Type', 'application/json')
        .send(message);
      expect(result.status).toEqual(201);
      expect(result.body.text).toStrictEqual('level');
      expect(result.body.palindrome).toBe(true);
      done();
    } catch (error) {
      console.log(JSON.stringify(error));
      done(error);
    }
  });

  it('add a message where the text is not palindrome', async function (done) {
    try {
      const message = {
        text: 'is not palindrome',
      };
      const result = await request(app)
        .post(`${config.APIV1}/messages`)
        .set('Content-Type', 'application/json')
        .send(message);
      expect(result.status).toEqual(201);
      expect(result.body.text).toStrictEqual('is not palindrome');
      expect(result.body.palindrome).toBe(false);
      done();
    } catch (error) {
      done(error);
    }
  });

  it('make sure that text is required and not empty string when adding a message', async function (done) {
    try {
      const message = {
        text: '',
      };
      const result = await request(app)
        .post(`${config.APIV1}/messages`)
        .set('Content-Type', 'application/json')
        .send(message);
      expect(result.status).toEqual(400);
      expect(result.body.message).toStrictEqual(
        `text of the message is required parameter and it shouldn't be empty`
      );
      done();
    } catch (error) {
      console.log(JSON.stringify(error));
      done(error);
    }
  });

  let messageId;
  it('get list of messages', async function (done) {
    try {
      const result = await request(app)
        .get(`${config.APIV1}/messages`)
        .set('Content-Type', 'application/json')
        .send();
      expect(result.status).toEqual(200);
      expect(result.body.length).toBeGreaterThan(0);
      messageId = result.body[0].id;
      done();
    } catch (error) {
      done(error);
    }
  });

  it('get details about a message', async function (done) {
    try {
      const result = await request(app)
        .get(`${config.APIV1}/messages/${messageId}`)
        .set('Content-Type', 'application/json')
        .send();
      expect(result.status).toEqual(200);
      expect(result.body).toStrictEqual({
        id: `${messageId}`,
        text: 'level',
        palindrome: true,
      });
      done();
    } catch (error) {
      done(error);
    }
  });

  it('get message with wrong message id!', async function (done) {
    try {
      const result = await request(app)
        .get(`${config.APIV1}/messages/wrong-id`)
        .set('Content-Type', 'application/json')
        .send();
      expect(result.status).toEqual(404);
      expect(result.body.message).toStrictEqual(`message with id: wrong-id was not found`);
      done();
    } catch (error) {
      done(error);
    }
  });

  it('update a message text', async function (done) {
    try {
      // empty message object
      let result = await request(app)
        .put(`${config.APIV1}/messages/${messageId}`)
        .set('Content-Type', 'application/json')
        .send({});
      expect(result.status).toEqual(400);
      expect(result.body.message).toStrictEqual(
        `text of the message is required parameter and it shouldn't be empty`
      );

      const message = {
        text: 'updated text',
      };
      result = await request(app)
        .put(`${config.APIV1}/messages/${messageId}`)
        .set('Content-Type', 'application/json')
        .send(message);
      expect(result.status).toEqual(200);
      expect(result.body.id).toEqual(messageId);
      expect(result.body.text).toStrictEqual('updated text');
      expect(result.body.palindrome).toBe(false);

      done();
    } catch (error) {
      done(error);
    }
  });

  it('update a message text with wrong id', async function (done) {
    try {
      const message = {
        text: 'wrong id',
      };
      const result = await request(app)
        .put(`${config.APIV1}/messages/wrong-id`)
        .set('Content-Type', 'application/json')
        .send(message);
      expect(result.status).toEqual(404);
      done();
    } catch (error) {
      done(error);
    }
  });

  it('delete a message', async function (done) {
    try {
      const result = await request(app).delete(`${config.APIV1}/messages/${messageId}`);
      expect(result.status).toEqual(204);
      done();
    } catch (error) {
      done(error);
    }
  });

  it('delete a message with wrong id', async function (done) {
    try {
      const result = await request(app).delete(`${config.APIV1}/messages/wrong-id`);
      expect(result.status).toEqual(404);
      expect(result.body.message).toStrictEqual(`message with id: wrong-id was not found`);
      done();
    } catch (error) {
      done(error);
    }
  });
});

describe('Database is down, No problem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('message app still work', async function (done) {
    const mPool = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    };
    jest.mock('pg', () => {
      const mPool = {
        connect: jest.fn(),
        query: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
      };
      return { Pool: jest.fn(() => mPool) };
    });
    Pool.mockImplementation(() => {
      return jest.fn(() => mPool);
    });
    try {
      // 1. sava data to the cache
      const message = {
        text: 'Message saved in cache',
      };
      let result = await request(app)
        .post(`${config.APIV1}/messages`)
        .set('Content-Type', 'application/json')
        .send(message);
      expect(result.status).toEqual(201);
      expect(result.body.text).toStrictEqual('Message saved in cache');
      expect(result.body.palindrome).toBe(false);
      const messageId = result.body.id;
      // 2. read data from the cache
      result = await request(app)
        .get(`${config.APIV1}/messages/${messageId}`)
        .set('Content-Type', 'application/json');
      expect(result.status).toEqual(200);
      expect(result.body).toStrictEqual({
        id: `8e236ed7-ef53-4238-b0a4-54c5f4293edf`,
        text: 'Message saved in cache',
        palindrome: false,
      });
      // 4. delete data from the cache
      result = await request(app).delete(`${config.APIV1}/messages/${messageId}`);
      expect(result.status).toEqual(204);
      done();
    } catch (error) {
      done(error);
    }
  });
});
