# Simplified PowerShell script for rapid conversion
$FilePath = "client/src/data/pciDssAssessmentData.ts"
$content = Get-Content $FilePath -Raw

# Simple pattern replacements - focus on speed over perfection
Write-Host "Starting rapid conversion..." -ForegroundColor Yellow

# Pattern 1: "All X are Y" -> "Are all X Y?"
$content = $content -replace 'description: "All ([^"]+) are ([^"]+)\."', 'description: "Are all $1 $2?"'

# Pattern 2: "The X is Y" -> "Is the X Y?"
$content = $content -replace 'description: "The ([^"]+) is ([^"]+)\."', 'description: "Is the $1 $2?"'

# Pattern 3: "X is Y" -> "Is X Y?"
$content = $content -replace 'description: "([A-Z][^"]+) is ([^"]+)\."', 'description: "Is $1 $2?"'

# Pattern 4: "X are Y" -> "Are X Y?"  
$content = $content -replace 'description: "([A-Z][^"]+) are ([^"]+)\."', 'description: "Are $1 $2?"'

# Pattern 5: "X must Y" -> "Must X Y?"
$content = $content -replace 'description: "([^"]+) must ([^"]+)\."', 'description: "Must $1 $2?"'

# Pattern 6: "X will Y" -> "Will X Y?"
$content = $content -replace 'description: "([^"]+) will ([^"]+)\."', 'description: "Will $1 $2?"'

# Pattern 7: "X can Y" -> "Can X Y?"
$content = $content -replace 'description: "([^"]+) can ([^"]+)\."', 'description: "Can $1 $2?"'

# Pattern 8: "X have Y" -> "Do X have Y?"
$content = $content -replace 'description: "([^"]+) have ([^"]+)\."', 'description: "Do $1 have $2?"'

# Pattern 9: "X include Y" -> "Do X include Y?"
$content = $content -replace 'description: "([^"]+) include ([^"]+)\."', 'description: "Do $1 include $2?"'

# Pattern 10: "X contain Y" -> "Do X contain Y?"
$content = $content -replace 'description: "([^"]+) contain ([^"]+)\."', 'description: "Do $1 contain $2?"'

# Save the file
Set-Content -Path $FilePath -Value $content -Encoding UTF8

Write-Host "Rapid conversion completed!" -ForegroundColor Green
Write-Host "Processed common statement patterns and converted them to questions." -ForegroundColor Green