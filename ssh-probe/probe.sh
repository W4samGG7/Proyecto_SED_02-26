#!/usr/bin/env bash
# Lanzador para Linux/Mac
cd "$(dirname "$0")"

echo "[*] Verificando dependencias..."
# Instala paramiko si falta
python3 -c "import paramiko" 2>/dev/null || python3 -m pip install -q paramiko

echo "[*] Iniciando prueba contra 192.168.10.11..."
# Ejecuta el script con el nuevo nombre y le pasa la IP y los txt
python3 probe-linux.py 192.168.10.11 users.txt passwords.txt