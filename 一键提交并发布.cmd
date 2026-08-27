@echo off
setlocal
cd /d "%~dp0"

echo TestStudy - GitHub sync and Sites publish
set /p PUBLISH_MESSAGE=Describe this update and press Enter: 
if "%PUBLISH_MESSAGE%"=="" set "PUBLISH_MESSAGE=Update learning platform content"

call npm run publish:site -- "%PUBLISH_MESSAGE%"
set PUBLISH_STATUS=%ERRORLEVEL%

if %PUBLISH_STATUS% EQU 0 (
  echo Completed. Press any key to close.
) else (
  echo Publish stopped. The reason is shown above. Press any key to close.
)
pause >nul
exit /b %PUBLISH_STATUS%
