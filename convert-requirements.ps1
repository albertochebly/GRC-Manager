# PowerShell script to convert PCI DSS requirements from statements to questions

$filePath = "client\src\data\pciDssAssessmentData.ts"
$content = Get-Content $filePath -Raw

# Read the original file
Write-Host "Converting PCI DSS requirements from statements to questions..."

# Define patterns for different types of conversions
# Conversion patterns for common statement beginnings
$conversions = @{
    # Basic conversions
    '"All ' = '"Are all '
    '"Account data ' = '"Is account data '
    '"Access to ' = '"Is access to '
    '"Authentication ' = '"Is authentication '
    '"Audit logs ' = '"Are audit logs '
    '"Configuration ' = '"Is configuration '
    '"Cryptographic ' = '"Are cryptographic '
    '"Data retention ' = '"Is data retention '
    '"Encryption ' = '"Is encryption '
    '"Network ' = '"Is network '
    '"Password ' = '"Are password '
    '"PAN is ' = '"Is PAN '
    '"Personnel ' = '"Is personnel '
    '"Procedures ' = '"Are procedures '
    '"Processes ' = '"Are processes '
    '"Risk ' = '"Are risk '
    '"Roles and responsibilities for ' = '"Are roles and responsibilities for '
    '"SAD is ' = '"Is SAD '
    '"Security ' = '"Are security '
    '"System ' = '"Are system '
    '"Technical ' = '"Are technical '
    '"The ' = '"Is the '
    '"Vendor ' = '"Are vendor '
    '"Vulnerability ' = '"Are vulnerability '
    '"Wireless ' = '"Is wireless '
    
    # More specific patterns
    '"Multi-factor authentication ' = '"Is multi-factor authentication '
    '"File integrity monitoring ' = '"Is file integrity monitoring '
    '"Incident response ' = '"Is incident response '
    '"Change control ' = '"Is change control '
    '"Application and system ' = '"Are application and system '
    '"Database ' = '"Is database '
    '"Logging ' = '"Is logging '
    '"Monitoring ' = '"Is monitoring '
    '"Testing ' = '"Is testing '
    '"Training ' = '"Is training '
    '"User ' = '"Is user '
    '"Default ' = '"Are default '
    '"Primary functions ' = '"Are primary functions '
    '"Only necessary ' = '"Are only necessary '
    '"Sensitive authentication data ' = '"Is sensitive authentication data '
    '"Anti-malware ' = '"Is anti-malware '
    '"Software development ' = '"Is software development '
    '"Code reviews ' = '"Are code reviews '
    '"Penetration testing ' = '"Is penetration testing '
    '"Segmentation validation ' = '"Is segmentation validation '
    '"Information security ' = '"Is information security '
    '"Third-party service providers ' = '"Are third-party service providers '
}

# Apply conversions
foreach ($pattern in $conversions.Keys) {
    $replacement = $conversions[$pattern]
    $content = $content -replace [regex]::Escape($pattern), $replacement
}

# Handle ending patterns - add question marks where needed
# Look for patterns that end statements and convert them to questions
$content = $content -replace '(\.)("\s*,\s*status:\s*"not-applied")', '?$2'

# Handle special cases for bullet points in descriptions
$content = $content -replace '(\.)( • [^"]*")(\s*,\s*status:\s*"not-applied")', '?$2$3'

# Additional pattern for complex descriptions with bullet points at the end
$content = $content -replace '(description: "[^"]*[^?])("\s*,\s*status:\s*"not-applied")', '$1?$2'

# Save the updated content
Set-Content $filePath $content -NoNewline

Write-Host "Conversion completed!"
Write-Host "Please review the changes and test the application."