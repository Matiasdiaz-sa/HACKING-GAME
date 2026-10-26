const crypto = require('crypto');

class VirtualMachine {
  constructor(playerId, username, virtualIp) {
    this.playerId = playerId;
    this.username = username;
    this.virtualIp = virtualIp;
    this.hostname = `node-${virtualIp.split('.')[3]}`;
    
    // Flag única del jugador
    this.flag = `FLAG-${crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;

    // Recursos
    this.resources = {
      maxCpu: 100,
      usedCpu: 3, // Procesos base
      ram: 100
    };

    // Puertos y servicios
    this.ports = {
      21: { 
        service: 'FTP', 
        version: 'vsftpd-2.3.4', 
        open: true, 
        compromised: false, 
        vuln: 'backdoor_cmd', 
        payload: 'VSFTPD_234_ROOT' 
      },
      22: { 
        service: 'SSH', 
        version: 'OpenSSH-7.2', 
        open: true, 
        compromised: false, 
        vuln: 'brute_ssh', 
        payload: 'LIBSSH_AUTH_BYPASS' 
      },
      80: { 
        service: 'HTTP', 
        version: 'Apache-2.4.49', 
        open: true, 
        compromised: false, 
        vuln: 'path_traversal', 
        payload: 'CGI_PATH_TRAVERSAL' 
      },
      3306: { 
        service: 'MySQL', 
        version: 'MySQL-5.7', 
        open: false, 
        compromised: false, 
        vuln: 'sql_inject', 
        payload: 'UNION_AUTH_OVERFLOW' 
      }
    };

    // Árbol de archivos virtual
    this.filesystem = {
      boot: {
        'kernel.sys': '0xDEADBEEF HACKWARS KERNEL v4.19-CORE [KERNEL SYSTEM INTEGRITY: CRITICAL]\nWARNING: Si este archivo es eliminado, el nodo sufrirá un Kernel Panic irreversible.'
      },
      etc: {
        passwd: 'root:x:0:0:root:/root:/bin/bash\nadmin:$6$jK82...$w9V4:1000:1000:admin:/home/admin:/bin/bash\nshadow:x:1001:1001::/var/shadow:/bin/false\n',
        hostname: this.hostname,
        issue: 'HackWars Network Virtual OS (v2.4 LTS)\n'
      },
      home: {
        admin: {
          'flag.txt': this.flag,
          'notas.txt': 'IMPORTANTE: No revelar la FLAG a intrusos. Si detectas escaneos SYN o inyecciones, usa firewall o kill PID.'
        }
      },
      var: {
        log: {
          syslog: ''
        }
      },
      root: {
        'readme.txt': 'Bienvenido al nodo de defensa y ataque HackWars.\nUsa "help" para ver la lista de comandos disponibles.'
      }
    };

    // Directorio actual por defecto
    this.currentPath = '/root';

    // Registro de procesos
    this.nextPid = 350;
    this.processes = [
      { pid: 1, name: 'systemd', cpu: 0, user: 'root', type: 'system' },
      { pid: 88, name: 'syslogd', cpu: 1, user: 'root', type: 'system' },
      { pid: 104, name: 'vsftpd', cpu: 1, user: 'ftp', type: 'service' },
      { pid: 112, name: 'sshd', cpu: 1, user: 'root', type: 'service' }
    ];

    // Logs del sistema
    this.syslog = [];
    this.addLog('INFO', `Sistema iniciado en interfaz eth0 (${this.virtualIp})`);
    this.addLog('INFO', `Demonio de red escuchando puertos 21, 22, 80`);

    // Seguimiento de atacante conectado
    this.connectedAttacker = null; // { attackerId, port, currentPath }
  }

  // Formato de hora local
  getTimestamp() {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  }

  // Añadir entrada al syslog
  addLog(level, message) {
    const entry = {
      timestamp: this.getTimestamp(),
      level: level.toUpperCase(), // 'INFO', 'WARN', 'ALERT', 'CRIT'
      message: message
    };
    this.syslog.push(entry);
    if (this.syslog.length > 80) {
      this.syslog.shift();
    }
    // Actualizar también /var/log/syslog en el filesystem virtual
    try {
      this.filesystem.var.log.syslog = this.syslog
        .map(e => `[${e.timestamp}] [${e.level}] ${e.message}`)
        .join('\n');
    } catch (_) {}
    return entry;
  }

  // Limpiar logs
  clearSyslog() {
    this.syslog = [];
    try {
      this.filesystem.var.log.syslog = '';
    } catch (_) {}
    this.addLog('INFO', 'Registro /var/log/syslog reiniciado por el administrador.');
  }

  // Recalcular CPU en base a procesos activos
  recalculateCpu() {
    const total = this.processes.reduce((acc, p) => acc + (p.cpu || 0), 0);
    this.resources.usedCpu = Math.min(100, Math.max(2, total));
    return this.resources.usedCpu;
  }

  // Añadir un nuevo proceso
  addProcess(name, cpu, user, type, cancelFn = null, details = {}) {
    const pid = this.nextPid++;
    const proc = {
      pid,
      name,
      cpu,
      user,
      type,
      cancelFn,
      details
    };
    this.processes.push(proc);
    this.recalculateCpu();
    return proc;
  }

  // Remover proceso al finalizar normalmente (SIN invocar cancelFn)
  removeProcess(pid) {
    const index = this.processes.findIndex(p => p.pid === parseInt(pid, 10));
    if (index === -1) return null;
    const proc = this.processes[index];
    proc.cancelFn = null; // Desactivar callback para evitar cancelación errónea
    this.processes.splice(index, 1);
    this.recalculateCpu();
    return proc;
  }

  // Matar proceso por PID (comando manual 'kill')
  killProcess(pid) {
    const index = this.processes.findIndex(p => p.pid === parseInt(pid, 10));
    if (index === -1) {
      return { success: false, message: `PID ${pid} no encontrado en la tabla de procesos.` };
    }

    const proc = this.processes[index];
    if (proc.type === 'system') {
      return { success: false, message: `Permiso denegado: No se puede terminar el proceso crítico del sistema (PID ${pid}).` };
    }

    // Remover primero de la lista para evitar recursión
    this.processes.splice(index, 1);
    this.recalculateCpu();

    // Si tiene función de cancelación asociada (ej: ataque entrante o parcheo), la ejecutamos
    if (typeof proc.cancelFn === 'function') {
      const fn = proc.cancelFn;
      proc.cancelFn = null;
      try {
        fn();
      } catch (err) {
        console.error('Error cancelando proceso:', err);
      }
    }

    this.addLog('WARN', `Proceso ${proc.name} (PID ${pid}) terminado con señal SIGKILL.`);
    return { success: true, message: `Proceso [${proc.name}] (PID ${pid}) terminado. Se liberaron ${proc.cpu}% de CPU.`, proc };
  }

  // Obtener lista limpia de procesos para el cliente
  getProcessList() {
    return this.processes.map(p => ({
      pid: p.pid,
      name: p.name,
      cpu: p.cpu,
      user: p.user,
      type: p.type
    }));
  }

  // Gestión de Firewall
  toggleFirewall(portNum, action) {
    const port = this.ports[portNum];
    if (!port) {
      return { success: false, message: `Error: Puerto ${portNum} inválido.` };
    }

    if (action === 'close') {
      if (!port.open) {
        return { success: false, message: `El puerto ${portNum} ya está cerrado.` };
      }

      // Máximo 2 puertos cerrados simultáneamente (requiere 25% CPU c/u)
      const closedCount = Object.values(this.ports).filter(p => !p.open).length;
      if (closedCount >= 2) {
        return { 
          success: false, 
          message: `Límite de firewall alcanzado: Solo se pueden cerrar un máximo de 2 puertos simultáneos (sobrecarga máx 50% CPU).` 
        };
      }

      port.open = false;
      // Proceso de firewall persistente que consume 25% CPU
      this.addProcess(`fw_rule_p${portNum}`, 25, 'iptables', 'firewall', null, { port: portNum });
      this.addLog('WARN', `Regla de Firewall aplicada: Puerto ${portNum} CERRADO (+25% CPU).`);

      let severedConnection = false;
      // Si el atacante estaba conectado o usando este puerto, se expulsa inmediatamente
      if (this.connectedAttacker && this.connectedAttacker.port === parseInt(portNum, 10)) {
        severedConnection = true;
        this.connectedAttacker = null;
        this.addLog('ALERT', `Conexión remota intrusa cortada abruptamente por cierre de puerto ${portNum}.`);
      }

      return { 
        success: true, 
        message: `Puerto ${portNum} (${port.service}) cerrado exitosamente. Sobrecarga de CPU: +25%.`, 
        severedConnection 
      };
    } else if (action === 'open') {
      if (port.open) {
        return { success: false, message: `El puerto ${portNum} ya está abierto.` };
      }

      port.open = true;
      // Remover proceso de firewall correspondiente
      const fwIndex = this.processes.findIndex(p => p.type === 'firewall' && p.details?.port === parseInt(portNum, 10));
      if (fwIndex !== -1) {
        this.processes.splice(fwIndex, 1);
        this.recalculateCpu();
      }

      this.addLog('INFO', `Regla de Firewall retirada: Puerto ${portNum} ABIERTO (-25% CPU liberada).`);
      return { 
        success: true, 
        message: `Puerto ${portNum} (${port.service}) abierto. 25% de CPU liberada.` 
      };
    } else {
      return { success: false, message: 'Acción de firewall inválida. Usa: firewall <puerto> <open|close>' };
    }
  }

  // Parchear servicio comprometido
  patchService(portNum) {
    const port = this.ports[portNum];
    if (!port) {
      return { success: false, message: `Puerto ${portNum} no existe.` };
    }

    port.compromised = false;
    // Generar un payload/vulnerabilidad endurecida nueva
    const salt = Math.random().toString(36).substring(2, 6).toUpperCase();
    port.version = `${port.service}-v${(Math.random() * 2 + 3).toFixed(1)}_sec`;
    port.vuln = `hardened_${salt.toLowerCase()}`;
    port.payload = `EXPLOIT_${salt}_PAYLOAD`;

    this.addLog('INFO', `Servicio en puerto ${portNum} parcheado y actualizado a versión ${port.version}. Vulnerabilidades previas mitigadas.`);
    return {
      success: true,
      message: `[PARCHE APLICADO] Servicio en puerto ${portNum} reconfigurado con éxito. Estado: NO COMPROMETIDO.`
    };
  }

  // Sistema de Archivos Virtual (Filesystem)
  normalizePath(currentPath, targetPath) {
    if (!targetPath) return currentPath;
    let combined = targetPath.startsWith('/') ? targetPath : `${currentPath}/${targetPath}`;
    const parts = combined.split('/').filter(p => p.length > 0 && p !== '.');
    const resolved = [];
    for (const p of parts) {
      if (p === '..') {
        if (resolved.length > 0) resolved.pop();
      } else {
        resolved.push(p);
      }
    }
    return '/' + resolved.join('/');
  }

  getNode(pathStr) {
    if (pathStr === '/' || pathStr === '') return this.filesystem;
    const parts = pathStr.split('/').filter(Boolean);
    let curr = this.filesystem;
    for (const p of parts) {
      if (typeof curr !== 'object' || curr === null || !(p in curr)) {
        return null;
      }
      curr = curr[p];
    }
    return curr;
  }

  listDirectory(currentPath, targetDir = '') {
    const resolvedPath = this.normalizePath(currentPath, targetDir);
    const node = this.getNode(resolvedPath);

    if (node === null) {
      return { success: false, message: `ls: no se puede acceder a '${targetDir}': No existe el archivo o el directorio` };
    }

    if (typeof node === 'string') {
      const name = resolvedPath.split('/').pop();
      return { 
        success: true, 
        resolvedPath, 
        entries: [{ name, isDir: false, size: node.length }] 
      };
    }

    const entries = Object.keys(node).map(name => {
      const isDir = typeof node[name] === 'object';
      const size = isDir ? 4096 : (typeof node[name] === 'string' ? node[name].length : 0);
      return { name, isDir, size };
    });

    return { success: true, resolvedPath, entries };
  }

  changeDirectory(currentPath, targetDir) {
    if (!targetDir || targetDir === '~') {
      return { success: true, newPath: '/root' };
    }
    const resolvedPath = this.normalizePath(currentPath, targetDir);
    const node = this.getNode(resolvedPath);

    if (node === null) {
      return { success: false, message: `cd: '${targetDir}': No existe el directorio` };
    }

    if (typeof node !== 'object') {
      return { success: false, message: `cd: '${targetDir}': No es un directorio` };
    }

    return { success: true, newPath: resolvedPath };
  }

  readFile(currentPath, filePath) {
    if (!filePath) {
      return { success: false, message: 'Uso: cat <archivo>' };
    }
    const resolvedPath = this.normalizePath(currentPath, filePath);
    const node = this.getNode(resolvedPath);

    if (node === null) {
      return { success: false, message: `cat: ${filePath}: No existe el archivo` };
    }

    if (typeof node === 'object') {
      return { success: false, message: `cat: ${filePath}: Es un directorio` };
    }

    return { success: true, content: node };
  }

  deleteFile(currentPath, filePath) {
    if (!filePath) {
      return { success: false, message: 'Uso: rm <archivo>' };
    }
    const resolvedPath = this.normalizePath(currentPath, filePath);
    const parts = resolvedPath.split('/').filter(Boolean);
    if (parts.length === 0) {
      return { success: false, message: 'rm: no se puede eliminar la raíz /' };
    }

    const fileName = parts.pop();
    const parentPath = '/' + parts.join('/');
    const parentNode = this.getNode(parentPath);

    if (!parentNode || typeof parentNode !== 'object' || !(fileName in parentNode)) {
      return { success: false, message: `rm: no se puede borrar '${filePath}': No existe el archivo` };
    }

    if (typeof parentNode[fileName] === 'object') {
      return { success: false, message: `rm: no se puede borrar '${filePath}': Es un directorio (usa rm solo para archivos)` };
    }

    delete parentNode[fileName];

    // Verificar si se eliminó el kernel del sistema
    const isKernel = resolvedPath === '/boot/kernel.sys';
    if (isKernel) {
      this.addLog('CRIT', `[PANIC] /boot/kernel.sys fue eliminado. Integridad del sistema destruida.`);
      return { 
        success: true, 
        message: `Archivo '${filePath}' eliminado. [ALERTA: KERNEL PANIC EN HOST DESTINO!]`,
        kernelPanic: true 
      };
    }

    this.addLog('WARN', `Archivo ${resolvedPath} eliminado.`);
    return { success: true, message: `Archivo '${filePath}' eliminado con éxito.` };
  }

  // Exportar estado sanitizado para el cliente
  toClientState() {
    return {
      virtualIp: this.virtualIp,
      hostname: this.hostname,
      resources: { ...this.resources },
      ports: JSON.parse(JSON.stringify(this.ports)),
      processes: this.getProcessList(),
      syslog: [...this.syslog],
      currentPath: this.currentPath
    };
  }
}

module.exports = VirtualMachine;
