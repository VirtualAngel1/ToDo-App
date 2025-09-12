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
        echo 'Installing dependencies and building…'
        sh 'npm ci'
        sh 'npm run build'
        archiveArtifacts artifacts: 'dist/**', fingerprint: true
      }
    }

    stage('2: Test') {
      steps {
        echo 'Running tests…'
        sh 'npm test'
      }
      post {
        always {
          junit '**/test-results/*.xml'
        }
      }
    }

stage('3: Code Quality') {
  steps {
    echo 'Running SonarCloud analysis…'
    withSonarQubeEnv("${SONARQUBE_SERVER_ID}") {
      sh '''
        sonar-scanner \
          -Dsonar.projectKey=my-org_my-app   \
          -Dsonar.organization=my-org       \
          -Dsonar.sources=.                  \
          -Dsonar.host.url=${SONAR_HOST_URL} \
          -Dsonar.login=${SONAR_AUTH_TOKEN}
      '''
    }
  }
}

    stage('4: Security') {
      steps {
        echo 'Scanning for vulnerabilities with Snyk…'
        sh 'npm install -g snyk'
        sh '''
          snyk auth ${SNYK_TOKEN}
          snyk test --json --severity-threshold=high > snyk-report.json
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'snyk-report.json'
        }
        failure {
          echo "Security scan failed. See snyk-report.json for details."
        }
      }
    }

    stage('5: Deploy to Render') {
      steps {
        echo 'Triggering Front-end deployment on Render…'
        sh """
          curl -X POST https://api.render.com/deploy/${RENDER_FRONTEND_ID}/webhook \
            -H 'Authorization: Bearer ${RENDER_API_KEY}' \
            -H 'Accept: application/json'
        """
        echo 'Triggering Back-end deployment on Render…'
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
        echo 'Triggering Front-end production deploy…'
        sh """
          curl -X POST https://api.render.com/deploy/${RENDER_FRONTEND_ID}/webhook \
            -H 'Authorization: Bearer ${RENDER_API_KEY}' \
            -H 'Accept: application/json'
        """
        echo 'Triggering Back-end production deploy…'
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
        echo 'Performing Front-end health check…'
        script {
          def feStatus = sh(returnStatus: true, script: "curl -sSf ${SERVICE_URL_FRONTEND}/health || true")
          if (feStatus != 0) {
            echo "🚨 Front-end health check failed (status=${feStatus})."
          } else {
            echo "✅ Front-end is healthy."
          }
        }

        echo 'Performing Back-end health check…'
        script {
          def beStatus = sh(returnStatus: true, script: "curl -sSf ${SERVICE_URL_BACKEND} || true")
          if (beStatus != 0) {
            error "🚨 Back-end health check failed (status=${beStatus})."
          } else {
            echo "✅ Back-end is healthy."
          }
        }
      }
    }
  }

  post {
    success {
      echo '✅ Pipeline completed successfully.'
    }
    unstable {
      echo '⚠️ Pipeline completed with warnings or test failures.'
    }
    failure {
      echo '❌ Pipeline failed—check console output and artifacts.'
    }
  }
}
