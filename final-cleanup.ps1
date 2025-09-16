# Final cleanup script for remaining statements
$FilePath = "client/src/data/pciDssAssessmentData.ts"
$content = Get-Content $FilePath -Raw

Write-Host "Running final cleanup..." -ForegroundColor Yellow

# Handle remaining patterns that weren't caught
$content = $content -replace 'description: "([^"]+) capture ([^"]+)\."', 'description: "Do $1 capture $2?"'
$content = $content -replace 'description: "([^"]+) record ([^"]+)\."', 'description: "Do $1 record $2?"'
$content = $content -replace 'description: "([^"]+) detect ([^"]+)\."', 'description: "Do $1 detect $2?"'
$content = $content -replace 'description: "([^"]+) protect ([^"]+)\."', 'description: "Do $1 protect $2?"'
$content = $content -replace 'description: "([^"]+) support ([^"]+)\."', 'description: "Do $1 support $2?"'
$content = $content -replace 'description: "([^"]+) manage ([^"]+)\."', 'description: "Do $1 manage $2?"'
$content = $content -replace 'description: "([^"]+) use ([^"]+)\."', 'description: "Do $1 use $2?"'
$content = $content -replace 'description: "([^"]+) cannot ([^"]+)\."', 'description: "Can $1 not $2?"'
$content = $content -replace 'description: "Retain ([^"]+)\."', 'description: "Is $1 retained?"'

# Handle time-related statements
$content = $content -replace 'description: "Time-synchronization ([^"]+)\."', 'description: "Do time-synchronization $1?"'

# Handle "Additional requirement" statements
$content = $content -replace 'description: "Additional requirement for ([^"]+): ([^"]+)\."', 'description: "For $1: Do $2?"'

# Handle policy statements
$content = $content -replace 'description: "An overall ([^"]+) is: ([^"]+)\."', 'description: "Is an overall $1 $2?"'

# Save the file
Set-Content -Path $FilePath -Value $content -Encoding UTF8

Write-Host "Final cleanup completed!" -ForegroundColor Green