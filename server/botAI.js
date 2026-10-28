// ==========================================================================
// HACKWARS // AUTONOMOUS CYBER-BOT ENGINE (SOLO VS IA CON DIFICULTADES)
// ==========================================================================

class BotAI {
  constructor(room, botSocketId, difficulty = 'medium') {
    this.room = room;
    this.botSocketId = botSocketId;
    this.difficulty = difficulty; // 'easy', 'medium', 'hard', 'nightmare'
    this.timer = null;
    this.elapsedSeconds = 0;
    this.targetIp = null;
    this.compromised = false;
    this.connected = false;
    this.scannedNet = false;
    this.scannedPorts = false;
    this.isStopped = false;
    this.isExploiting = false;
    this.defenseCooldownUntil = 0;
    this.connectedSeconds = 0;

    // Configuración calibrada de comportamiento según la dificultad
    this.config = this.getConfig(difficulty);
  }

  getConfig(diff) {
    switch (diff) {
      case 'easy':
        return {
          tickSec: 4,
          reconDelay: 6,
          scanDelay: 14,
          exploitDelay: 22,
          attackChance: 0.60,
          reactionDelaySec: 6.0,
          defenseChance: 0.15,
          defenseCooldownSec: 10,
          canDestroyKernel: false,
          kernelDestroyDelay: 999,
          trollingTypes: ['popup', 'say']
        };
      case 'hard':
        return {
          tickSec: 2.5,
          reconDelay: 3,
          scanDelay: 6,
          exploitDelay: 10,
          attackChance: 0.90,
          reactionDelaySec: 4.2,
          defenseChance: 0.45,
          defenseCooldownSec: 5,
          canDestroyKernel: true,
          kernelDestroyDelay: 28,
          trollingTypes: ['freeze', 'invert', 'popup', 'chaos', 'glitch', 'say']
        };
      case 'nightmare':
        return {
          tickSec: 2,
          reconDelay: 2,
          scanDelay: 4,
          exploitDelay: 7,
          attackChance: 0.98,
          reactionDelaySec: 3.8, // Margen de reacción antes del primer intento de defensa
          defenseChance: 0.55,   // 55% de probabilidad de reaccionar (permite al jugador vulnerar al bot 45% de las veces)
          defenseCooldownSec: 4,
          canDestroyKernel: true,
          kernelDestroyDelay: 18, // Si el jugador no corta la intrusión en 18s, el bot causa Kernel Panic
          trollingTypes: ['freeze', 'invert', 'popup', 'chaos', 'glitch', 'say']
        };
      case 'medium':
      default:
        return {
          tickSec: 3,
          reconDelay: 4,
          scanDelay: 9,
          exploitDelay: 15,
          attackChance: 0.75,
          reactionDelaySec: 5.0,
          defenseChance: 0.28,
          defenseCooldownSec: 7,
          canDestroyKernel: true,
          kernelDestroyDelay: 45,
          trollingTypes: ['freeze', 'invert', 'popup', 'glitch', 'say']
        };
    }
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.isStopped = false;
    this.elapsedSeconds = 0;
    this.connectedSeconds = 0;
    this.isExploiting = false;

    this.timer = setInterval(() => {
      this.tick();
    }, this.config.tickSec * 1000);
  }

  stop() {
    this.isStopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  tick() {
    try {
      if (this.isStopped || !this.room || this.room.status !== 'PLAYING') {
        this.stop();
        return;
      }

      this.elapsedSeconds += this.config.tickSec;

      const botPlayer = this.room.getPlayer(this.botSocketId);
      const opponent = this.room.getOpponent(this.botSocketId);
      if (!botPlayer || !opponent) {
        this.stop();
        return;
      }

      this.targetIp = opponent.vm.virtualIp;

      // 1. Sincronización de estado de la conexión remota
      // Si el oponente cerró el puerto con firewall o lo parcheó, la conexión remota del bot se corta
      const anyBreachedOpen = Object.values(opponent.vm.ports || {}).some(p => p.compromised && p.open);
      if (!anyBreachedOpen) {
        this.connected = false;
        botPlayer.remoteHostIp = null;
        this.connectedSeconds = 0;
      }
      const anyBreached = Object.values(opponent.vm.ports || {}).some(p => p.compromised);
      this.compromised = anyBreached;

      // 2. Fase de Defensa Reactiva (Balanceada con latencia humana simulada)
      this.performDefense(botPlayer, opponent);

      // 3. Fase de Reconocimiento de Subred
      if (this.elapsedSeconds >= this.config.reconDelay && !this.scannedNet) {
        this.scannedNet = true;
        this.room.handleCommand(this.botSocketId, 'netdiscover');
        return;
      }

      // 4. Fase de Escaneo de Puertos
      if (this.elapsedSeconds >= this.config.scanDelay && !this.scannedPorts) {
        this.scannedPorts = true;
        this.room.handleCommand(this.botSocketId, `nmap ${this.targetIp}`);
        return;
      }

      // 5. Fase de Explotación Perimetral Ofensiva
      if (this.elapsedSeconds >= this.config.exploitDelay && !this.compromised && !this.isExploiting) {
        // Encontrar puertos abiertos no comprometidos del oponente
        const openPorts = Object.values(opponent.vm.ports || {}).filter(p => p.open && !p.compromised);
        if (openPorts.length > 0 && Math.random() < this.config.attackChance) {
          // Priorizar puerto 21 (FTP) o 80 (HTTP) si están disponibles
          const targetPort = openPorts.find(p => p.port === 21) || openPorts.find(p => p.port === 80) || openPorts[0];
          if (targetPort && targetPort.payload) {
            this.isExploiting = true;
            // Pasar targetIp, puerto y PAYLOAD requerido por el motor
            this.room.handleCommand(this.botSocketId, `exploit ${this.targetIp} ${targetPort.port} ${targetPort.payload}`);
            
            setTimeout(() => {
              this.isExploiting = false;
              if (this.isStopped) return;
              if (targetPort.compromised) {
                this.compromised = true;
              }
            }, 8400);
            return;
          }
        }
      }

      // 6. Fase de Conexión y Apertura de Shell Remota
      if (this.compromised && !this.connected) {
        const canConnect = Object.values(opponent.vm.ports || {}).some(p => p.compromised && p.open);
        if (canConnect) {
          this.room.handleCommand(this.botSocketId, `connect ${this.targetIp}`);
          this.connected = true;
          this.connectedSeconds = 0;
          return;
        }
      }

      // 7. Fase Ofensiva en Shell Remota (Troyanos Psicológicos y Sabotaje)
      if (this.connected && botPlayer.remoteHostIp === this.targetIp) {
        this.connectedSeconds += this.config.tickSec;

        // Condición de Victoria: Destrucción del Kernel si el rival no neutraliza la intrusión
        if (this.config.canDestroyKernel && this.connectedSeconds >= this.config.kernelDestroyDelay) {
          this.room.handleCommand(this.botSocketId, 'rm /boot/kernel.sys');
          return;
        }

        // Inyección ofensiva de troyanos psicológicos
        if (Math.random() < this.config.attackChance) {
          const types = this.config.trollingTypes;
          const chosen = types[Math.floor(Math.random() * types.length)];
          if (chosen === 'popup') {
            this.room.handleCommand(this.botSocketId, `popup [ALERTA] ${botPlayer.username} ha tomado el control de tu terminal!`);
          } else if (chosen === 'say') {
            const taunts = [
              `[SISTEMA BREACHEADO] Acceso root verificado. Neutraliza la intrusión o perderás.`,
              `[CYBER-ALERT] Monitoreando procesos activos en tu memoria...`,
              `[WARNING] Tu firewall perimetral ha colapsado.`
            ];
            const msg = taunts[Math.floor(Math.random() * taunts.length)];
            this.room.handleCommand(this.botSocketId, `say ${msg}`);
          } else {
            this.room.handleCommand(this.botSocketId, chosen);
          }
        }
      }
    } catch (err) {
      console.error('[BOT_AI] Error durante ciclo de ejecución:', err);
    }
  }

  performDefense(botPlayer, opponent) {
    const now = Date.now();
    if (now < this.defenseCooldownUntil) return;

    // A. Neutralizar exploit entrante con reacción balanceada (un solo intento por ataque)
    if (Array.isArray(botPlayer.vm.processes)) {
      const incomingAttack = botPlayer.vm.processes.find(p => p.type === 'incoming_attack');
      if (incomingAttack) {
        if (!incomingAttack._detectedAt) {
          incomingAttack._detectedAt = now;
        }

        const elapsedMs = now - incomingAttack._detectedAt;
        const requiredDelayMs = this.config.reactionDelaySec * 1000;

        // Solo evalúa la defensa trascurrido el tiempo de reacción configurado
        if (elapsedMs >= requiredDelayMs && !incomingAttack._defenseAttempted) {
          incomingAttack._defenseAttempted = true; // Se evalúa una sola vez para no bloquear continuamente

          if (Math.random() < this.config.defenseChance) {
            // El bot reacciona y aborta el ataque con SIGKILL
            this.room.handleCommand(this.botSocketId, `kill ${incomingAttack.pid}`);
            this.defenseCooldownUntil = now + (this.config.defenseCooldownSec * 1000);
            return;
          } else {
            // El bot falló la ventana de defensa: el exploit del jugador entrará con éxito
            this.defenseCooldownUntil = now + 3000;
          }
        }
      }
    }

    // B. Mitigar puertos comprometidos del bot (Parchear o cerrar)
    if (botPlayer.vm.ports) {
      for (const [portNum, portInfo] of Object.entries(botPlayer.vm.ports)) {
        if (portInfo.compromised) {
          // Si tiene CPU libre (<= 70%), recompila y parchea el servicio
          if (botPlayer.vm.resources.usedCpu <= 70) {
            this.room.handleCommand(this.botSocketId, `patch ${portNum}`);
            this.defenseCooldownUntil = now + 6500;
            return;
          } else if (portInfo.open) {
            // Si la CPU está sobrecargada, cierra el puerto con firewall
            this.room.handleCommand(this.botSocketId, `firewall ${portNum} close`);
            this.defenseCooldownUntil = now + 4000;
            return;
          }
        }
      }
    }
  }
}

module.exports = BotAI;
