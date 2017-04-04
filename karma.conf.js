/* eslint-disable global-require */
module.exports = function karmaConfig(config) {
  const pkg = require(`./package`);

  /* eslint complexity: [0] */
  const browsers = require(`./browsers`);

  const cfg = {
    basePath: `.`,

    browserDisconnectTimeout: 10000,

    browserDisconnectTolerance: 3,

    browsers: process.env.SAUCE ? Object.keys(browsers.sauce) : Object.keys(browsers.local),

    browserify: {
      debug: true,
      watch: true,
      transform: [
        `babelify`,
        `envify`
      ]
    },

    browserNoActivityTimeout: 240000,

    // Inspired by Angular's karma config as recommended by Sauce Labs
    captureTimeout: 0,

    colors: !process.env.XUNIT,

    concurrency: 3,

    customLaunchers: process.env.SAUCE && browsers.sauce,

    files: [
      `test/*/spec/**/*.js`
    ],

    frameworks: [
      `browserify`,
      `mocha`
    ],

    hostname: `127.0.0.1`,

    client: {
      mocha: {
        retries: process.env.JENKINS || process.env.CI ? 1 : 0,
        timeout: 30000
      }
    },

    mochaReporter: {
      // Hide the skipped tests on jenkins to more easily see which tests failed
      ignoreSkipped: true
    },

    port: parseInt(process.env.KARMA_PORT, 10) || 9001,

    preprocessors: {
      'test/*/spec/**/*.js': [`browserify`]
    },

    reporters: [
      `mocha`
    ],

    singleRun: false,

    // video and screenshots add on the request of sauce labs support to help
    // diagnose test user creation timeouts
    recordVideo: true,
    recordScreenshots: true
  };

  if (process.env.SAUCE) {
    cfg.sauceLabs = {
      build: process.env.BUILD_NUMBER || `local-${process.env.USER}-${pkg.name}-${Date.now()}`,
      startConnect: true,
      testName: `${pkg.name} (karma)`,
      recordScreenshots: true,
      recordVideo: true
    };
    cfg.reporters.push(`saucelabs`);
  }

  config.set(cfg);
};
