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
          catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
            echo '→ Building Front-end...'
            dir('client') {
              bat 'npm ci'
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
          catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
            echo '→ Starting Back-end locally...'
            if (fileExists('server/pom.xml')) {
              dir('server') {
                bat 'mvn -q -DskipTests package'
                bat '''
@echo off
set PORT=8085
start "" /min java -jar target\\server-1.0.0.jar > backend.log 2>&1
'''
              }

              bat '''
@echo off
set RETRIES=100
for /L %%i in (1,1,%RETRIES%) do (
  curl -s -o nul -w "%%{http_code}" http://127.0.0.1:8085/api/ping | findstr 200 >nul
  if not errorlevel 1 (
    echo Backend is up on attempt %%i!
    goto AFTER_BACKEND
  )
  echo Waiting for backend... (%%i/%RETRIES%)
  timeout /t 1 >nul
)
echo ERROR: Backend did not start within %RETRIES% seconds.
exit /b 1
:AFTER_BACKEND
echo Proceeding with backend tests.
'''
            } else {
              echo '↷ server/pom.xml not found, skipping local backend start'
            }

            echo '→ Starting Front-end locally on :3500...'
            if (fileExists('client/package.json')) {
              dir('client') {
                bat 'npm ci'
                bat '''
@echo off
set PORT=3500
start "" /min cmd /c "npm start > frontend.log 2>&1"
'''
              }

              bat '''
@echo off
set RETRIES=120
for /L %%i in (1,1,%RETRIES%) do (
  curl -s http://127.0.0.1:3500 | findstr "<title>To-Do App</title>" >nul
  if not errorlevel 1 (
    curl -s http://127.0.0.1:3500/static/js/bundle.js | findstr "React" >nul
    if not errorlevel 1 (
      echo Frontend fully ready on attempt %%i!
      goto AFTER_FRONTEND
    )
  )
  echo Waiting for frontend... (%%i/%RETRIES%)
  timeout /t 1 >nul
)
echo ERROR: Frontend did not start within %RETRIES% seconds.
exit /b 1
:AFTER_FRONTEND
echo Proceeding with frontend tests.
'''

              echo '→ Running Playwright E2E against http://127.0.0.1:3500...'
              dir('client') {
                echo '→ Installing Playwright browsers (first run may take a few minutes)...'
                bat 'set PLAYWRIGHT_BROWSERS_PATH=C:\\playwright-browsers && npx playwright install --with-deps'
                echo '✔ Playwright browsers installed.'

                bat 'set SERVICE_URL_FRONTEND=http://127.0.0.1:3500 && npx playwright test --project=chromium --reporter=list --trace on'
                echo '✔ Playwright test completed — proceeding to cleanup...'
              }
            } else {
              echo '↷ client/ not found, skipping front-end tests'
            }

            echo '→ Running Back-end unit tests...'
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
            junit allowEmptyResults: true, testResults: 'client/playwright-report/*.xml'
            junit allowEmptyResults: true, testResults: 'server/target/surefire-reports/*.xml'

            echo '→ Killing node.exe...'
            bat 'taskkill /IM node.exe /F || echo node not running'
            echo '→ node.exe kill attempted.'

            echo '→ Killing java.exe...'
            bat 'taskkill /IM java.exe /F || echo java not running'
            echo '→ java.exe kill attempted.'
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
                -Dsonar.token=%SONAR_TOKEN%
            """
          }
        }
      }
    }

    stage('4: Security') {
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
            echo '→ Downloading Snyk CLI...'
            bat '''
              if not exist snyk.exe (
                powershell -Command "Invoke-WebRequest -Uri https://downloads.snyk.io/cli/stable/snyk-win.exe -OutFile snyk.exe"
              )
            '''

            echo '→ Authenticating Snyk...'
            bat '.\\snyk.exe auth %SNYK_TOKEN%'

            echo '→ Scanning Front-end with Snyk...'
            bat '.\\snyk.exe test client --severity-threshold=high --json > snyk-frontend.json'

            echo '→ Scanning Back-end with Snyk...'
            bat '.\\snyk.exe test server --severity-threshold=high --json > snyk-backend.json'

            echo '→ Parsing Snyk Front-end results...'
            bat '''
            powershell -Command ^
              "$data = Get-Content snyk-frontend.json | ConvertFrom-Json; ^
               if ($data.vulnerabilities) { ^
                 Write-Output '=== Front-end Vulnerabilities Found ==='; ^
                 foreach ($v in $data.vulnerabilities) { ^
                   Write-Output ('- ' + $v.severity.ToUpper() + ' | ' + $v.title + ' in ' + $v.packageName + '@' + $v.version) ^
                 } ^
               } else { Write-Output 'No front-end vulnerabilities found.' }"
            '''

            echo '→ Parsing Snyk Back-end results...'
            bat '''
            powershell -Command ^
              "$data = Get-Content snyk-backend.json | ConvertFrom-Json; ^
               if ($data.vulnerabilities) { ^
                 Write-Output '=== Back-end Vulnerabilities Found ==='; ^
                 foreach ($v in $data.vulnerabilities) { ^
                   Write-Output ('- ' + $v.severity.ToUpper() + ' | ' + $v.title + ' in ' + $v.packageName + '@' + $v.version) ^
                 } ^
               } else { Write-Output 'No back-end vulnerabilities found.' }"
            '''
          }
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'snyk-frontend.json,snyk-backend.json'
        }
        unstable {
          echo 'One or more Snyk scans found vulnerabilities. See console log for summary and JSON reports for details.'
        }
        success {
          echo 'No vulnerabilities found. All Snyk scans passed cleanly.'
        }
      }
    }

    stage('5: Deploy to Staging') {
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
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
              echo "⚠️ No docker-compose file found in workspace."
              return
            }

            echo "✅ Using docker compose file: ${composeFile}"

            echo "→ Pulling base images..."
            bat 'docker pull maven:3.9.6-eclipse-temurin-17 || exit 0'
            bat 'docker pull node:20-alpine || exit 0'
            bat 'docker pull eclipse-temurin:17-jre || exit 0'

            bat "docker compose -f \"${composeFile}\" down || exit 0"
            bat "docker compose -f \"${composeFile}\" up -d --build || exit 0"
          }
        }
      }
    }

    stage('6: Release to Production') {
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
            echo '→ Front-end production deploy to Render...'

            bat """
              curl -k -f -X POST "https://api.render.com/deploy/srv-d31s9v2dbo4c739tapn0?key=zCYbhkStpjE" ^
                -H "Accept: application/json"
            """

            bat '''
            powershell -Command "
              try {
                $headers = @{ Accept = 'application/json' }
                $uri = 'https://api.render.com/deploy/srv-d31s9v2dbo4c739tapn0?key=zCYbhkStpjE'
                $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers
                Write-Output 'PowerShell Deploy ID (Front-end): ' + $response.deploy.id
              } catch {
                Write-Output 'PowerShell Front-end deploy failed: ' + $_.Exception.Message
              }
            "
            '''

            echo '→ Back-end production deploy to Render...'

            bat """
              curl -k -f -X POST "https://api.render.com/deploy/srv-d31s2kjipnbc73cko4cg?key=UvvpivLS7LI" ^
                -H "Accept: application/json"
            """

            bat '''
            powershell -Command "
              try {
                $headers = @{ Accept = 'application/json' }
                $uri = 'https://api.render.com/deploy/srv-d31s2kjipnbc73cko4cg?key=UvvpivLS7LI'
                $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers
                Write-Output 'PowerShell Deploy ID (Back-end): ' + $response.deploy.id
              } catch {
                Write-Output 'PowerShell Back-end deploy failed: ' + $_.Exception.Message
              }
            "
            '''
          }
        }
      }
      post {
        success {
          script {
            currentBuild.displayName = "prod-${env.BUILD_NUMBER}"
          }
        }
      }
    }

  stage('7: Monitoring') {
    steps {
      script {
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          withCredentials([string(credentialsId: 'better-uptime-token', variable: 'BU_TOKEN')]) {
            powershell '''
              $ErrorActionPreference = "Stop"

              $url = "https://todo-app-4g2e.onrender.com"
              $headers = @{ "Authorization" = "Token token=$env:BU_TOKEN" }

              Write-Host "→ Checking Better Uptime for open incidents on $url ..."

              try {
                # Call Better Uptime API
                $response = Invoke-RestMethod -Uri "https://api.betteruptime.com/api/v2/incidents?filter[status]=open&filter[monitor_url]=$url" -Headers $headers

                # Count open incidents
                $count = $response.data.Count

                if ($count -gt 0) {
                  Write-Host "❌ Better Uptime reports $count open incident(s)"
                  foreach ($incident in $response.data) {
                    Write-Host " - [$($incident.id)] $($incident.attributes.summary)"
                  }
                  exit 1
                } else {
                  Write-Host "✅ No open incidents reported by Better Uptime"
                }
              }
              catch {
                Write-Host "⚠️ Monitoring check failed: $($_.Exception.Message)"
                exit 1
              }
            '''
          }
        }
      }
    }
    post {
      unsuccessful {
        echo "⚠️ Monitoring warning/failure: Open incidents in Better Uptime."
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
