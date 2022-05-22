'use strict';
const { Router } = require('express');
const router = Router();
const { httpContext } = require('../util/context');
const { databaseMgr } = require('../database/dbManager');
const { errorResponse, httpError } = require('../util/error');

/**
 * @swagger
 *  components:
 *      schemas:
 *          message:
 *              type: object
 *              required:
 *                  - text
 *              properties:
 *                  text:
 *                      type: string
 *                      description: text of the message
 *          message-response:
 *              type: object
 *              required:
 *                  - id
 *                  - text
 *                  - palindrome
 *              properties:
 *                  id:
 *                      type: string
 *                      description: id of the message
 *                  text:
 *                      type: string
 *                      description: text of the message
 *                  palindrome:
 *                      type: boolean
 *                      description: True if the message text is palindrome, false otherwise.
 */

/**
 * @swagger
 * tags:
 *  name: messages
 *  description: messages endpoints
 */
/**
 * @swagger
 * paths:
 *  /messages/:
 *    get:
 *      tags: [messages]
 *      responses:
 *        '200':
 *          description: Get the list of messages
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/message-response'
 *        '500':
 *          description: Internal error
 *    post:
 *      tags: [messages]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/message'
 *      responses:
 *        '201':
 *          description: The message has been created
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/message-response'
 *        '400':
 *          description: Invalid parameters
 *        '500':
 *          description: Internal error
 *  /messages/{id}/:
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        description: The id of the message
 *        schema:
 *          type: string
 *    get:
 *      tags: [messages]
 *      responses:
 *        '200':
 *          description: Get details about a particular message
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/message-response'
 *        '404':
 *          description: The message was not found
 *        '500':
 *          description: Internal error
 *    put:
 *      tags: [messages]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/message'
 *      responses:
 *        '200':
 *          description: The message has been updated
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/message-response'
 *        '400':
 *          description: Invalid parameters
 *        '404':
 *          description: The message was not found
 *        '500':
 *          description: Internal error
 *    delete:
 *      tags: [messages]
 *      responses:
 *        '204':
 *          description: The message has been deleted
 *        '404':
 *          description: The message was not found
 *        '500':
 *          description: Internal error
 */

// create a message
router.post('/', async (req, res) => {
  const context = httpContext(req, res);
  try {
    const message = req.body;
    if (!message || !message.text || message.text.trim() === '')
      throw httpError(400, `text of the message is required parameter and it shouldn't be empty`);
    const result = await databaseMgr.save(context, message);
    res.status(201).json(result).end();
  } catch (error) {
    errorResponse(context, '/message', error);
  }
});

// Get list of messages
router.get('/', async (req, res) => {
  const context = httpContext(req, res);
  try {
    const result = await databaseMgr.get(context);
    res.status(200).json(result).end();
  } catch (error) {
    errorResponse(context, '/message', error);
  }
});

// Get a message by id
router.get('/:id', async (req, res) => {
  const context = httpContext(req, res);
  try {
    const result = await _get(context, req.params.id);
    res.status(200).json(result[0]).end();
  } catch (error) {
    errorResponse(context, '/message', error);
  }
});

// Update a message
router.put('/:id', async (req, res) => {
  const context = httpContext(req, res);
  try {
    const id = req.params.id;
    if (!id) throw httpError(400, `id of the message is required parameter`);
    // check if the message exist
    await _get(context, id);
    const message = req.body;
    if (!message || !message.text || message.text.trim() === '')
      throw httpError(400, `text of the message is required parameter and it shouldn't be empty`);
    const result = await databaseMgr.update(context, id, message);
    res.status(200).json(result).end();
  } catch (error) {
    errorResponse(context, '/message', error);
  }
});

// Delete a message
router.delete('/:id', async (req, res) => {
  const context = httpContext(req, res);
  try {
    const id = req.params.id;
    if (!id) throw httpError(400, `id of the message is required parameter`);
    // check if the message exist
    await _get(context, id);
    await databaseMgr.delete(context, id);
    res.status(204).end();
  } catch (error) {
    errorResponse(context, '/message', error);
  }
});

// helper function
async function _get(context, id) {
  const result = await databaseMgr.get(context);
  if (!result || result.length === 0) throw httpError(404, `message with id: ${id} was not found`);
  return result;
}
module.exports = router;
