REM filepath: e:\bot_dcCastilla\start_bot_invisible.vbs
CreateObject("Wscript.Shell").Run "cmd /c cd /d ""e:\bot_dcCastilla"" && node index.js > nul 2>&1", 0, False