# Script to initialize EAS project
# This will create a new EAS project for the mobile app

$process = Start-Process -FilePath "eas" -ArgumentList "init" -NoNewWindow -PassThru -RedirectStandardInput $null

# Wait a bit for the prompt
Start-Sleep -Seconds 2

# Send 'y' to create the project
$process.StandardInput.WriteLine("y")
$process.StandardInput.Flush()

# Wait for completion
$process.WaitForExit()

Write-Host "EAS project initialized"
