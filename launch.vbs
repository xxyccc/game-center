Set ws = CreateObject("WScript.Shell")
ws.CurrentDirectory = "D:\game-center"
ws.Run "npm start", 0, False
