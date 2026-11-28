@echo off
title SSH Probe - 192.168.10.11
cd /d "%~dp0"
echo [*] Instalando dependencias necesarias...
python -m pip install -q paramiko bcrypt
echo [*] Iniciando script...
python probe.py 192.168.10.11 users.txt passwords.txt
echo.
pause