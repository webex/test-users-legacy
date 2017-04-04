/* eslint-disable camelcase */

module.exports = {
  local: {
    Chrome: {}
  },
  sauce: {
    sl_chrome_latest_osx11: {
      base: `SauceLabs`,
      platform: `OS X 10.11`,
      browserName: `chrome`,
      version: `latest`
    },
    sl_firefox_latest_osx11: {
      base: `SauceLabs`,
      platform: `OS X 10.11`,
      browserName: `firefox`,
      version: `latest`
    },
    sl_ie_11_win7: {
      base: `SauceLabs`,
      platform: `Windows 7`,
      browserName: `internet explorer`,
      version: `11`
    }
  }
};
