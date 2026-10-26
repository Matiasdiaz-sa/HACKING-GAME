const crypto = require('crypto');
const VirtualMachine = require('./virtualMachine');

class GameRoom {
  constructor(roomId, player1) {
    this.roomId = roomId;
    this.status = 'WAITING'; // 'WAITING', 'PLAYING', 'FINISHED'
    this.players = new Map(); // socketId -> { socket, username, vm, remoteHostIp, activeTasks }
    this.assignedIps = new Set();
    this.winner = null;
    this.winReason = null;
    this.startedAt = null;

    this.addPlayer(player1.socket, player1.username);
  }

  // Generar IP virtual única en el rango 10.13.37.10 - 10.13.37.250
  generateVirtualIp() {
    let hostOctet;
    let ip;
    do {
      hostOctet = Math.floor(Math.random() * 240) + 10;
      ip = `10.13.37.${hostOctet}`;
    } while (this.assignedIps.has(ip));
    this.assignedIps.add(ip);
    return ip;
  }

  addPlayer(socket, username) {
    if (this.players.size >= 2) return false;

    const virtualIp = this.generateVirtualIp();
    const vm = new VirtualMachine(socket.id, username, virtualIp);

    this.players.set(socket.id, {
      socket,
      username,
      vm,
      remoteHostIp: null, // Si tiene shell remota activa
      activeTasks: new Map() // taskId -> { timer, procPid, type, ... }
    });

    socket.join(this.roomId);

    if (this.players.size === 2) {
      this.status = 'PLAYING';
      this.startedAt = Date.now();
      this.broadcastMatchStart();
    }

    return true;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return;

    // Cancelar tareas activas
    for (const [taskId, task] of player.activeTasks.entries()) {
      clearTimeout(task.timer);
    }

    this.players.delete(socketId);
    if (player.vm?.virtualIp) {
      this.assignedIps.delete(player.vm.virtualIp);
    }

    if (this.status === 'PLAYING') {
      this.status = 'FINISHED';
      // El jugador que queda gana por abandono
      const remaining = Array.from(this.players.values())[0];
      if (remaining) {
        this.winner = remaining.username;
        this.winReason = 'El oponente se ha desconectado de la red.';
        this.broadcastGameOver(this.winner, this.winReason);
      }
    }
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  getOpponent(socketId) {
    for (const [id, p] of this.players.entries()) {
      if (id !== socketId) return p;
    }
    return null;
  }

  broadcastMatchStart() {
    for (const [socketId, player] of this.players.entries()) {
      const opponent = this.getOpponent(socketId);
      player.socket.emit('match_started', {
        roomId: this.roomId,
        myIp: player.vm.virtualIp,
        myHostname: player.vm.hostname,
        opponentUsername: opponent ? opponent.username : 'Oponente',
        myState: player.vm.toClientState()
      });
    }
  }

  syncStates() {
    for (const [socketId, player] of this.players.entries()) {
      player.socket.emit('state_update', {
        myState: player.vm.toClientState(),
        remoteHostIp: player.remoteHostIp
      });
    }
  }

  broadcastGameOver(winnerUsername, reason) {
    this.status = 'FINISHED';
    for (const player of this.players.values()) {
      player.socket.emit('game_over', {
        winner: winnerUsername,
        reason,
        flagCaptured: reason.includes('FLAG')
      });
    }
  }

  // Ejecución de comandos del juego
  handleCommand(socketId, rawCommand) {
    const player = this.players.get(socketId);
    if (!player) return { error: 'Jugador no encontrado en la sala.' };

    if (this.status !== 'PLAYING') {
      return { output: 'La partida no está activa actualmente.' };
    }

    const trimmed = rawCommand.trim();
    if (!trimmed) return { output: '' };

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const opponent = this.getOpponent(socketId);

    // Si el jugador está en una shell remota, ciertos comandos se ejecutan en el VM del oponente
    if (player.remoteHostIp) {
      if (opponent && opponent.vm.virtualIp === player.remoteHostIp) {
        return this.handleRemoteShellCommand(player, opponent, cmd, args);
      } else {
        // La sesión remota ya no es válida
        player.remoteHostIp = null;
      }
    }

    // Comandos Locales / Ofensivos / Defensivos
    switch (cmd) {
      case 'help':
      case 'ayuda':
        return this.cmdHelp();

      case 'clear':
      case 'cls':
        return { clear: true, output: '' };

      case 'ifconfig':
      case 'ip':
        return this.cmdIfconfig(player);

      case 'netdiscover':
        return this.cmdNetdiscover(player, opponent);

      case 'nmap':
        return this.cmdNmap(player, opponent, args);

      case 'probe':
        return this.cmdProbe(player, opponent, args);

      case 'exploit':
        return this.cmdExploit(player, opponent, args);

      case 'connect':
        return this.cmdConnect(player, opponent, args);

      case 'submit':
        return this.cmdSubmit(player, opponent, args);

      case 'ps':
        return this.cmdPs(player);

      case 'kill':
        return this.cmdKill(player, opponent, args);

      case 'firewall':
        return this.cmdFirewall(player, opponent, args);

      case 'patch':
        return this.cmdPatch(player, args);

      case 'clearlogs':
        player.vm.clearSyslog();
        this.syncStates();
        return { output: 'Registro /var/log/syslog borrado con éxito.' };

      // Comandos de Troyano / Trolling Cibernético
      case 'popup':
      case 'alert':
      case 'freeze':
      case 'glitch':
      case 'invert':
      case 'flip':
      case 'chaos':
      case 'mousechaos':
      case 'say':
      case 'msg':
        return this.handleTrollCommand(player, opponent, cmd, args);

      // Comando de Simulador / Prueba local de efectos
      case 'test':
        return this.handleSelfTest(player, args);

      // Comandos de sistema de archivos local
      case 'ls':
        return this.cmdLs(player.vm, args);

      case 'cd':
        return this.cmdCd(player.vm, args);

      case 'cat':
        return this.cmdCat(player.vm, args);

      case 'rm':
        return this.cmdRm(player.vm, args, false);

      case 'exit':
        return { output: 'Ya estás en tu shell local. (No hay sesión remota activa).' };

      default:
        return { output: `bash: ${cmd}: comando no encontrado. Escribe 'help' para ver la lista de comandos.` };
    }
  }

  // --- Implementación de Comandos ---

  cmdHelp() {
    const text = `
╔═════════════════════════════════════════════════════════════════════════════╗
║                  HACKWARS LAN - MANUAL COMPLETO DE COMANDOS                 ║
╚═════════════════════════════════════════════════════════════════════════════╝

[1] RECONOCIMIENTO & INFILTRACIÓN (Ofensiva)
  help | ayuda                      Muestra este manual completo de comandos.
  ifconfig | ip                     Muestra tu IP Virtual, estado de red y puertos.
  netdiscover                       Escaneo ARP en la subred 10.13.37.0/24 (3s).
  nmap <target_ip>                  Escaneo SYN de puertos abiertos en el objetivo (4s).
  probe <target_ip> <puerto>        Inspecciona banner, versión y vulnerabilidad (3s).
  exploit <target_ip> <p> <payload> Inyecta exploit (8s, 40% CPU). Compromete el puerto.
  connect <target_ip>               Abre shell remota interactiva si hay puertos hackeados.

[2] TROYANOS & CONTROL DE PANTALLA (Requiere puerto comprometido o Shell remota)
  popup | alert <mensaje>           Proyecta un cartel de intrusión rojo con alarma en su pantalla.
  freeze                            Congela la consola del rival con candado por 4s (no tipea).
  glitch                            Sacude y distorsiona el monitor del rival con estática CRT (4.5s).
  invert | flip                     Gira e invierte la pantalla del rival 180° de cabeza por 5s.
  chaos | mousechaos                Desata enjambre de 8 punteros fantasma en su cursor por 5s.
  say | msg <mensaje>               Escribe un mensaje intruso directamente en su terminal.

[3] DEFENSA, PROCESOS & FIREWALL (Defensiva)
  ps                                Lista procesos activos, % CPU y ATAQUES ENTRANTES con su PID.
  kill <pid>                        Termina proceso. ¡Matar un exploit entrante neutraliza el ataque!
  firewall <puerto> <open|close>    Abre o cierra un puerto (+25% CPU c/u, máx 2 cerrados).
                                    (Cerrar el puerto corta conexiones intrusas activas).
  patch <puerto>                    Repara puerto comprometido y renueva defensas (6s, 30% CPU).
  clearlogs                         Borra tu archivo /var/log/syslog local.

[4] SISTEMA DE ARCHIVOS VIRTUAL (Navegación)
  ls [ruta]                         Lista archivos y carpetas locales o remotos.
  cd <ruta>                         Cambia de directorio (ej: cd /home/admin, cd ~).
  cat <archivo>                     Lee contenido de un archivo (ej: cat /home/admin/flag.txt).
  rm <archivo>                      Elimina un archivo (ej: rm notas.txt).

[5] CONDICIONES DE VICTORIA (¡GANA LA PARTIDA!)
  submit <flag_hash>                ¡WIN CTF! Entrega la FLAG capturada del rival.
  rm /boot/kernel.sys               ¡WIN FATAL! Destruye el kernel enemigo en shell remota.
  gane | win | pwn | deface         ¡WIN EASTER EGG! Escríbelo dentro de la shell remota rival.

[6] SIMULADOR LOCAL (Prueba efectos en tu propia pantalla)
  test                              Menú del simulador visual de efectos.
  test freeze                       Prueba el bloqueo de consola (candado por 4s).
  test popup <mensaje>              Prueba el cartel de intrusión con sirena de alarma.
  test glitch                       Prueba la interferencia CRT y estática en tu monitor.
  test invert                       Prueba girar e invertir tu pantalla 180°.
  test chaos                        Prueba los cursores de mouse fantasma en tu pantalla.

[7] TERMINAL Y ATAJOS
  clear | cls                       Limpia el texto de la pantalla (o Ctrl + L).
  exit                              Cierra la shell remota y vuelve a tu terminal local.
  Tab                               Autocompleta comandos y rutas de archivos.
`;
    return { output: text };
  }

  cmdIfconfig(player) {
    const vm = player.vm;
    const portsStr = Object.entries(vm.ports)
      .map(([p, info]) => `    ${p}/tcp -> [${info.service}] (${info.open ? 'OPEN' : 'CLOSED'})`)
      .join('\n');

    const output = `
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet ${vm.virtualIp}  netmask 255.255.255.0  broadcast 10.13.37.255
        hostname ${vm.hostname}
        rx_packets 1337  bytes 1048576 (1.0 MB)
        tx_packets 1337  bytes 1048576 (1.0 MB)

Puertos virtuales configurados:
${portsStr}
`;
    return { output };
  }

  cmdNetdiscover(player, opponent) {
    const taskId = 'task_' + crypto.randomUUID().slice(0, 8);
    const duration = 3000;

    player.socket.emit('task_start', {
      taskId,
      name: 'netdiscover',
      label: 'Escaneando subred 10.13.37.0/24 con paquetes ARP...',
      duration
    });

    const timer = setTimeout(() => {
      player.activeTasks.delete(taskId);
      const oppIp = opponent ? opponent.vm.virtualIp : '10.13.37.42';
      const output = `
[+] Escaneo ARP finalizado en subred 10.13.37.0/24:
----------------------------------------------------------------------
 IP VIRTUAL       MAC ADDRESS         NOMBRE DE NODO / FABRICANTE
----------------------------------------------------------------------
 10.13.37.1       52:54:00:12:34:56   Virtual-Default-Gateway
 ${player.vm.virtualIp}   00:1a:2b:3c:4d:5e   (Localhost: ${player.vm.hostname})
 ${oppIp}  fa:16:3e:78:90:ab   Objetivo Host (${opponent?.username || 'Oponente'})
----------------------------------------------------------------------
Se encontraron 2 hosts activos en la subred.
`;
      player.socket.emit('task_complete', { taskId, output });
    }, duration);

    player.activeTasks.set(taskId, { timer, type: 'netdiscover' });
    return { output: null, pending: true };
  }

  cmdNmap(player, opponent, args) {
    const targetIp = args[0];
    if (!targetIp) {
      return { output: 'Uso: nmap <target_ip>' };
    }

    if (!opponent || opponent.vm.virtualIp !== targetIp) {
      return { output: `nmap: No se obtuvo respuesta de ${targetIp} (Host inaccesible o fuera de subred).` };
    }

    const taskId = 'task_' + crypto.randomUUID().slice(0, 8);
    const duration = 4000;

    player.socket.emit('task_start', {
      taskId,
      name: 'nmap',
      label: `Iniciando SYN Stealth Scan contra ${targetIp}...`,
      duration
    });

    // Alertar en el syslog del objetivo
    opponent.vm.addLog('ALERT', `[ALERTA INTRUSIÓN] Escaneo SYN stealth detectado desde ${player.vm.virtualIp}`);
    this.syncStates();

    const timer = setTimeout(() => {
      player.activeTasks.delete(taskId);

      let portRows = [];
      for (const [p, info] of Object.entries(opponent.vm.ports)) {
        if (info.open) {
          portRows.push(`${p}/tcp`.padEnd(12) + 'open'.padEnd(12) + info.service);
        } else {
          portRows.push(`${p}/tcp`.padEnd(12) + 'closed'.padEnd(12) + info.service);
        }
      }

      const output = `
Iniciando Nmap 7.92 ( https://nmap.org ) en 10.13.37.0/24
Informe de escaneo de Nmap para ${targetIp} (${opponent.vm.hostname})
El host está activo (latencia 0.0012s).

PUERTO      ESTADO      SERVICIO
-----------------------------------------
${portRows.join('\n')}

Nmap terminado: 1 dirección IP escaneada (1 host activo).
`;
      player.socket.emit('task_complete', { taskId, output });
    }, duration);

    player.activeTasks.set(taskId, { timer, type: 'nmap' });
    return { output: null, pending: true };
  }

  cmdProbe(player, opponent, args) {
    const targetIp = args[0];
    const portNum = args[1];

    if (!targetIp || !portNum) {
      return { output: 'Uso: probe <target_ip> <puerto>' };
    }

    if (!opponent || opponent.vm.virtualIp !== targetIp) {
      return { output: `probe: Host ${targetIp} no responde.` };
    }

    const portInfo = opponent.vm.ports[portNum];
    if (!portInfo) {
      return { output: `probe: Puerto ${portNum} no está registrado en el servicio virtual.` };
    }

    const taskId = 'task_' + crypto.randomUUID().slice(0, 8);
    const duration = 3000;

    player.socket.emit('task_start', {
      taskId,
      name: 'probe',
      label: `Inspeccionando banner y huella de servicio en ${targetIp}:${portNum}...`,
      duration
    });

    // Log en oponente
    opponent.vm.addLog('WARN', `Intento de banner grabbing y probe en puerto ${portNum} desde ${player.vm.virtualIp}`);
    this.syncStates();

    const timer = setTimeout(() => {
      player.activeTasks.delete(taskId);

      if (!portInfo.open) {
        player.socket.emit('task_complete', {
          taskId,
          output: `[!] Puerto ${portNum} cerrado. La conexión fue rechazada (RST/ACK).`
        });
        return;
      }

      const output = `
[+] Sondeo de Servicio Exitoso [${targetIp}:${portNum}]:
------------------------------------------------------------
 SERVICIO:        ${portInfo.service}
 VERSIÓN:         ${portInfo.version}
 VULNERABILIDAD:  ${portInfo.vuln}
 ESTADO:          ${portInfo.compromised ? 'COMPROMETIDO' : 'VULNERABLE'}
 REQUISITO EXPLOIT PAYLOAD: ${portInfo.payload}
------------------------------------------------------------
Comando sugerido: exploit ${targetIp} ${portNum} ${portInfo.payload}
`;
      player.socket.emit('task_complete', { taskId, output });
    }, duration);

    player.activeTasks.set(taskId, { timer, type: 'probe' });
    return { output: null, pending: true };
  }

  cmdExploit(player, opponent, args) {
    const targetIp = args[0];
    const portNum = args[1];
    const payload = args[2];

    if (!targetIp || !portNum || !payload) {
      return { output: 'Uso: exploit <target_ip> <puerto> <payload>' };
    }

    if (!opponent || opponent.vm.virtualIp !== targetIp) {
      return { output: `exploit: Host ${targetIp} inalcanzable.` };
    }

    const portInfo = opponent.vm.ports[portNum];
    if (!portInfo) {
      return { output: `exploit: Puerto ${portNum} inválido.` };
    }

    if (!portInfo.open) {
      return { output: `exploit: Fallo de conexión. El puerto ${portNum} está CERRADO por el firewall objetivo.` };
    }

    // Verificar si el jugador tiene suficiente CPU libre (40% requerido)
    const requiredCpu = 40;
    if (player.vm.resources.usedCpu + requiredCpu > player.vm.resources.maxCpu) {
      return {
        output: `[ERROR] CPU insuficiente. Uso actual: ${player.vm.resources.usedCpu}%. Requiere: 40% libre.\nUsa 'ps' y 'kill <pid>' para liberar recursos o revisa puertos cerrados.`
      };
    }

    const taskId = 'task_' + crypto.randomUUID().slice(0, 8);
    const duration = 8000;

    // Registrar proceso de ataque en la máquina atacante (+40% CPU)
    const attackProc = player.vm.addProcess(
      `exploit_${portInfo.service.toLowerCase()}`,
      requiredCpu,
      'root',
      'attack_task',
      () => {
        // Callback si el atacante mata su propio proceso de exploit
        clearTimeout(timer);
        player.activeTasks.delete(taskId);
        // Remover proceso intruso del oponente
        if (incomingProc) opponent.vm.killProcess(incomingProc.pid);
        player.socket.emit('task_cancelled', { taskId, reason: 'Proceso de exploit terminado localmente.' });
      },
      { targetIp, port: portNum }
    );

    // Registrar proceso de ataque entrante en la máquina del oponente (para que aparezca en su 'ps')
    const incomingProc = opponent.vm.addProcess(
      `exploit_in_p${portNum}`,
      15,
      'unknown',
      'incoming_attack',
      () => {
        // Si el oponente termina este proceso con kill <pid>, el ataque falla!
        clearTimeout(timer);
        player.activeTasks.delete(taskId);
        player.vm.killProcess(attackProc.pid);
        this.syncStates();
        player.socket.emit('task_cancelled', {
          taskId,
          reason: `[ATAQUE FALLIDO] La conexión fue abortada con SIGKILL por la defensa de ${targetIp}!`
        });
        opponent.vm.addLog('INFO', `Amenaza de exploit entrante en puerto ${portNum} neutralizada con éxito.`);
      },
      { sourceIp: player.vm.virtualIp, port: portNum, taskId }
    );

    // Log crítico en syslog de la víctima
    opponent.vm.addLog('CRIT', `[CRÍTICO] Inyección de payload malicioso detectada en puerto ${portNum} desde ${player.vm.virtualIp}!`);
    this.syncStates();

    player.socket.emit('task_start', {
      taskId,
      name: 'exploit',
      label: `Inyectando exploit contra ${portInfo.service} (${targetIp}:${portNum}) [40% CPU]...`,
      duration
    });

    const timer = setTimeout(() => {
      // Remover proceso atacante y defensor de forma limpia (sin invocar cancelFn)
      player.vm.removeProcess(attackProc.pid);
      if (incomingProc) {
        opponent.vm.removeProcess(incomingProc.pid);
      }
      player.activeTasks.delete(taskId);

      // Verificar si el puerto sigue abierto
      if (!portInfo.open) {
        player.socket.emit('task_complete', {
          taskId,
          output: `[!] Exploit fallido: El puerto ${portNum} fue cerrado durante la inyección.`
        });
        this.syncStates();
        return;
      }

      // Validar payload
      if (payload !== portInfo.payload) {
        player.socket.emit('task_complete', {
          taskId,
          output: `[-] Exploit fallido: El payload '${payload}' fue rechazado por el servicio. (Payload incorrecto).`
        });
        opponent.vm.addLog('ALERT', `Fallo de autenticación / exploit malformado en puerto ${portNum} desde ${player.vm.virtualIp}`);
        this.syncStates();
        return;
      }

      // Éxito: Marcar comprometido
      portInfo.compromised = true;
      opponent.vm.addLog('CRIT', `[BRECHA DE SEGURIDAD] Servicio ${portInfo.service} (puerto ${portNum}) ha sido COMPROMETIDO por ${player.vm.virtualIp}!`);
      this.syncStates();

      const output = `
[+] ==============================================================
[+] ¡EXPLOIT EJECUTADO CON ÉXITO!
[+] Vulnerabilidad explotada en ${portInfo.service} (Puerto ${portNum}).
[+] El puerto ahora figura como COMPROMETIDO en el host remoto.
[+] Acceso raíz autorizado. Usa: connect ${targetIp}
[+] ==============================================================
`;
      player.socket.emit('task_complete', { taskId, output });
    }, duration);

    player.activeTasks.set(taskId, { timer, procPid: attackProc.pid, incomingProcPid: incomingProc.pid, type: 'exploit' });
    return { output: null, pending: true };
  }

  cmdConnect(player, opponent, args) {
    const targetIp = args[0];
    if (!targetIp) {
      return { output: 'Uso: connect <target_ip>' };
    }

    if (!opponent || opponent.vm.virtualIp !== targetIp) {
      return { output: `connect: Host ${targetIp} inalcanzable.` };
    }

    // Buscar si hay algún puerto abierto y comprometido
    let validPort = null;
    for (const [p, info] of Object.entries(opponent.vm.ports)) {
      if (info.open && info.compromised) {
        validPort = parseInt(p, 10);
        break;
      }
    }

    if (!validPort) {
      return {
        output: `connect: Acceso denegado a ${targetIp}. No existen puertos abiertos comprometidos. Explota un servicio primero.`
      };
    }

    player.remoteHostIp = targetIp;
    opponent.vm.connectedAttacker = {
      attackerId: player.socket.id,
      port: validPort,
      currentPath: '/root'
    };

    opponent.vm.addLog('CRIT', `[INTRUSIÓN DIRECTA] Shell remota interactiva abierta desde ${player.vm.virtualIp} vía puerto ${validPort}!`);
    this.syncStates();

    const output = `
======================================================================
 Conexión establecida con éxito hacia ${targetIp}
 Autenticado como: root@${opponent.vm.hostname} (vía puerto ${validPort})
 Escribe 'help' para ver comandos, 'exit' para salir al nodo local.
 ADVERTENCIA: Acciones registradas en el syslog del objetivo.
======================================================================
`;
    return { output, remoteConnected: true, targetIp, cwd: '/root' };
  }

  // Comandos dentro de una Shell Remota (en la máquina víctima)
  handleRemoteShellCommand(player, opponent, cmd, args) {
    const targetVm = opponent.vm;

    switch (cmd) {
      case 'help':
      case 'ayuda':
        return {
          output: `
╔═════════════════════════════════════════════════════════════════════════════╗
║            COMANDOS EN SHELL REMOTA (root@${targetVm.hostname})            ║
╚═════════════════════════════════════════════════════════════════════════════╝

[+] EXPLORACIÓN Y ROBO DE FLAG
  ls [ruta]                         Lista archivos y carpetas del host objetivo.
  cd <ruta>                         Cambia de directorio (ej: cd /home/admin).
  cat <archivo>                     Lee archivos confidenciales (ej: cat /home/admin/flag.txt).
  cat /var/log/syslog               Lee logs y eventos del host rival.
  clearlogs                         Borra /var/log/syslog del host para borrar tus rastros.

[+] TROYANOS Y CONTROL DE PANTALLA
  popup | alert <mensaje>           Proyecta un cartel de alerta/pánico en su pantalla.
  freeze                            Congela la consola del rival por 4s (no puede tipear).
  glitch                            Distorsiona y sacude su pantalla con estática CRT (4.5s).
  invert | flip                     Gira e invierte su pantalla 180° por 5s.
  chaos | mousechaos                Desata enjambre de punteros fantasma en su mouse (5s).
  say | msg <mensaje>               Escribe un mensaje intruso directamente en su terminal.

[+] CONDICIONES DE VICTORIA DIRECTA
  rm /boot/kernel.sys               ¡DESTRUCCIÓN FATAL! Causa un Kernel Panic irreversible.
  gane | win | pwn | deface         ¡EASTER EGG! Defacement y toma de control absoluta.

[+] UTILIDADES Y TERMINAL
  clear | cls                       Limpia el texto de la pantalla.
  test [efecto]                     Ejecuta el simulador local de pruebas.
  exit                              Cierra la conexión remota y vuelve a tu terminal local.
`
        };

      case 'clear':
      case 'cls':
        return { clear: true, output: '' };

      case 'exit':
        player.remoteHostIp = null;
        targetVm.connectedAttacker = null;
        targetVm.addLog('INFO', `Sesión remota cerrada por ${player.vm.virtualIp}`);
        this.syncStates();
        return { output: `Conexión con ${targetVm.virtualIp} finalizada. De regreso en tu nodo local.` };

      case 'ls':
        return this.cmdLs(targetVm, args);

      case 'cd':
        return this.cmdCd(targetVm, args);

      case 'cat':
        targetVm.addLog('WARN', `Lectura remota de archivo '${args[0]}' por usuario intruso.`);
        this.syncStates();
        return this.cmdCat(targetVm, args);

      case 'rm':
        const res = this.cmdRm(targetVm, args, true);
        if (res.kernelPanic) {
          // Victoria del atacante por destrucción del sistema operativo
          this.broadcastGameOver(
            player.username,
            `¡Victoria de ${player.username}! Destruyó el archivo crítico /boot/kernel.sys de ${opponent.username}, causando un Kernel Panic fatal.`
          );
        }
        return res;

      case 'clearlogs':
        targetVm.clearSyslog();
        this.syncStates();
        return { output: `[REMOTO] Registros /var/log/syslog en ${targetVm.hostname} limpiados exitosamente.` };

      // ¡Condición de Victoria Secreta / Easter Egg escribiendo en su consola!
      case 'gane':
      case 'win':
      case 'pwn':
      case 'pwned':
      case 'gg':
      case 'deface':
        this.broadcastGameOver(
          player.username,
          `¡Victoria Secreta (Easter Egg)! ${player.username} descubrió el comando oculto "GANE" en la consola remota de ${opponent.username}.`
        );
        return {
          output: `
[+] ==============================================================
[+] 🥚 ¡EASTER EGG SECRETO ACTIVADO!
[+] Has escrito 'GANE' en la consola remota de ${opponent.username}.
[+] ¡Defacement oculto exitoso! Has tomado el control total.
[+] ==============================================================
`
        };

      // Troll commands inside remote shell
      case 'popup':
      case 'alert':
      case 'freeze':
      case 'glitch':
      case 'invert':
      case 'flip':
      case 'chaos':
      case 'mousechaos':
      case 'say':
      case 'msg':
        return this.handleTrollCommand(player, opponent, cmd, args);

      case 'test':
        return this.handleSelfTest(player, args);

      case 'ps':
      case 'ifconfig':
      case 'nmap':
      case 'probe':
      case 'exploit':
      case 'connect':
      case 'firewall':
      case 'patch':
      case 'submit':
        return {
          output: `Comando '${cmd}' restringido en shell remota. Usa 'popup', 'freeze', 'glitch', 'invert', 'chaos', 'say' o comandos de archivos (ls, cat, rm). Escribe 'exit' para volver al nodo local.`
        };

      default:
        return { output: `sh: ${cmd}: no encontrado. Escribe 'help' o 'exit'.` };
    }
  }

  // Manejo de Troyanos y Trolling de Pantalla
  handleTrollCommand(player, opponent, cmd, args) {
    if (!opponent) {
      return { output: 'Error: No hay oponente conectado en la partida.' };
    }

    // Verificar si el oponente tiene al menos 1 puerto comprometido O si ya estamos en shell remota
    const hasBreachedPort = Object.values(opponent.vm.ports).some(p => p.compromised);
    const inRemote = player.remoteHostIp === opponent.vm.virtualIp;

    if (!hasBreachedPort && !inRemote) {
      return {
        output: `[ERROR] Requiere haber comprometido al menos 1 puerto en ${opponent.vm.virtualIp} para inyectar este troyano en su pantalla.`
      };
    }

    const normCmd = cmd.toLowerCase();

    switch (normCmd) {
      case 'popup':
      case 'alert': {
        const msg = args.join(' ') || '⚠️ ¡TU SISTEMA HA SIDO COMPROMETIDO POR EL INTRUSO! ⚠️';
        opponent.socket.emit('victim_popup', { message: msg, from: player.username });
        opponent.vm.addLog('CRIT', `[ALERTA INTRUSIÓN] Cartel popup inyectado remotamente por ${player.vm.virtualIp}: "${msg}"`);
        this.syncStates();
        return { output: `[+] ¡Cartel de pánico proyectado con éxito en la pantalla de ${opponent.username}!` };
      }

      case 'freeze': {
        const duration = 4000;
        opponent.socket.emit('victim_freeze', { duration, from: player.username });
        opponent.vm.addLog('CRIT', `[BLOQUEO DE KERNEL] Terminal congelada por comando remoto de ${player.vm.virtualIp} (4s)!`);
        this.syncStates();
        return { output: `[+] ¡Terminal de ${opponent.username} CONGELADA durante 4 segundos! (Teclado bloqueado).` };
      }

      case 'glitch': {
        const duration = 4500;
        opponent.socket.emit('victim_glitch', { duration });
        opponent.vm.addLog('WARN', `Interferencia de señal en monitor causada por ${player.vm.virtualIp}`);
        this.syncStates();
        return { output: `[+] Interferencia CRT y distorsión de video activada en la pantalla de ${opponent.username}.` };
      }

      case 'invert':
      case 'flip': {
        const duration = 5000;
        opponent.socket.emit('victim_invert', { duration });
        opponent.vm.addLog('WARN', `Matriz de video invertida remotamente por ${player.vm.virtualIp}`);
        this.syncStates();
        return { output: `[+] Pantalla de ${opponent.username} rotada 180° e invertida durante 5 segundos.` };
      }

      case 'chaos':
      case 'mousechaos': {
        const duration = 5000;
        opponent.socket.emit('victim_chaos', { duration });
        opponent.vm.addLog('WARN', `Pánico de periféricos (mouse) inyectado por ${player.vm.virtualIp}`);
        this.syncStates();
        return { output: `[+] Punteros fantasma y caos de cursor activados en el mouse de ${opponent.username}.` };
      }

      case 'say':
      case 'msg': {
        const msg = args.join(' ') || 'Te estoy observando...';
        opponent.socket.emit('victim_message', { message: msg, from: player.username });
        opponent.vm.addLog('ALERT', `Mensaje intruso en consola recibido de ${player.vm.virtualIp}: "${msg}"`);
        this.syncStates();
        return { output: `[+] Mensaje escrito directamente en la consola de ${opponent.username}: "${msg}"` };
      }

      default:
        return { output: `Comando de trolling desconocido: ${cmd}` };
    }
  }

  // Simulador local para probar efectos visuales en pantalla propia
  handleSelfTest(player, args) {
    const effect = (args[0] || '').toLowerCase();
    switch (effect) {
      case 'freeze':
        player.socket.emit('victim_freeze', { duration: 4000, from: 'Simulador' });
        return { output: '[SIMULADOR] Probando efecto "freeze": Tu consola se bloqueará durante 4 segundos.' };

      case 'popup':
      case 'alert': {
        const msg = args.slice(1).join(' ') || '⚠️ [SIMULADOR] Alerta de intrusión de prueba con calavera';
        player.socket.emit('victim_popup', { message: msg, from: 'Simulador' });
        return { output: '[SIMULADOR] Probando efecto "popup": Cartel de intrusión proyectado en tu pantalla.' };
      }

      case 'glitch':
        player.socket.emit('victim_glitch', { duration: 4500 });
        return { output: '[SIMULADOR] Probando efecto "glitch": Monitor distorsionado con estática CRT por 4.5s.' };

      case 'invert':
      case 'flip':
        player.socket.emit('victim_invert', { duration: 5000 });
        return { output: '[SIMULADOR] Probando efecto "invert": Pantalla rotada 180° e invertida por 5s.' };

      case 'chaos':
      case 'mousechaos':
        player.socket.emit('victim_chaos', { duration: 5000 });
        return { output: '[SIMULADOR] Probando efecto "chaos": Punteros fantasma activados en tu pantalla por 5s.' };

      default:
        return {
          output: `
╔═════════════════════════════════════════════════════════════════════════════╗
║                      COMANDOS DEL SIMULADOR VISUAL                          ║
╚═════════════════════════════════════════════════════════════════════════════╝
Usa estos comandos para probar en vivo los efectos en tu propia pantalla:
  test freeze              Prueba el bloqueo de consola (candado por 4s).
  test popup <mensaje>     Prueba la ventana emergente roja con calavera y alarma.
  test glitch              Prueba la sacudida y distorsión CRT del monitor.
  test invert              Prueba girar e invertir tu pantalla 180° de cabeza.
  test chaos               Prueba el enjambre de punteros de mouse falsos.
`
        };
    }
  }

  cmdSubmit(player, opponent, args) {
    const submittedFlag = args[0];
    if (!submittedFlag) {
      return { output: 'Uso: submit <flag_hash>' };
    }

    if (!opponent) {
      return { output: 'No hay oponente en la sala.' };
    }

    if (submittedFlag.trim() === opponent.vm.flag.trim()) {
      this.broadcastGameOver(
        player.username,
        `¡Victoria de ${player.username}! Capturó y entregó exitosamente la FLAG del oponente (${submittedFlag}).`
      );
      return { output: '[+] ¡BANDERA VÁLIDA! ¡HAS GANADO LA PARTIDA!' };
    } else {
      player.vm.addLog('WARN', `Intento fallido de entrega de bandera: ${submittedFlag}`);
      this.syncStates();
      return { output: '[-] Bandera incorrecta. Acceso no reconocido.' };
    }
  }

  cmdPs(player) {
    const list = player.vm.processes;
    let rows = list.map(p => {
      const pidStr = p.pid.toString().padEnd(6);
      const userStr = p.user.padEnd(10);
      const cpuStr = `${p.cpu}%`.padEnd(8);
      const nameStr = p.name;
      return `${pidStr} ${userStr} ${cpuStr} ${nameStr}`;
    });

    const output = `
PID    USUARIO    %CPU     COMANDO
------------------------------------------------------
${rows.join('\n')}
------------------------------------------------------
Uso total de CPU: ${player.vm.resources.usedCpu}% / 100%
`;
    return { output };
  }

  cmdKill(player, opponent, args) {
    const pid = args[0];
    if (!pid) {
      return { output: 'Uso: kill <pid>' };
    }

    const res = player.vm.killProcess(pid);
    this.syncStates();
    return { output: res.message };
  }

  cmdFirewall(player, opponent, args) {
    const port = args[0];
    const action = args[1]?.toLowerCase();

    if (!port || !action) {
      return { output: 'Uso: firewall <puerto> <open|close>' };
    }

    const res = player.vm.toggleFirewall(port, action);
    this.syncStates();

    if (res.severedConnection && opponent) {
      // Cortar la shell remota del oponente si estaba conectado por este puerto
      opponent.remoteHostIp = null;
      opponent.socket.emit('connection_severed', {
        message: `[DESCONEXIÓN FORZADA] La conexión remota con ${player.vm.virtualIp} fue cortada abruptamente (El puerto ${port} fue cerrado por el Firewall).`
      });
    }

    return { output: res.message };
  }

  cmdPatch(player, args) {
    const port = args[0];
    if (!port) {
      return { output: 'Uso: patch <puerto>' };
    }

    const portInfo = player.vm.ports[port];
    if (!portInfo) {
      return { output: `patch: Puerto ${port} no existe.` };
    }

    if (!portInfo.compromised) {
      return { output: `patch: El servicio en el puerto ${port} (${portInfo.service}) no está comprometido.` };
    }

    // Requiere 30% CPU
    const requiredCpu = 30;
    if (player.vm.resources.usedCpu + requiredCpu > player.vm.resources.maxCpu) {
      return {
        output: `[ERROR] CPU insuficiente para parchear (${player.vm.resources.usedCpu}% en uso). Requiere 30% libre.\nLibera procesos con 'kill' o abre puertos cerrados con 'firewall'.`
      };
    }

    const taskId = 'task_' + crypto.randomUUID().slice(0, 8);
    const duration = 6000;

    const patchProc = player.vm.addProcess(
      `patch_port_${port}`,
      requiredCpu,
      'root',
      'patch_task',
      () => {
        clearTimeout(timer);
        player.activeTasks.delete(taskId);
        player.socket.emit('task_cancelled', { taskId, reason: 'Proceso de parcheo cancelado.' });
      },
      { port }
    );

    player.socket.emit('task_start', {
      taskId,
      name: 'patch',
      label: `Recompilando binario y mitigando vulnerabilidad en puerto ${port} [30% CPU]...`,
      duration
    });

    this.syncStates();

    const timer = setTimeout(() => {
      player.vm.removeProcess(patchProc.pid);
      player.activeTasks.delete(taskId);

      const patchRes = player.vm.patchService(port);
      this.syncStates();

      player.socket.emit('task_complete', { taskId, output: patchRes.message });
    }, duration);

    player.activeTasks.set(taskId, { timer, procPid: patchProc.pid, type: 'patch' });
    return { output: null, pending: true };
  }

  // --- Manejo de archivos (ls, cd, cat, rm) ---
  cmdLs(vm, args) {
    const target = args[0] || '';
    const res = vm.listDirectory(vm.currentPath, target);
    if (!res.success) return { output: res.message };

    const rows = res.entries.map(e => {
      const type = e.isDir ? '<DIR>' : '     ';
      const sizeStr = `${e.size} B`.padStart(10);
      return `${type} ${sizeStr}  ${e.name}${e.isDir ? '/' : ''}`;
    });

    const output = `
Directorio de ${res.resolvedPath}:
-----------------------------------------------
${rows.join('\n')}
-----------------------------------------------
Total elementos: ${res.entries.length}
`;
    return { output };
  }

  cmdCd(vm, args) {
    const target = args[0] || '~';
    const res = vm.changeDirectory(vm.currentPath, target);
    if (!res.success) return { output: res.message };

    vm.currentPath = res.newPath;
    return { output: '', newPath: res.newPath };
  }

  cmdCat(vm, args) {
    const file = args[0];
    const res = vm.readFile(vm.currentPath, file);
    if (!res.success) return { output: res.message };

    return { output: res.content };
  }

  cmdRm(vm, args, isRemote) {
    const file = args[0];
    const res = vm.deleteFile(vm.currentPath, file);
    if (!res.success) return { output: res.message };

    return { output: res.message, kernelPanic: !!res.kernelPanic };
  }
}

module.exports = GameRoom;
