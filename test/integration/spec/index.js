const TestUsers = require(`../../..`);
const chai = require(`chai`);
const chaiAsPromised = require(`chai-as-promised`);
const uuid = require(`uuid`);

const {assert} = chai;
chai.use(chaiAsPromised);

assert.hasAccessToken = (user) => {
  assert.isDefined(user.token.access_token, `user.token.access_token is defined`);
  assert.isDefined(user.token.expires_in, `user.token.expires_in is defined`);
  assert.isDefined(user.token.token_type, `user.token.token_type is defined`);
  assert.isDefined(user.token.refresh_token, `user.token.refresh_token is defined`);
  assert.isDefined(user.token.refresh_token_expires_in, `user.token.refresh_token_expires_in is defined`);
  assert.isDefined(user.token.expires, `user.token.expires is defined`);
  assert.isDefined(user.token.refresh_token_expires, `user.token.refresh_token_expires is defined`);
};

assert.hasAuthorizationCode = (user) => {
  assert.isDefined(user.token, `user.token is defined`);
  assert.isDefined(user.token.auth_code, `user.token.auth_code is defined`);
};

assert.hasRefreshToken = (user) => {
  assert.isDefined(user.token, `user.token is defined`);
  assert.isDefined(user.token.refresh_token, `user.token.refresh_token is defined`);
  assert.isDefined(user.token.refresh_token_expires_in, `user.token.refresh_token_expires_in is defined`);
  assert.isDefined(user.token.refresh_token_expires, `user.token.refresh_token_expires is defined`);
};

assert.isTestUser = (user) => {
  assert.isDefined(user, `user is defined`);
  assert.isDefined(user.displayName, `user.displayName is defined`);
  assert.isDefined(user.email, `user.email is defined`);
  assert.isDefined(user.emailAddress, `user.emailAddress is defined`);
  assert.isDefined(user.id, `user.id is defined`);
  assert.isDefined(user.password, `user.password is defined`);
};

describe(`TestUsers`, () => {
  const emailAddress = `test-${uuid.v4()}@wx2.example.com`;
  const password = `${uuid.v4()}1@A`;
  const displayName = uuid.v4();

  function prune(user) {
    return {
      id: user.id,
      email: user.emailAddress || user.email,
      password: user.password
    };
  }

  function refresh(user) {
    assert.hasRefreshToken(user);
    return TestUsers.request({
      method: `POST`,
      uri: `${process.env.IDBROKER_BASE_URL || 'https://idbroker.webex.com'}/idb/oauth2/v1/access_token`,
      form: {
        /* eslint-disable camelcase */
        grant_type: `refresh_token`,
        redirect_uri: process.env.WEBEX_REDIRECT_URI || process.env.CISCOSPARK_REDIRECT_URI,
        refresh_token: user.token.refresh_token
        /* eslint-enable */
      },
      auth: {
        user: process.env.WEBEX_CLIENT_ID || process.env.CISCOSPARK_CLIENT_ID,
        pass: process.env.WEBEX_CLIENT_SECRET || process.env.CISCOSPARK_CLIENT_SECRET
      }
    });
  }

  describe(`.create()`, () => {
    it(`creates a test user`, () => TestUsers.create()
      .then((u) => {
        assert.isTestUser(u);
        assert.hasAccessToken(u);
      }));

    it(`creates a test user with a custom email address`, () => TestUsers.create({emailAddress})
      .then((u) => {
        assert.isTestUser(u);
        assert.hasAccessToken(u);
        assert.equal(u.email, emailAddress);
      }));

    it(`creates a test user with a custom password`, () => TestUsers.create({password})
      .then((u) => {
        assert.isTestUser(u);
        assert.hasAccessToken(u);
        assert.equal(u.password, password);
      }));

    it(`creates a test user with a custom display name`, () => TestUsers.create({displayName})
      .then((u) => {
        assert.isTestUser(u);
        assert.hasAccessToken(u);
        assert.equal(u.displayName, displayName);
      }));

    it(`creates a test user with a usable refresh token`, () => TestUsers.create({})
      .then((u) => {
        assert.isTestUser(u);
        assert.hasAccessToken(u);
        return assert.isFulfilled(refresh(u));
      }));

    it(`creates a test user but returns an authorization code`, () => TestUsers.create({authCodeOnly: true})
      .then((u) => {
        assert.isTestUser(u);
        assert.hasAuthorizationCode(u);
      }));

    it(`creates a test user in another org`, () => assert.isFulfilled(TestUsers.create({
      orgId: `kmsFederation`,
      entitlements: [`webExSquared`]
    })));

  });

  describe(`.login()`, () => {
    it(`retrieves credentials for the specified user`, () => TestUsers.create()
      .then(prune)
      .then(TestUsers.login)
      .then((token) => {
        assert.hasAccessToken({token});
      }));

    it(`retrieves credentials with a useable refresh token`, () => TestUsers.create()
      .then(prune)
      .then(TestUsers.login)
      .then((token) => {
        assert.hasAccessToken({token});
        assert.hasRefreshToken({token});
        return assert.isFulfilled(refresh({token}));
      }));
  });

  describe(`.delete()`, () => {
    it(`deletes the specified test user`, () => TestUsers.create()
      .then((u) => assert.isFulfilled(TestUsers.delete(u))));

    it(`deletes a test user if no access token is available`, () => TestUsers.create()
      .then(prune)
      .then((u) => assert.isFulfilled(TestUsers.delete(u))));
  });

  describe(`.remove()`, () => {
    it(`aliases .delete()`, () => {
      assert.equal(TestUsers.remove, TestUsers.delete);
    });
  });
});
