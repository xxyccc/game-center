# Find the exe in dist (avoid Chinese filename encoding issues)
$exe = Get-ChildItem -Path "D:\game-center\dist\win-unpacked" -Filter "*.exe" | Select-Object -First 1

if (-not $exe) {
    Write-Host "ERROR: No exe found in dist\win-unpacked"
    exit 1
}

Write-Host "Found: $($exe.Name)"

# Rename to ASCII-safe name
$newName = "D:\game-center\dist\win-unpacked\GameCenter.exe"
if ($exe.FullName -ne $newName) {
    Rename-Item -Path $exe.FullName -NewName "GameCenter.exe" -Force
    Write-Host "Renamed to: GameCenter.exe"
}

$desktop = [Environment]::GetFolderPath("Desktop")

# Delete old shortcuts
Get-ChildItem $desktop -Filter "*Game*" | Remove-Item -Force
Get-ChildItem $desktop -Filter "*game*" | Remove-Item -Force

# Create desktop shortcut
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut("$desktop\GameCenter.lnk")
$s.TargetPath = $newName
$s.WorkingDirectory = "D:\game-center\dist\win-unpacked"
$s.IconLocation = "D:\game-center\shared-assets\images\icon.ico,0"
$s.Save()
Write-Host "Desktop shortcut created."

# Create zip
$zipDest = "D:\game-center\GameCenter-v1.0.zip"
if (Test-Path $zipDest) { Remove-Item $zipDest -Force }

Write-Host "Creating zip (this may take a minute)..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    "D:\game-center\dist\win-unpacked",
    $zipDest,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
)

$zipMB = [math]::Round((Get-Item $zipDest).Length / 1MB, 1)
Write-Host ""
Write-Host "======== DONE ========"
Write-Host "Desktop: GameCenter.lnk (double-click to play)"
Write-Host "Share:   GameCenter-v1.0.zip ($zipMB MB)"
Write-Host ""
Write-Host "Send the zip to friends!"
Write-Host "They unzip and double-click GameCenter.exe to play."
