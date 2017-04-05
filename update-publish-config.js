const fs = require(`fs`);
const pkg = require(`./package.json`);

pkg.publishConfig = {
  registry: `http://engci-maven-master.cisco.com/artifactory/api/npm/webex-release-npm`
};

fs.writeFileSync(`./package.json`, `${JSON.stringify(pkg, null, 2)}\n`);
