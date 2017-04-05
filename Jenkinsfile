ansiColor('xterm') {
  timestamps {
    timeout(10) {
      def DOCKER_IMAGE_NAME = "${JOB_NAME}-${BUILD_NUMBER}-builder"
      def DOCKER_RUN_OPTS = '';
      DOCKER_RUN_OPTS = "${DOCKER_RUN_OPTS} -e NPM_CONFIG_CACHE=${env.WORKSPACE}/.npm"
      DOCKER_RUN_OPTS = "${DOCKER_RUN_OPTS} --volumes-from=\$(hostname)"
      DOCKER_RUN_OPTS = "${DOCKER_RUN_OPTS} --user=\$(id -u):\$(id -g)"
      // DOCKER_RUN_OPTS has some values in it that we want to evaluate on
      // the node, but image.inside doesn't do subshell execution. We'll use
      // echo to evaluate once on the node and store the values.
      DOCKER_RUN_OPTS = sh script: "echo -n ${DOCKER_RUN_OPTS}", returnStdout: true
      def image

      currentBuild.description = ''

      stage('checkout') {
        checkout scm
        sh 'git config user.email spark-js-sdk.gen@cisco.com'
        sh 'git config user.name Jenkins'
        try {
          pusher = sh script: 'git show  --quiet --format=%ae HEAD', returnStdout: true
          currentBuild.description += "Validating push from ${pusher}"
        }
        catch (err) {
          currentBuild.description += 'Could not determine pusher';
        }

        sshagent(['30363169-a608-4f9b-8ecc-58b7fb87181b']) {
          // return the exit code because we don't care about failures
          sh script: 'git remote add upstream git@github.com:ciscospark/test-users-legacy.git', returnStatus: true
          // Make sure local tags don't include failed releases
          sh 'git tag | xargs git tag -d'
          sh 'git gc'

          sh 'git fetch upstream --tags'
        }

        sh 'git checkout upstream/master'
        try {
          sh "git merge --ff ${GIT_COMMIT}"
        }
        catch (err) {
          currentBuild.description += 'not possible to fast forward'
          throw err;
        }
      }

      stage('docker build') {
        sh 'echo "RUN groupadd -g $(id -g) jenkins" >> ./docker/builder/Dockerfile'
        sh 'echo "RUN useradd -u $(id -u) -g $(id -g) -m jenkins" >> ./docker/builder/Dockerfile'
        sh 'echo "USER $(id -u)" >> ./docker/builder/Dockerfile'
        sh 'echo "RUN mkdir -p $HOME" >> ./docker/builder/Dockerfile'
        sh 'echo "RUN mkdir -p $HOME/.ssh" >> ./docker/builder/Dockerfile'
        sh 'echo "RUN ssh-keyscan -H github.com >> $HOME/.ssh/known_hosts" >> ./docker/builder/Dockerfile'
        sh "echo 'WORKDIR ${env.WORKSPACE}' >> ./docker/builder/Dockerfile"
        dir('docker') {
          image = docker.build(DOCKER_IMAGE_NAME);
        }
        // Reset the Dockerfile to make sure we don't accidentally commit it later
        sh "git checkout ./docker/builder/Dockerfile"
      }

      stage('install') {
        image.inside(DOCKER_RUN_OPTS) {
          sh 'npm install'
        }
      }

      stage('build') {
        image.inside(DOCKER_RUN_OPTS) {
          sh 'NODE_ENV=test npm build'
        }
      }

      stage('test') {
        image.inside(DOCKER_RUN_OPTS) {
          withCredentials([
            string(credentialsId: '9f44ab21-7e83-480d-8fb3-e6495bf7e9f3', variable: 'CISCOSPARK_CLIENT_SECRET'),
            usernamePassword(credentialsId: 'SAUCE_LABS_VALIDATED_MERGE_CREDENTIALS', passwordVariable: 'SAUCE_ACCESS_KEY', usernameVariable: 'SAUCE_USERNAME')
          ]) {
            sh 'SAUCE=true npm test'
          }
        }
      }

      stage('publish') {
        image.inside(DOCKER_RUN_OPTS) {
          withCredentials([
            string(credentialsId: 'NPM_TOKEN', variable: 'NPM_TOKEN')
          ]) {
            sh 'echo \'//registry.npmjs.org/:_authToken=${NPM_TOKEN}\' > $HOME/.npmrc'
            sh 'npm publish'
            sh 'rm -f $HOME/.npmrc'
          }
        }
      }

      stage('publish (artifactory)') {
        image.inside(DOCKER_RUN_OPTS) {
          withCredentials([
            string(credentialsId: 'ARTIFACTORY_DEPLOY_KEY-spark-js-sdk.gen', variable: 'NPM_CONFIG__AUTH')
          ]) {
            sh 'node ./update-publish-config.js'
            sh 'npm publish'
          }
        }
      }
    }
  }
}
