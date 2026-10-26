@echo off
chcp 65001 > nul

rem Ensure install.ps1 has UTF-8 BOM (fixes Korean encoding on PowerShell 5.1 / CP949 systems)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$f='%~dp0install.ps1'; $c=[IO.File]::ReadAllText($f,[Text.Encoding]::UTF8); $b=New-Object Text.UTF8Encoding $true; [IO.File]::WriteAllText($f,$c,$b)"

rem Run the project-local VS Code Continue rules installer
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
