param (
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Version
)

if ($Version -notmatch "^v\d+\.\d+\.\d+") {
    Write-Host "Error: Version must start with 'v' and follow semantic versioning (e.g. v1.1.0)" -ForegroundColor Red
    exit 1
}

Write-Host "Preparing Release $Version..." -ForegroundColor Cyan

# Remove 'v' prefix for npm version command
$NpmVersion = $Version.Substring(1)
npm version $NpmVersion --no-git-tag-version

Write-Host "Committing version bump..." -ForegroundColor Cyan
git add package.json package-lock.json
git commit -m "Bump version to $Version"

Write-Host "Creating Git tag..." -ForegroundColor Cyan
git tag -a $Version -m "Release $Version"

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main
git push origin $Version

Write-Host ""
Write-Host "? Successfully pushed $Version to GitHub!" -ForegroundColor Green
Write-Host "GitHub Actions will now automatically:" -ForegroundColor Cyan
Write-Host "1. Build Karobaar-Windows-$Version.exe"
Write-Host "2. Build Karobaar-Android-$Version.apk"
Write-Host "3. Build Karobaar-Android-$Version.aab"
Write-Host "4. Create the GitHub Release and upload all files."
Write-Host "You can watch the progress in the 'Actions' tab on your GitHub repository." -ForegroundColor Yellow
