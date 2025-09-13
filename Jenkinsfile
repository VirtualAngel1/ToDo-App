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
  }

  stages {
    stage('1: Build') {
      steps {
        echo '→ Building Front-end...'
        bat 'npm ci && npm run build'

        echo '→ Building Back-end JAR...'
        bat 'mvn -f backend/pom.xml clean package -DskipTests'
        archiveArtifacts artifacts: 'backend/target/*.jar', fingerprint: true
      }
    }

    stage('2: Test') {
      steps {
        echo '→ Testing Front-end...'
        bat 'npm test'

        echo '→ Testing Back-end...'
        bat 'mvn -f backend/pom.xml test'
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
          bat '''
            sonar-scanner ^
              -Dsonar.projectKey=my-org_my-fullstack-app ^
              -Dsonar.organization=my-org ^
              -Dsonar.sources=.,backend/src ^
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
          snyk test --file=backend/pom.xml --json --severity-threshold=high > snyk-backend.json
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

    stage('5: Deploy to Staging (Docker Compose)') {
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
        input message: "Approve production release of build #${env.BUILD_NUMBER}?", ok: 'Deploy'

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
