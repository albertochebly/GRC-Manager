$filePath = "client/src/data/pciDssAssessmentData.ts"
$content = Get-Content -Path $filePath -Raw
$originalContent = $content

Write-Host "Original file size: $($content.Length) characters"

# Count occurrences before replacement
$bulletCount = ($content | Select-String -Pattern "â€¢" -AllMatches).Matches.Count
Write-Host "Found $bulletCount malformed bullet characters"

# Perform the replacement
$content = $content -replace "â€¢", "•"

# Verify the replacement
$bulletCountAfter = ($content | Select-String -Pattern "â€¢" -AllMatches).Matches.Count
$properBulletCount = ($content | Select-String -Pattern "•" -AllMatches).Matches.Count

Write-Host "After replacement:"
Write-Host "  Malformed bullets remaining: $bulletCountAfter"  
Write-Host "  Proper bullets: $properBulletCount"

if ($content -ne $originalContent) {
    Set-Content -Path $filePath -Value $content -Encoding UTF8
    Write-Host "File updated successfully!" -ForegroundColor Green
} else {
    Write-Host "No changes were made." -ForegroundColor Yellow
}