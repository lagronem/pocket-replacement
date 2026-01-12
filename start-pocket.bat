@echo off
echo Starting Pocket Replacement...
cd /d "%~dp0"
start http://localhost:3000
npm start
