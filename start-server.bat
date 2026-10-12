@echo off
setlocal
title NetTopo Server
cd /d "%~dp0"
if not exist "dist\index.html" (
  echo NetTopo frontend belum di-build.
  echo Jalankan: npm.cmd run build
  pause
  exit /b 1
)
node server.js
