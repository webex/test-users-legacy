const _ = require(`lodash`);
const request_ = require(`request`);
const util = require(`util`);
const bodyToString = require(`./body-to-string`);

/* eslint-disable no-console */

/**
 * Promisy wrapper around requext
 * @param {Object} options
 * @returns {Promise<HttpResponse>}
 */
module.exports = function request(options) {
  return new Promise((resolve, reject) => {
    if (process.env.ENABLE_NETWORK_LOGGING || process.env.ENABLE_VERBOSE_NETWORK_LOGGING) {
      console.info(`/**********************************************************************\\ `);
      console.info(`Request:`, options.method || `GET`, options.uri);
      console.info(`WEBEX_TRACKINGID: `, _.get(options, `headers.trackingid`));
      if (process.env.ENABLE_VERBOSE_NETWORK_LOGGING) {
        try {
          console.info(`Request Options:`, util.inspect(options, {depth: null}));
        }
        catch (e) {
          console.warn(`Could not stringify request options:`, e);
        }
      }
    }
    request_(options, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(res);
    });
  })
  .then((res) => {
    if (process.env.ENABLE_NETWORK_LOGGING || process.env.ENABLE_VERBOSE_NETWORK_LOGGING) {
      console.info(`Status Code:`, res.statusCode);
      console.info(`WEBEX_TRACKINGID:`, _.get(options, `headers.trackingid`) || _.get(res, `headers.trackingid`));
      if (process.env.ENABLE_VERBOSE_NETWORK_LOGGING) {
        try {
          console.error(`Response: `, util.inspect(res.body, {depth: null}));
        }
        catch (err) {
          console.error(`Response: `, res.body);
        }
      }
      console.info(`\\**********************************************************************/`);
    }

    if (res.statusCode >= 400) {
      throw new Error(`${res.statusCode}: ${bodyToString(res.body)}\n\n WEBEX_TRACKING_ID: ${res.headers.trackingid}`);
    }
    return res;
  });
};
