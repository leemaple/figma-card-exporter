@echo off
echo 正在启动Figma卡片导出器服务器...

cd /d %~dp0

taskkill /F /IM node.exe 2>nul

echo 等待3秒...
ping 127.0.0.1 -n 4 > nul

echo 启动服务器...
F:\LiFeng\Software\nodejs\node.exe debug-server.js
