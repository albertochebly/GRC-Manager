# PowerShell script to convert PCI DSS requirements to questions (Requirements 3-12)
param(
    [string]$FilePath = "client/src/data/pciDssAssessmentData.ts"
)

# Read the file
$content = Get-Content $FilePath -Raw

# Define patterns that need to be converted to questions
# More sophisticated patterns to handle different statement structures

$patterns = @{
    # Pattern 1: Simple statements starting with specific words
    '(\s+description:\s+")([A-Z][^"]*\.)("\s*,)' = {
        $match = $args[0]
        $prefix = $match.Groups[1].Value
        $statement = $match.Groups[2].Value
        $suffix = $match.Groups[3].Value
        
        # Skip if it's already a question or header
        if ($statement.Contains('?') -or $statement.Contains('isHeader: true')) {
            return $match.Value
        }
        
        # Convert common statement patterns to questions
        $question = $statement
        
        # Handle different statement beginnings
        if ($statement -match '^([A-Z][a-z]+ [a-z]+) (are|is) (.+)\.$') {
            $question = "Are $($matches[1].ToLower()) $($matches[3])?"
        }
        elseif ($statement -match '^([A-Z][^.]+) (are|is) (.+)\.$') {
            $question = "Are $($matches[1].ToLower()) $($matches[3])?"
        }
        elseif ($statement -match '^(All |Any |The |A |An )(.+)\.$') {
            $question = "Is $($matches[2].ToLower())?"
        }
        elseif ($statement -match '^([A-Z][^.]+) must (.+)\.$') {
            $question = "Must $($matches[1].ToLower()) $($matches[2])?"
        }
        elseif ($statement -match '^([A-Z][^.]+) will (.+)\.$') {
            $question = "Will $($matches[1].ToLower()) $($matches[2])?"
        }
        elseif ($statement -match '^([A-Z][^.]+) can (.+)\.$') {
            $question = "Can $($matches[1].ToLower()) $($matches[2])?"
        }
        elseif ($statement -match '^([A-Z][^.]+) should (.+)\.$') {
            $question = "Should $($matches[1].ToLower()) $($matches[2])?"
        }
        elseif ($statement -match '^([A-Z][^.]+) have (.+)\.$') {
            $question = "Do $($matches[1].ToLower()) have $($matches[2])?"
        }
        elseif ($statement -match '^([A-Z][^.]+) include (.+)\.$') {
            $question = "Do $($matches[1].ToLower()) include $($matches[2])?"
        }
        else {
            # Generic conversion - add "Is" or "Are" based on context
            $lowerStatement = $statement.ToLower()
            if ($lowerStatement -match '\bare\b' -or $lowerStatement -match 'multiple|all |systems|processes|controls|policies') {
                $question = "Are " + $statement.Substring(0, 1).ToLower() + $statement.Substring(1)
                $question = $question.TrimEnd('.') + "?"
            } else {
                $question = "Is " + $statement.Substring(0, 1).ToLower() + $statement.Substring(1)
                $question = $question.TrimEnd('.') + "?"
            }
        }
        
        return $prefix + $question + $suffix
    }
}

# Apply the patterns
foreach ($pattern in $patterns.Keys) {
    $content = [regex]::Replace($content, $pattern, $patterns[$pattern])
}

# Write the modified content back to the file
Set-Content -Path $FilePath -Value $content -Encoding UTF8

Write-Host "Conversion completed for remaining requirements!" -ForegroundColor Green
Write-Host "Please review the file for any conversion issues."