const assert = require(`assert`);
const btoa = require(`btoa`);
const _ = require(`lodash`);
const randomName = require(`node-random-name`);
const generateRandomString = require(`./generate-random-string.js`);
const request = require(`./request`);

// eslint-disable-next-line func-names
const CONVERSATION_SERVICE = (function() {
  let cs = process.env.CONVERSATION_SERVICE_URL || process.env.CONVERSATION_SERVICE;
  if (!cs && process.env.WDM_SERVICE_URL) {
    if (process.env.WDM_SERVICE_URL.includes(`wdm-integration`)) {
      cs = `https://conv-a.wbx2.com/conversation/api/v1`;
    }
    if (process.env.WDM_SERVICE_URL.includes(`wdm-a`)) {
      cs = `https://conv-a.wbx2.com/conversation/api/v1`;
    }
  }

  if (!cs) {
    cs = `https://conv-a.wbx2.com/conversation/api/v1`;
  }
  return cs;
}());
const BASE_PATH_SECURE = `${CONVERSATION_SERVICE}/users/test_users_s`;
const BASE_PATH = `${CONVERSATION_SERVICE}/users/test_users`;

/**
 * Computes `expires` and `refresh_token_expires` from `expires_in` and
 * `refresh_token_expires_in` and creates an `authorization` string.
 * @param {Object} token
 * @private
 * @returns {Object}
 */
function fixToken(token) {
  const now = Date.now();
  if (token.expires_in && !token.expires) {
    token.expires = now + token.expires_in * 1000;
  }

  if (token.refresh_token_expires_in && !token.refresh_token_expires) {
  /* eslint camelcase: [0] */
    token.refresh_token_expires = now + token.refresh_token_expires_in * 1000;
  }

  if (token.token_type && token.access_token) {
    token.authorization = `${token.token_type} ${token.access_token}`;
  }
  return token;
}

let clientToken;
/**
 * Fetches credentials to talk to the test_users_s endpoint
 * @param {Object} options
 * @private
 * @returns {String}
 */
function getClientCredentials(options) {
  if (clientToken) {
    return Promise.resolve(clientToken);
  }
  const clientId = options.clientId || process.env.WEBEX_CLIENT_ID || process.env.CISCOSPARK_CLIENT_ID;
  assert(clientId, `options.clientId, process.env.WEBEX_CLIENT_ID, or process.env.CISCOSPARK_CLIENT_ID must be defined`);
  const clientSecret = options.clientSecret || process.env.WEBEX_CLIENT_SECRET || process.env.CISCOSPARK_CLIENT_SECRET;
  assert(clientSecret, `options.clientSecret, process.env.WEBEX_CLIENT_SECRET, or process.env.CISCOSPARK_CLIENT_SECRET must be defined`);

  return request({
    method: `POST`,
    uri: `${process.env.IDBROKER_BASE_URL || `https://idbroker.webex.com`}/idb/oauth2/v1/access_token`,
    json: true,
    form: {
      grant_type: `client_credentials`,
      scope: `webexsquare:get_conversation`,
      client_id: clientId,
      client_secret: clientSecret
    },
    headers: {
      // Note: we can't request's auth hash here because this endpoint expects
      // us to send the auth header *without including "Basic "* before the
      // token string
      authorization: btoa(`${clientId}:${clientSecret}`)
    }
  })
    .then((res) => {
      const token = fixToken(res.body);
      return `${token.token_type} ${token.access_token}`;
    })
    .then((token) => {
      clientToken = token;
      return clientToken;
    });
}

/**
 * Makes a request authorized with client credentials
 * @param {Object} options
 * @private
 * @returns {Promise<HttpResponseObject>}
 */
function requestWithAuth(options) {
  return getClientCredentials(options.body)
    .then((authorization) => {
      options.headers = options.headers || {};
      options.headers.authorization = authorization;
      return request(options);
    });
}

/**
 * Creates a test user
 * @param {Object} options
 * @returns {Object}
 */
function create(options) {
  options = options || {};
  const body = _.defaultsDeep({}, options, {
    // The four characters on the end are to hit all the password requirements
    password: `${generateRandomString(10)}zA1*`,
    displayName: randomName(),
    clientId: process.env.WEBEX_CLIENT_ID || process.env.CISCOSPARK_CLIENT_ID,
    clientSecret: process.env.WEBEX_CLIENT_SECRET || process.env.CISCOSPARK_CLIENT_SECRET,
    emailTemplate: options.email || options.emailAddress,
    // defaultsDeep doesn't seem to handle arrays
    entitlements: options.entitlements || [
      `spark`,
      `squaredCallInitiation`,
      `squaredRoomModeration`,
      `squaredInviter`,
      `webExSquared`
    ],
    scopes: options.scope || process.env.WEBEX_SCOPE || process.env.CISCOSPARK_SCOPE
  });

  return requestWithAuth({
    method: `POST`,
    uri: BASE_PATH_SECURE,
    json: true,
    body
  })
    .then((res) => Object.assign({
      password: JSON.parse(res.request.body).password,
      emailAddress: res.body.user.email,
      displayName: res.body.user.name
    }, res.body.user, {token: fixToken(res.body.token)}));
}

/**
 * Exchanges a user name/password for an access token
 * @param {Object} options
 * @returns {Object}
 */
function login(options) {
  return request({
    method: `POST`,
    uri: `${BASE_PATH}/login`,
    json: true,
    body: _.defaultsDeep(options, {
      clientId: process.env.WEBEX_CLIENT_ID || process.env.CISCOSPARK_CLIENT_ID,
      clientSecret: process.env.WEBEX_CLIENT_SECRET || process.env.CISCOSPARK_CLIENT_SECRET
    })
  })
    .then((res) => fixToken(res.body));
}

/**
 * Deletes a test user
 * @param {Object} options
 * @returns {Object}
 */
function remove(options) {
  if (!options) {
    return Promise.reject(new Error(`options is required`));
  }

  if (!options.id) {
    return Promise.reject(new Error(`options.id is required`));
  }

  if (!options.token) {
    return login(options)
      .then((token) => remove(Object.assign({token}, options)));
  }

  assert(options.token.authorization, `options.token.authorization must be defined`);

  return request({
    method: `POST`,
    json: true,
    headers: {
      authorization: options.token.authorization
    },
    body: {
      /* eslint-disable camelcase */
      user_id: options.id,
      refresh_token: options.token.refresh_token
      /* eslint-enable camelcase */
    },
    uri: `${BASE_PATH}/delete`
  });
}

const TestUsers = {
  create,

  login,

  remove,

  delete: remove,

  generateRandomString,

  request
};

module.exports = TestUsers;
