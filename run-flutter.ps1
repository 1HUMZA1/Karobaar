Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Launching Karobaar Flutter App on Windows..." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\karobaar_app"
flutter run -d windows
