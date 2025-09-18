pipeline {
  agent any

  tools {
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
    NODE_CACHE           = "${WORKSPACE}@tmp/node_cache"
    MAVEN_CACHE          = "${WORKSPACE}@tmp/maven_cache"
  }

  stages {

    stage('1: Build') {
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
            echo '→ Building Front-end...'
              dir('client') {
                if (fileExists("${NODE_CACHE}/package-lock.json") &&
                    bat(returnStdout: true, script: """
                      fc /B package-lock.json "${NODE_CACHE}\\package-lock.json" >nul
                      if errorlevel 1 (echo DIFF) else (echo SAME)
                    """).trim() == "SAME") {
                  echo '↷ Restoring cached node_modules...'
                  bat "xcopy /E /I /Y \"${NODE_CACHE}\\node_modules\" node_modules"
                } else {
                  bat 'npm ci'
                  bat "xcopy /E /I /Y node_modules \"${NODE_CACHE}\\node_modules\""
                  bat "copy package-lock.json \"${NODE_CACHE}\\package-lock.json\""
                }
                bat 'npm run build'
              }

            if (fileExists('server/package.json')) {
              echo '→ Installing Node.js Back-end dependencies...'
              dir('server') {
                bat 'npm ci'
              }
            } else {
              echo '↷ Skipping Node.js Back-end (server/package.json not found)'
            }

            if (fileExists('server/pom.xml')) {
              echo '→ Building Back-end...'
              bat "if exist \"${MAVEN_CACHE}\" xcopy /E /I /Y \"${MAVEN_CACHE}\" %USERPROFILE%\\.m2\\repository"
              bat 'mvn -f server\\pom.xml clean package'
              bat "xcopy /E /I /Y %USERPROFILE%\\.m2\\repository \"${MAVEN_CACHE}\""
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
          catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
            if (fileExists('client/package.json')) {
              echo '→ Testing Front-end...'
              dir('client') {
                if (!fileExists('node_modules')) {
                  echo '↷ node_modules missing — Installing dependencies...'
                  bat 'npm ci'
                } else {
                  echo '↷ Using existing node_modules from Stage 1'
                }
                bat 'npm run test:ci'
              }
            }
            } else {
              echo '↷ Skipping Front-end tests (client/package.json not found)'
            }

            if (fileExists('server/pom.xml')) {
              echo '→ Testing Back-end...'
              bat 'mvn -f server\\pom.xml test'
            } else {
              echo '↷ Skipping Back-end tests (server/pom.xml not found)'
            }
          }
        }
      }
      post {
        always {
          script {
            if (fileExists('client/junit.xml')) {
              junit 'client/junit.xml'
            } else {
              echo '↷ No JUnit XML found for frontend tests'
            }

            if (fileExists('server/target/surefire-reports')) {
              junit 'server/target/surefire-reports/*.xml'
            } else {
              echo '↷ No JUnit XML found for backend tests'
            }
          }
        }
      }
    }

    stage('3: Code Quality') {
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
            echo '→ Running SonarCloud analysis...'
            withSonarQubeEnv("${SONARQUBE_SERVER_ID}") {
              bat '''
                if not exist sonar-scanner-5.0.1.3006-windows (
                  echo Downloading SonarScanner CLI...
                  curl -L https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-windows.zip -o sonar-scanner.zip
                  powershell -Command "Expand-Archive sonar-scanner.zip -DestinationPath . -Force"
                )
              '''
              bat '''
                sonar-scanner-5.0.1.3006-windows\\bin\\sonar-scanner ^
                  -Dsonar.host.url=%SONAR_HOST_URL% ^
                  -Dsonar.login=%SONAR_AUTH_TOKEN%
              '''
            }
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
            bat 'docker compose -f docker-compose.yml down || exit 0'
            bat 'docker compose -f docker-compose.yml up -d --build'
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
                for /f "delims=" %%i in ('curl -s -H "Authorization: Token token=%BU_TOKEN%" "https://api.betteruptime.com/v2/incidents?filter[status]=open&filter[monitor_url]=%URL%"') do set RESPONSE=%%i
                echo %RESPONSE% > response.json
                for /f %%c in ('type response.json ^| jq.exe ".data | length"') do set COUNT=%%c
                if %COUNT% GTR 0 (
                  echo Better Uptime reports %COUNT% open incident(s)
                  exit /b 1
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
