pipeline {
  agent any

  environment {
    SONARQUBE_SERVER_ID     = 'SonarCloud'
    SNYK_TOKEN              = credentials('snyk-token')
    RENDER_API_KEY          = credentials('render-key')
    RENDER_FRONTEND_ID      = 'srv-d31s9v2dbo4c739tapn0'
    RENDER_BACKEND_ID       = 'srv-d31s2kjipnbc73cko4cg'
    SERVICE_URL_FRONTEND    = 'https://todo-app-4g2e.onrender.com'
    SERVICE_URL_BACKEND     = 'https://to-do-app-raw1.onrender.com'
    NEWRELIC_LICENSE_KEY              = credentials('newrelic-license-key')
    NEWRELIC_FRONTEND_APPID           = ''
    NEWRELIC_BACKEND_APPID            = ''
    REACT_APP_NEWRELIC_LICENSE_KEY    = credentials('newrelic-license-key')
    REACT_APP_NEWRELIC_FRONTEND_APPID = ''
  }

  stages {
    stage('1: Build') {
      steps {
        echo '→ Building Front-end...'
        sh 'npm ci && npm run build'

        echo '→ Building Back-end JAR...'
        sh 'mvn -f backend/pom.xml clean package -DskipTests'
        archiveArtifacts artifacts: 'backend/target/*.jar', fingerprint: true
      }
    }

    stage('2: Test') {
      steps {
        echo '→ Testing Front-end...'
        sh 'npm test'

        echo '→ Testing Back-end...'
        sh 'mvn -f backend/pom.xml test'
      }
      post {
        always {
          junit '**/test-results/*.xml'
          junit 'backend/target/surefire-reports/*.xml'
        }
      }
    }

    stage('3: Code Quality') {
      steps {
        echo '→ Running SonarCloud analysis...'
        withSonarQubeEnv("${SONARQUBE_SERVER_ID}") {
          sh '''
            sonar-scanner \
              -Dsonar.projectKey=my-org_my-fullstack-app \
              -Dsonar.organization=my-org \
              -Dsonar.sources=.,backend/src \
              -Dsonar.host.url=${SONAR_HOST_URL} \
              -Dsonar.login=${SONAR_AUTH_TOKEN}
          '''
        }
      }
    }

    stage('4: Security') {
      steps {
        echo '→ Scanning Front-end with Snyk...'
        sh 'npm install -g snyk'
        sh '''
          snyk auth ${SNYK_TOKEN}
          snyk test --json --severity-threshold=high > snyk-frontend.json
        '''

        echo '→ Scanning Back-end with Snyk...'
        sh '''
          snyk auth ${SNYK_TOKEN}
          snyk test --file=backend/pom.xml --json --severity-threshold=high > snyk-backend.json
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'snyk-frontend.json,snyk-backend.json'
        }
        failure {
          echo 'One or more Snyk scans failed—see the JSON reports.'
        }
      }
    }

    stage('5: Deploy to Render') {
      steps {
        echo '→ Triggering Front-end deploy...'
        sh """
          curl -X POST https://api.render.com/deploy/${RENDER_FRONTEND_ID}/webhook \
            -H 'Authorization: Bearer ${RENDER_API_KEY}' \
            -H 'Accept: application/json'
        """

        echo '→ Triggering Back-end deploy...'
        sh """
          curl -X POST https://api.render.com/deploy/${RENDER_BACKEND_ID}/webhook \
            -H 'Authorization: Bearer ${RENDER_API_KEY}' \
            -H 'Accept: application/json'
        """
      }
    }

    stage('6: Release to Production') {
      when { branch 'main' }
      steps {
        input message: "Approve production release of build #${env.BUILD_NUMBER}?", ok: 'Deploy'

        echo '→ Front-end production deploy...'
        sh """
          curl -X POST https://api.render.com/deploy/${RENDER_FRONTEND_ID}/webhook \
            -H 'Authorization: Bearer ${RENDER_API_KEY}' \
            -H 'Accept: application/json'
        """

        echo '→ Back-end production deploy...'
        sh """
          curl -X POST https://api.render.com/deploy/${RENDER_BACKEND_ID}/webhook \
            -H 'Authorization: Bearer ${RENDER_API_KEY}' \
            -H 'Accept: application/json'
        """
      }
      post {
        success {
          script { currentBuild.displayName = "prod-${env.BUILD_NUMBER}" }
        }
      }
    }

stage('7: Monitoring & Alerting') {
  steps {
    echo '📣 Posting Front-end deployment to New Relic...'
    sh """
      curl -s -X POST https://api.newrelic.com/v2/applications/${NEWRELIC_FRONTEND_APPID}/deployments.json \\
        -H 'Api-Key: ${NEWRELIC_LICENSE_KEY}' \\
        -H 'Content-Type: application/json' \\
        -d '{
          "deployment": {
            "revision":"${env.GIT_COMMIT}",
            "description":"Build #${env.BUILD_NUMBER} front-end deployed",
            "user":"Chris"
          }
        }'
    """

    echo '📣 Posting Back-end deployment to New Relic...'
    sh """
      curl -s -X POST https://api.newrelic.com/v2/applications/${NEWRELIC_BACKEND_APPID}/deployments.json \\
        -H 'Api-Key: ${NEWRELIC_LICENSE_KEY}' \\
        -H 'Content-Type: application/json' \\
        -d '{
          "deployment": {
            "revision":"${env.GIT_COMMIT}",
            "description":"Build #${env.BUILD_NUMBER} back-end deployed",
            "user":"Chris"
          }
        }'
    """

    echo '🔍 Verifying Front-end health...'
    script {
      def feStatus = sh(returnStatus: true, script: "curl -sSf ${SERVICE_URL_FRONTEND}/health || true")
      echo feStatus == 0 ? '✅ Front-end healthy' : "🚨 Front-end health check failed (status=${feStatus})"
    }

    echo '🔍 Verifying Back-end health...'
    script {
      def beStatus = sh(returnStatus: true, script: "curl -sSf ${SERVICE_URL_BACKEND} || true")
      if (beStatus != 0) {
        error "🚨 Back-end health check failed (status=${beStatus})"
      }
      echo '✅ Back-end healthy'
        }
      }
    }
  }

  post {
    success  { echo '✅ Pipeline completed successfully.' }
    unstable { echo '⚠️ Pipeline completed with warnings or test failures.' }
    failure  { echo '❌ Pipeline failed—check console output and artifacts.' }
  }
}
