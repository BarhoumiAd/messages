const { v4: uuidv4 } = require('uuid');
const { config } = require('../util/config');

/* eslint-disable no-unused-vars */

const logLevels = {
  ERROR: { levelCode: 4, levelName: 'error' },
  WARN: { levelCode: 3, levelName: 'warn' },
  INFO: { levelCode: 2, levelName: 'info' },
  DEBUG: { levelCode: 1, levelName: 'debug' },
};

const responseStatusLogLevelMapping = {
  5: logLevels.ERROR,
  4: logLevels.WARN,
  3: logLevels.INFO,
  2: logLevels.INFO,
  1: logLevels.INFO,
};

let logLevel = logLevels.WARN;
if (process.env.LOG_LEVEL) {
  logLevel = logLevels[process.env.LOG_LEVEL.toUpperCase()];
  if (!logLevel) logLevel = logLevels.DEBUG;
}
if (config.devMode()) logLevel = logLevels.DEBUG;

class Logger {
  constructor(context) {
    this.context = context;
  }

  error(message, data = {}) {
    return this.log(logLevels.ERROR, message, data);
  }

  warn(message, data = {}) {
    return this.log(logLevels.WARN, message, data);
  }

  info(message, data = {}) {
    return this.log(logLevels.INFO, message, data);
  }

  debug(message, data = {}) {
    return this.log(logLevels.DEBUG, message, data);
  }

  log(level, message, data = {}) {
    if (logLevel.levelCode > level.levelCode) return {};

    let reqProps = {};
    if (this.context) {
      reqProps = this.context.req
        ? {
            'req.url': this.context.req.originalUrl || this.context.req.url,
            'req.method': this.context.req.method,
            'req.id': this.context.req._id,
            ...data,
          }
        : {};
    }

    const logItem = {
      level: level.levelName,
      datetime: new Date().toISOString(),
      message,
      ...reqProps,
    };
    console.log(JSON.stringify(logItem));
    return logItem;
  }
}

function createLogger(context) {
  return new Logger(context);
}

function requestResponseLogger(req, res, next) {
  const { httpContext } = require('../util/context');

  req._id = uuidv4();
  const context = httpContext(req, res);
  context.logger().info('Request received');

  // intercept response.end method call to log the response
  req._startTime = new Date();
  const end = res.end;
  res.end = function (chunk, encoding) {
    res.end = end;
    res.end(chunk, encoding);
    // calculate the error level
    const responseLogLevel = responseStatusLogLevelMapping[Math.floor(res.statusCode / 100)];
    const responseTime = new Date() - req._startTime;
    context.logger().log(responseLogLevel, 'Sending response', {
      'res.statusCode': res.statusCode,
      response_time: responseTime,
    });
  };
  next();
}

const logger = createLogger();
logger.info(`Logger level is set to ${JSON.stringify(logLevel).split('"').join("'")}`);

module.exports = { logger, createLogger, requestResponseLogger };
