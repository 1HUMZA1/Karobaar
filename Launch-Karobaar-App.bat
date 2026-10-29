@echo off
echo ==============================================
echo  Launching Karobaar Flutter App on Windows...
echo ==============================================
if exist "%~dp0karobaar_app\build\windows\x64\runner\Release\karobaar_app.exe" (
    cd /d "%~dp0karobaar_app\build\windows\x64\runner\Release"
    start "" "karobaar_app.exe"
) else (
    echo Building Karobaar app first...
    cd /d "%~dp0karobaar_app"
    flutter run -d windows
)
