@echo off
title SSH Probe - 192.168.10.11
cd /d "%~dp0"
python -m pip install -q paramiko
python probe.py 192.168.10.11 users.txt passwords.txt
echo.
pause