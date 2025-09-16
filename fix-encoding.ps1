# Script to fix character encoding issues in PCI DSS data
$FilePath = "client/src/data/pciDssAssessmentData.ts"

Write-Host "Fixing character encoding issues..." -ForegroundColor Yellow

# Read the file content
$content = Get-Content $FilePath -Raw -Encoding UTF8

# Replace the malformed bullet character with proper bullet
$content = $content -replace 'â€¢', '•'

# Also fix other common encoding issues if they exist
$content = $content -replace 'â€™', "'"  # Right single quotation mark
$content = $content -replace 'â€œ', '"'  # Left double quotation mark  
$content = $content -replace 'â€', '"'   # Right double quotation mark
$content = $content -replace 'â€"', '–'  # En dash
$content = $content -replace 'â€"', '—'  # Em dash

# Write the content back with proper UTF-8 encoding
$utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
[System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBomEncoding)

Write-Host "Character encoding issues fixed!" -ForegroundColor Green
Write-Host "Replaced malformed characters with proper Unicode equivalents."