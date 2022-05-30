'use strict';
const express = require('express');
const messagesRoutes = require('./routes/messages');
const app = express();
const { setup } = require('./database/setup');
const { createSystemContext } = require('./util/context');
const { requestResponseLogger } = require('./services/logger');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { config } = require('./util/config');
const { databaseMgr } = require('./database/dbManager');
const { wait } = require('./util/util');
app.use(requestResponseLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const context = createSystemContext();
const MAX_WAITING = 120;
const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Messages API',
      version: '1.0.0',
      description: 'API specification for Messages',
    },
    servers: [
      {
        url: `http://localhost:3000/api/v1`,
      },
    ],
  },
  apis: ['./src/routes/messages.js'],
};

const specs = swaggerJsdoc(options);

app.listen(config.PORT, (err) => {
  if (err) console.log(err.message);
  console.log(`Ready on http://localhost:${config.PORT}`);
});

// health check
app.get(`${config.APIV1}/health`, (req, res) => {
  res.status(200).json({ message: 'ok' });
});

// readiness probe
app.get(`${config.APIV1}/readiness`, async (req, res) => {
  // make sure postgres is up and running
  let pgUp = await databaseMgr.pgHealth(context);
  let waiting = MAX_WAITING;
  while (!pgUp && waiting > 0) {
    await wait(5);
    pgUp = await databaseMgr.pgHealth(context);
    waiting -= 5;
  }
  if (!pgUp) res.status(503).json();
  else res.status(200).json({ message: 'ok' });
});

if (config.devMode()) {
  // wait until postgres is up and running
  let pgUp = false;
  (async function () {
    try {
      pgUp = await databaseMgr.pgHealth(context);
      while (!pgUp) {
        await wait(5);
        pgUp = await databaseMgr.pgHealth(context);
      }
      // setup the database
      await setup(context);
    } catch (error) {
      context.logger().warn(`[ERROR on Synchronize ], ${error.message}`);
      context.logger().debug(error.stack);
    }
  })()
    .then(() => {
      context.logger().info(`Database successfully initialized`);
    })
    .catch((error) => {
      context.logger().warn(`[ERROR on Synchronize IIFE call], ${error.message}`);
      context.logger().debug(error.stack);
    });
}

app.use(`${config.APIV1}/api/docs`, swaggerUi.serve);
app.get(`${config.APIV1}/api/docs`, swaggerUi.setup(specs));
app.use(`${config.APIV1}/messages`, messagesRoutes);

module.exports = app;
