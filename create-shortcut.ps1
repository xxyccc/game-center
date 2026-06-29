$desktop = [Environment]::GetFolderPath("Desktop")

# Clean up old shortcut files
$old = Get-ChildItem -Path $desktop -Filter "*Game*" -ErrorAction SilentlyContinue
$old += Get-ChildItem -Path $desktop -Filter "*youxi*" -ErrorAction SilentlyContinue
foreach ($f in $old) {
    Remove-Item $f.FullName -Force
    "Deleted: " + $f.Name
}

# Create new shortcut
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut("$desktop\GameCenter.lnk")
$s.TargetPath = "wscript.exe"
$s.Arguments = "D:\game-center\launch.vbs"
$s.WorkingDirectory = "D:\game-center"
$s.IconLocation = "D:\game-center\shared-assets\images\icon.ico,0"
$s.WindowStyle = 7
$s.Save()

""
"Done! Shortcut [GameCenter] created on Desktop."
"Double-click it to launch the game."
"If security warning pops up, click Open."
