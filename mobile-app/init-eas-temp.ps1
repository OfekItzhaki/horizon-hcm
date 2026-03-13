$process = Start-Process -FilePath "eas" -ArgumentList "init" -NoNewWindow -PassThru -UseNewEnvironment

# Wait for the process to start
Start-Sleep -Seconds 3

# Try to send input via stdin
$process.StandardInput.WriteLine("y")
$process.StandardInput.Flush()
$process.StandardInput.Close()

# Wait for completion
$process.WaitForExit()

exit $process.ExitCode
