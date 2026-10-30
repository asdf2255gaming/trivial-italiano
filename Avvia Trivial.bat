@echo off
title Trivial Italiano
set "ROOT=%~dp0"

rem Node.js portatile: una cartella "node..." accanto a questo file che contiene node.exe
rem (es. "node" oppure "node-v26.13.0-win-x64", estratta dallo .zip di nodejs.org).
rem Se c'e', ha la precedenza su quello installato nel PC.
set "NODEDIR="
for /d %%D in ("%ROOT%node*") do if exist "%%D\node.exe" set "NODEDIR=%%D"
if defined NODEDIR set "PATH=%NODEDIR%;%PATH%"

cd /d "%ROOT%frontend"

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js non trovato.
    echo Estrai lo .zip di Node.js ^(Windows 64 bit^) in una cartella "node" accanto a questo file,
    echo oppure installalo da https://nodejs.org
    pause
    exit /b 1
)
for /f "delims=" %%V in ('node -v') do echo Node.js %%V

if not exist "node_modules\.bin\craco.cmd" (
    echo Installo le dipendenze, serve internet e ci vuole qualche minuto...
    call npx --yes yarn@1.22.22 install
)

echo Avvio Trivial Italiano su http://localhost:3000
echo Per chiudere, chiudi questa finestra o premi Ctrl+C.
call "node_modules\.bin\craco.cmd" start
pause
