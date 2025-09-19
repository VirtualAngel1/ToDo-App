pipeline {
  agent any

  tools {
    git 'Git'
    maven 'Maven_3.9.6'
  }

  environment {
    SONARQUBE_SERVER_ID  = 'SonarCloud'
    SNYK_TOKEN           = credentials('snyk-token')
    RENDER_API_KEY       = credentials('render-key')
    RENDER_FRONTEND_ID   = 'srv-d31s9v2dbo4c739tapn0'
    RENDER_BACKEND_ID    = 'srv-d31s2kjipnbc73cko4cg'
    SERVICE_URL_FRONTEND = 'https://todo-app-4g2e.onrender.com'
    SERVICE_URL_BACKEND  = 'https://to-do-app-raw1.onrender.com'
  }

  stages {

    stage('1: Build') {
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {

            echo '→ Building Front-end...'
            dir('client') {
              bat 'dir /b /s jest.config.js'
              bat 'npm run test:ci --verbose' 
              bat 'npm ci'
              stash name: 'client_node_modules', includes: 'node_modules/**'
              bat 'npm run build'
            }

            if (fileExists('server/package.json')) {
              echo '→ Installing Node.js Back-end dependencies...'
              dir('server') {
                bat 'npm ci'
                stash name: 'server_node_modules', includes: 'node_modules/**'
              }
            } else {
              echo '↷ Skipping Node.js Back-end (server/package.json not found)'
            }

            if (fileExists('server/pom.xml')) {
              echo '→ Building Back-end...'
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
      }
      post {
        always {
          script {
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
      catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
        if (fileExists('client/package.json')) {
          echo '→ Testing Front-end...'
          dir('client') {
          bat 'rmdir /s /q .jest-cache || echo No cache to delete'
          bat 'set CI=true && npm run test:ci'
          }
        } else {
          echo '↷ client/ not found, skipping front-end tests'
        }

        echo '→ Testing Back-end...'
        if (fileExists('server/pom.xml')) {
          bat 'mvn -f server\\pom.xml test'
        } else {
          echo '↷ server/pom.xml not found, skipping back-end tests'
        }
      }
    }
  }
  post {
    always {
      script {
        if (fileExists('client/junit.xml')) {
          junit allowEmptyResults: true, testResults: 'client/junit.xml'
        } else {
          echo '↷ No Front-end JUnit report found at client/junit.xml'
        }
        junit allowEmptyResults: true, testResults: 'server/target/surefire-reports/*.xml'
      }
    }
  }
}


stage('3: Code Quality') {
  steps {
    withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
      script {
        def scannerHome = tool name: 'SonarScanner_5.0.1', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
        bat """
          "${scannerHome}\\bin\\sonar-scanner.bat" ^
            -Dsonar.organization=virtualangel ^
            -Dsonar.projectKey=VirtualAngel1_ToDo-App ^
            -Dsonar.host.url=https://sonarcloud.io ^
            -Dsonar.login=%SONAR_TOKEN%
        """
      }
    }
  }
}

    stage('4: Security') {
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
            echo '→ Downloading Snyk CLI...'
            bat '''
              if not exist snyk.exe (
                powershell -Command "Invoke-WebRequest -Uri https://downloads.snyk.io/cli/stable/snyk-win.exe -OutFile snyk.exe"
              )
            '''
            echo '→ Scanning Front-end with Snyk...'
            bat '.\\snyk.exe auth %SNYK_TOKEN%'
            bat '.\\snyk.exe test client --severity-threshold=high --json > snyk-frontend.json'
            echo '→ Scanning Back-end with Snyk...'
            bat '.\\snyk.exe test server --severity-threshold=high --json > snyk-backend.json'
          }
        }
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
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
            echo '→ Deploying to local staging environment with Docker Compose...'
            echo "Workspace: ${env.WORKSPACE}"

            bat '''
              echo --- Workspace root listing ---
              dir /b
              echo ------------------------------
            '''

            def composeFile = bat(
              returnStdout: true,
              label: 'Resolve compose file',
              script: '''
                @echo off
                setlocal enabledelayedexpansion
                set FOUND=

                rem Check root
                for %%F in (docker-compose.yml docker-compose.yaml) do (
                  if exist "%%F" set FOUND=%%F
                )

                rem Check common subfolders
                if not defined FOUND (
                  for %%P in (docker deploy compose) do (
                    for %%E in (yml yaml) do (
                      if exist "%%P\\docker-compose.%%E" set FOUND=%%P\\docker-compose.%%E
                      if exist "%%P\\compose.%%E" set FOUND=%%P\\compose.%%E
                    )
                  )
                )

                if not defined FOUND (
                  echo NONE
                ) else (
                  echo !FOUND!
                )
              '''
            ).trim()

            if (composeFile == 'NONE' || !fileExists(composeFile)) {
              error "❌ No docker-compose file found in workspace."
            }

            echo "✅ Using docker compose file: ${composeFile}"

            bat "docker compose -f \"${composeFile}\" down || exit 0"
            bat "docker compose -f \"${composeFile}\" up -d --build"
            bat 'ping -n 6 127.0.0.1 > nul && curl -f http://localhost:3000/health'
          }
        }
      }
    }
        stage('6: Release to Production') {
      when { branch 'main' }
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
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
        }
      }
      post {
        success {
          script { currentBuild.displayName = "prod-${env.BUILD_NUMBER}" }
        }
      }
    }

    stage('7: Monitoring') {
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
            bat '''
              if not exist jq.exe (
                echo Downloading jq.exe...
                powershell -Command "Invoke-WebRequest -Uri https://github.com/stedolan/jq/releases/latest/download/jq-win64.exe -OutFile jq.exe"
              )
            '''
            withCredentials([string(credentialsId: 'better-uptime-token', variable: 'BU_TOKEN')]) {
              bat """
                set URL=https://to-do-app-raw1.onrender.com
                curl -s -H "Authorization: Token token=%BU_TOKEN%" ^
                     "https://api.betteruptime.com/api/v2/incidents?filter[status]=open&filter[monitor_url]=%URL%" ^
                     > response.json
                for /f %%c in ('jq.exe ".data | length" response.json') do set COUNT=%%c
                if %COUNT% GTR 0 (
                  echo Better Uptime reports %COUNT% open incident(s)
                  exit /b 1
                ) else (
                  echo ✅ No open incidents reported by Better Uptime
                )
              """
            }
          }
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
