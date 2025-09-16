# Simple script to fix bullet point encoding
$FilePath = "client/src/data/pciDssAssessmentData.ts"

Write-Host "Fixing bullet point encoding..." -ForegroundColor Yellow

# Read the file content
$content = Get-Content $FilePath -Raw -Encoding UTF8

# Replace the malformed bullet character with proper bullet
# The malformed character shows as â€¢ 
$content = $content.Replace('â€¢', '•')

# Write the content back with proper UTF-8 encoding
[System.IO.File]::WriteAllText($FilePath, $content, [System.Text.Encoding]::UTF8)

Write-Host "Bullet point encoding fixed!" -ForegroundColor Green