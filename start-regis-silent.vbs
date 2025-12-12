Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)

If Not fso.FileExists(scriptPath & "\api\index.py") Then
    MsgBox "Nie znaleziono api/index.py!", vbExclamation, "Regis AI Studio"
    WScript.Quit
End If

WshShell.Run "cmd /c cd /d """ & scriptPath & """ && python api/index.py", 0, False
WScript.Sleep 2000
WshShell.Run "cmd /c cd /d """ & scriptPath & """ && npm run dev", 0, False
WScript.Sleep 3000
WshShell.Run "http://localhost:5173", 1, False

MsgBox "Regis AI Studio uruchomiony!" & vbCrLf & vbCrLf & _
       "Frontend: http://localhost:5173" & vbCrLf & _
       "Backend: http://localhost:8000" & vbCrLf & vbCrLf & _
       "Aby zatrzymac: uruchom stop-regis.bat", _
       vbInformation, "Regis AI Studio"
