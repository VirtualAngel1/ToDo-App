pipeline {
  agent any

  tools {
    maven 'Maven_3.9.6'
  }

  environment {
    SONARQUBE_SERVER_ID     = 'SonarCloud'
    SNYK_TOKEN              = credentials('snyk-token')
    RENDER_API_KEY          = credentials('render-key')
    RENDER_FRONTEND_ID      = 'srv-d31s9v2dbo4c739tapn0'
    RENDER_BACKEND_ID       = 'srv-d31s2kjipnbc73cko4cg'
    SERVICE_URL_FRONTEND    = 'https://todo-app-4g2e.onrender.com'
    SERVICE_URL_BACKEND     = 'https://to-do-app-raw1.onrender.com'
  }

  stages {

    stage('1: Build') {
      steps {
        script {
          echo '→ Building Front-end...'
          dir('client') {
            bat 'npm ci'
            bat 'npm run build'
          }

          if (fileExists('server/package.json')) {
            echo '→ Installing Node.js Back-end deps...'
            dir('server') {
              bat 'npm ci'
            }
          } else {
            echo '↷ Skipping Node.js Back-end (server/package.json not found)'
          }

          if (fileExists('server/pom.xml')) {
            echo '→ Building Java Back-end JAR (with tests)...'
            bat 'mvn -f server\\pom.xml clean package'
            archiveArtifacts artifacts: 'server/target/*.jar',
                             fingerprint: true,
                             allowEmptyArchive: true,
                             onlyIfSuccessful: true
          } else {
            echo '↷ Skipping Java Back-end (server/pom.xml not found)'
          }
        }
      }
      post {
        always {
          script {e
            if (fileExists('server/target/surefire-reports')) {
              junit 'server/target/surefire-reports/*.xml'
            } else {
              echo '↷ No JUnit XML found for backend tests'
            }
          }
        }
      }
    }

    stage('2: Test') {
      steps {
        script {
          if (fileExists('client/package.json')) {
            echo '→ Testing Front-end...'
            dir('client') {
              bat 'npm ci'
              bat 'set JEST_JUNIT_OUTPUT=./junit.xml && npm test -- --ci --reporters=default --reporters=jest-junit'
            }
          } else {
            echo '↷ Skipping Front-end tests (client/package.json not found)'
          }

          if (fileExists('server/pom.xml')) {
           echo '→ Re-running Back-end tests...'
          bat 'mvn -f server\\pom.xml test'
          }
        }
      }
      post {
        always {
          script {
            if (fileExists('client/junit.xml')) {
              junit 'client/junit.xml'
            } else if (fileExists('client/test-results')) {
              junit 'client/test-results/*.xml'
            } else {
              echo '↷ No JUnit XML found for frontend tests'
            }
          }
        }
      }
    }

    stage('3: Code Quality') {
      steps {
        echo '→ Running SonarCloud analysis...'
        withSonarQubeEnv("${SONARQUBE_SERVER_ID}") {
          bat '''
            sonar-scanner ^
              -Dsonar.projectKey=my-org_my-fullstack-app ^
              -Dsonar.organization=my-org ^
              -Dsonar.sources=.,server/src ^
              -Dsonar.host.url=%SONAR_HOST_URL% ^
              -Dsonar.login=%SONAR_AUTH_TOKEN%
          '''
        }
      }
    }

    stage('4: Security') {
      steps {
        echo '→ Scanning Front-end with Snyk...'
        bat 'npm install -g snyk'
        bat """
          snyk auth %SNYK_TOKEN%
          snyk test --json --severity-threshold=high > snyk-frontend.json
        """

        echo '→ Scanning Back-end with Snyk...'
        bat """
          snyk auth %SNYK_TOKEN%
          snyk test --file=server/pom.xml --json --severity-threshold=high > snyk-backend.json
        """
      }
      post {
        always {
          archiveArtifacts artifacts: 'snyk-frontend.json,snyk-backend.json'
        }
        failure {
          echo 'One or more Snyk scans failed, please view the JSON reports.'
        }
      }
    }

    stage('5: Deploy to Staging') {
      steps {
        echo '→ Deploying to local staging environment with Docker Compose...'
        bat 'docker compose -f docker-compose.staging.yml down || exit 0'
        bat 'docker compose -f docker-compose.staging.yml up -d --build'
        bat 'ping -n 6 127.0.0.1 > nul && curl -f http://localhost:3000/health'
      }
    }

    stage('6: Release to Production') {
      when { branch 'main' }
      steps {
        echo '→ Front-end production deploy to Render...'
        bat """
          curl -X POST https://api.render.com/deploy/${RENDER_FRONTEND_ID}/webhook ^
            -H "Authorization: Bearer ${RENDER_API_KEY}" ^
            -H "Accept: application/json"
        """

        echo '→ Back-end production deploy to Render...'
        bat """
          curl -X POST https://api.render.com/deploy/${RENDER_BACKEND_ID}/webhook ^
            -H "Authorization: Bearer ${RENDER_API_KEY}" ^
            -H "Accept: application/json"
        """
      }
      post {
        success {
          script { currentBuild.displayName = "prod-${env.BUILD_NUMBER}" }
        }
      }
    }

    stage('7: Monitoring') {
      steps {
        withCredentials([string(credentialsId: 'better-uptime-token', variable: 'BU_TOKEN')]) {
          bat """
            set URL=https://to-do-app-raw1.onrender.com
            for /f "delims=" %%i in ('curl -s -H "Authorization: Token token=%BU_TOKEN%" "https://api.betteruptime.com/v2/incidents?filter[status]=open&filter[monitor_url]=%URL%"') do set RESPONSE=%%i
            echo %RESPONSE% | jq ".data | length" > count.txt
            set /p COUNT=<count.txt
            if %COUNT% GTR 0 (
              echo Better Uptime reports %COUNT% open incident(s)
              exit /b 1
            )
          """
        }
      }
      post {
        failure {
          slackSend channel: '#prod-alerts', color: 'danger',
            message: "Monitoring failed: Open incidents in Better Uptime."
        }
      }
    }
  }

  post {
    success  { echo '✅ Pipeline completed successfully.' }
    unstable { echo '⚠️ Pipeline completed with warnings or test failures.' }
    failure  { echo '❌ Pipeline failed, please check console output and artifacts.' }
  }
}
