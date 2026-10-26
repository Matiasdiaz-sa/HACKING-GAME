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

    // Configuración calibrada de comportamiento según la dificultad
    this.config = this.getConfig(difficulty);
  }

  getConfig(diff) {
    switch (diff) {
      case 'easy':
        return {
          tickSec: 10,
          reconDelay: 20,
          scanDelay: 45,
          exploitDelay: 70,
          attackChance: 0.35,
          canDestroyKernel: false,
          defenseChance: 0.10,
          trollingTypes: ['popup', 'say']
        };
      case 'hard':
        return {
          tickSec: 4,
          reconDelay: 6,
          scanDelay: 12,
          exploitDelay: 18,
          attackChance: 0.85,
          canDestroyKernel: true,
          kernelDestroyDelay: 45,
          defenseChance: 0.70,
          trollingTypes: ['freeze', 'invert', 'popup', 'chaos', 'glitch']
        };
      case 'nightmare':
        return {
          tickSec: 2.5,
          reconDelay: 3,
          scanDelay: 7,
          exploitDelay: 12,
          attackChance: 0.95,
          canDestroyKernel: true,
          kernelDestroyDelay: 28,
          defenseChance: 0.90,
          trollingTypes: ['freeze', 'invert', 'popup', 'chaos', 'glitch']
        };
      case 'medium':
      default:
        return {
          tickSec: 6,
          reconDelay: 10,
          scanDelay: 22,
          exploitDelay: 35,
          attackChance: 0.65,
          canDestroyKernel: true,
          kernelDestroyDelay: 75,
          defenseChance: 0.35,
          trollingTypes: ['freeze', 'invert', 'popup', 'glitch']
        };
    }
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.isStopped = false;
    this.elapsedSeconds = 0;

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

    // 1. Fase de Defensa Reactiva (prioridad táctica)
    this.performDefense(botPlayer, opponent);

    // 2. Fase de Reconocimiento de Subred
    if (this.elapsedSeconds >= this.config.reconDelay && !this.scannedNet) {
      this.scannedNet = true;
      this.room.handleCommand(this.botSocketId, 'netdiscover');
      return;
    }

    // 3. Fase de Escaneo de Puertos
    if (this.elapsedSeconds >= this.config.scanDelay && !this.scannedPorts) {
      this.scannedPorts = true;
      this.room.handleCommand(this.botSocketId, `nmap ${this.targetIp}`);
      return;
    }

    // 4. Fase de Explotación Perimetral
    if (this.elapsedSeconds >= this.config.exploitDelay && !this.compromised) {
      if (Math.random() < this.config.attackChance) {
        // Encontrar un puerto abierto del jugador
        const victimPort = opponent.vm.ports.get(21) || opponent.vm.ports.get(80) || opponent.vm.ports.get(22);
        if (victimPort && victimPort.open) {
          this.room.handleCommand(this.botSocketId, `exploit ${this.targetIp} ${victimPort.port}`);
          setTimeout(() => {
            if (victimPort.compromised && !this.isStopped) {
              this.compromised = true;
            }
          }, 8500);
          return;
        }
      }
    }

    // 5. Fase de Conexión y Shell Remota
    if (this.compromised && !this.connected) {
      this.room.handleCommand(this.botSocketId, `connect ${this.targetIp}`);
      this.connected = true;
      return;
    }

    if (this.connected) {
      // Destrucción del Kernel para victoria (en dificultades que lo permiten)
      if (this.config.canDestroyKernel && this.elapsedSeconds >= this.config.kernelDestroyDelay) {
        this.room.handleCommand(this.botSocketId, 'rm /boot/kernel.sys');
        return;
      }

      // Inyección de Troyanos Psicológicos
      if (Math.random() < this.config.attackChance) {
        const types = this.config.trollingTypes;
        const chosen = types[Math.floor(Math.random() * types.length)];
        if (chosen === 'popup') {
          this.room.handleCommand(this.botSocketId, `popup [ALERTA] ${botPlayer.username} ha tomado el control de tu terminal!`);
        } else if (chosen === 'say') {
          this.room.handleCommand(this.botSocketId, `say Auditando tus procesos en memoria...`);
        } else {
          this.room.handleCommand(this.botSocketId, chosen);
        }
      }
    }
  }

  performDefense(botPlayer, opponent) {
    if (Math.random() > this.config.defenseChance) return;

    // A. Neutralizar exploit entrante con kill
    for (const [pid, proc] of botPlayer.vm.processes.entries()) {
      if (proc.type === 'incoming_attack') {
        this.room.handleCommand(this.botSocketId, `kill ${pid}`);
        return;
      }
    }

    // B. Mitigar puertos comprometidos cerrándolos con firewall
    for (const [portNum, portInfo] of botPlayer.vm.ports.entries()) {
      if (portInfo.compromised && portInfo.open) {
        this.room.handleCommand(this.botSocketId, `firewall block ${portNum}`);
        return;
      }
    }
  }
}

module.exports = BotAI;
