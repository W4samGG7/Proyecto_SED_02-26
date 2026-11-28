#!/usr/bin/env bash
# Lanzador para Linux/Mac
cd "$(dirname "$0")"

echo "[*] Verificando e instalando dependencias..."
# Instala paramiko y bcrypt si faltan
python3 -m pip install -q paramiko bcrypt

echo "[*] Iniciando prueba contra 192.168.10.11..."
python3 probe-linux.py 192.168.10.11 users.txt passwords.txt