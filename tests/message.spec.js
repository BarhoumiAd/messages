const request = require('supertest');
const app = require('../src/app.js');
const { config } = require('../src/util/config');
jest.setTimeout(20 * 10000);
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
