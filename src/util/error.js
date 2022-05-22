const _ = require('lodash');
const { config } = require('../util/config');
function httpError(statusCode, message) {
  const res = new Error(message);
  res.statusCode = statusCode;
  return res;
}

function reportError(context, operation, error) {
  let message = `Error detected: `;
  if (error.message) message += error.message;
  if (operation) message += `, Operation: ${operation}`;
  if (error.code) message += `, Code: ${error.code}`;
  if (error.statusCode) message += `, Status Code: ${error.statusCode}`;
  if (error.errorNum) message += `, Error Number: ${error.errorNum}`;
  if (error.response && error.response.status) message += `, Status Code: ${error.response.status}`;
  message = message.split('"').join("'");

  const errJson = _.get(error, 'response.data') || {};
  context.logger().warn(message, _.assign(errJson, { 'error.trace': error.stack }));
  if (config.devMode()) console.error(error.stack);
}

function errorObj(error, status) {
  return {
    statusCode: status || 500,
    message: error.message,
  };
}

function errorResponse(context, operation, error = null, errorObjArg = null) {
  if (!error && !errorObjArg) return;
  if (error) reportError(context, operation, error);
  const status =
    error.response && error.response.status
      ? error.response.status
      : error.statusCode
      ? error.statusCode
      : 500;
  return context.res
    .status(status)
    .json(errorObjArg || errorObj(error, status))
    .end();
}

module.exports = { httpError, reportError, errorResponse };
