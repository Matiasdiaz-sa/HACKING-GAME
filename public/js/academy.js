// ==========================================================================
// HACKWARS ACADEMY // STORY MODE & INTERACTIVE CYBER-MENTOR ENGINE
// Sistema de aprendizaje progresivo y lecciones guiadas en terminal
// ==========================================================================

class HackWarsAcademy {
  constructor() {
    this.storageKey = 'hackwars_academy_progress';
    this.progress = this.loadProgress();
    this.activeSession = null; // { moduleId, stepIndex, isComplete }
    
    this.modules = [
      {
        id: 'mod_1',
        num: 1,
        title: 'Fundamentos de Linux & Navegación (FHS)',
        shortTitle: 'Linux & FHS',
        desc: 'Domina los comandos esenciales del kernel para moverte en el árbol de directorios e inspeccionar archivos confidenciales.',
        icon: '🐧',
        reward: 50,
        badge: 'CADETE LINUX',
        steps: [
          {
            id: 'step_1_1',
            task: 'Verifica tu identidad y privilegios en el sistema ejecutando whoami.',
            explanation: 'En ciberseguridad, confirmar si posees privilegios de superusuario (root) determina el alcance de lo que puedes ejecutar en la máquina.',
            hint: 'Escribe whoami y presiona Enter.',
            check: (cmd) => cmd.trim().toLowerCase() === 'whoami'
          },
          {
            id: 'step_1_2',
            task: 'Descubre en qué ruta del sistema te encuentras con pwd.',
            explanation: 'pwd (Print Working Directory) imprime la ruta absoluta dentro del estándar de jerarquía de archivos (FHS) de Linux.',
            hint: 'Escribe pwd y presiona Enter.',
            check: (cmd) => cmd.trim().toLowerCase() === 'pwd'
          },
          {
            id: 'step_1_3',
            task: 'Lista el contenido del directorio actual ejecutando ls.',
            explanation: 'ls enumera los archivos y subcarpetas presentes en tu ubicación actual.',
            hint: 'Escribe ls y presiona Enter.',
            check: (cmd) => cmd.trim().toLowerCase().startsWith('ls')
          },
          {
            id: 'step_1_4',
            task: 'Lee el archivo de bienvenida ejecutando cat readme.txt.',
            explanation: 'cat (concatenate) vuelca el contenido de un archivo en la terminal. Esencial para exfiltrar credenciales y notas.',
            hint: 'Escribe cat readme.txt y presiona Enter.',
            check: (cmd) => {
              const c = cmd.trim().toLowerCase();
              return c === 'cat readme.txt' || c === 'cat /root/readme.txt';
            }
          },
          {
            id: 'step_1_5',
            task: 'Navega al directorio de configuración del sistema ejecutando cd /etc.',
            explanation: 'La carpeta /etc almacena las configuraciones globales, servicios y listas de usuarios del sistema operativo.',
            hint: 'Escribe cd /etc y presiona Enter.',
            check: (cmd) => {
              const c = cmd.trim().toLowerCase();
              return c === 'cd /etc' || c === 'cd etc';
            }
          }
        ]
      },
      {
        id: 'mod_2',
        num: 2,
        title: 'Redes & Reconocimiento de Subred',
        shortTitle: 'Redes & Recon',
        desc: 'Comprende el direccionamiento IP en subredes /24 y mapea los nodos vivos sin alertar al rival.',
        icon: '🌐',
        reward: 75,
        badge: 'OPERADOR DE RED',
        steps: [
          {
            id: 'step_2_1',
            task: 'Consulta tu dirección IP y máscara de subred ejecutando ifconfig.',
            explanation: 'ifconfig muestra las interfaces de red activas. La máscara /24 (255.255.255.0) indica que los primeros 3 octetos definen la subred local (10.13.37.0).',
            hint: 'Escribe ifconfig o ip y presiona Enter.',
            check: (cmd) => {
              const c = cmd.trim().toLowerCase();
              return c === 'ifconfig' || c.startsWith('ip');
            }
          },
          {
            id: 'step_2_2',
            task: 'Escanea la subred para detectar nodos activos ejecutando netdiscover.',
            explanation: 'netdiscover emite peticiones ARP en el segmento de red para descubrir hosts y computadoras conectadas.',
            hint: 'Escribe netdiscover y presiona Enter.',
            check: (cmd) => cmd.trim().toLowerCase().startsWith('netdiscover')
          },
          {
            id: 'step_2_3',
            task: 'Verifica la latencia y respuesta con el nodo rival ejecutando ping <ip_objetivo>.',
            explanation: 'ping envía paquetes ICMP Echo Request para calcular el tiempo de respuesta y comprobar si el objetivo está accesible.',
            hint: 'Escribe ping seguido de la IP que encontraste en netdiscover (ej: ping 10.13.37.10).',
            check: (cmd) => cmd.trim().toLowerCase().startsWith('ping')
          }
        ]
      },
      {
        id: 'mod_3',
        num: 3,
        title: 'Escaneo de Puertos & Detección de CVEs',
        shortTitle: 'Nmap & CVEs',
        desc: 'Identifica servicios abiertos y realiza banner grabbing para detectar vulnerabilidades históricas reales.',
        icon: '🔍',
        reward: 100,
        badge: 'AUDITOR DE VULNERABILIDADES',
        steps: [
          {
            id: 'step_3_1',
            task: 'Realiza un escaneo de puertos TCP abiertos ejecutando nmap <ip_objetivo>.',
            explanation: 'nmap audita los puertos de red del host para averiguar qué demonios (FTP, SSH, HTTP) están escuchando conexiones.',
            hint: 'Escribe nmap seguido de la IP objetivo (ej: nmap 10.13.37.10).',
            check: (cmd) => cmd.trim().toLowerCase().startsWith('nmap')
          },
          {
            id: 'step_3_2',
            task: 'Haz Banner Grabbing en el puerto FTP ejecutando probe <ip_objetivo> 21.',
            explanation: 'probe se conecta al socket y lee el texto de bienvenida. En vsftpd-2.3.4, revela la presencia de una backdoor histórica real (CVE-2011-2523).',
            hint: 'Escribe probe <ip_objetivo> 21 (ej: probe 10.13.37.10 21).',
            check: (cmd) => {
              const parts = cmd.trim().toLowerCase().split(/\s+/);
              return parts[0] === 'probe' && parts.includes('21');
            }
          },
          {
            id: 'step_3_3',
            task: 'Inspecciona también el servicio web ejecutando probe <ip_objetivo> 80.',
            explanation: 'Identificar múltiples vectores de ataque te permite elegir la ruta más rápida o devastadora según la defensa rival.',
            hint: 'Escribe probe <ip_objetivo> 80 (ej: probe 10.13.37.10 80).',
            check: (cmd) => {
              const parts = cmd.trim().toLowerCase().split(/\s+/);
              return parts[0] === 'probe' && parts.includes('80');
            }
          }
        ]
      },
      {
        id: 'mod_4',
        num: 4,
        title: 'Infiltración, Explotación & Guerra Psicológica',
        shortTitle: 'Explotación & Pwn',
        desc: 'Dispara exploits perimetrales, abre una sesión remota e inyecta troyanos desestabilizadores.',
        icon: '💥',
        reward: 150,
        badge: 'INFILTRADOR CIBERNÉTICO',
        steps: [
          {
            id: 'step_4_1',
            task: 'Dispara el exploit perimetral contra el puerto 21 ejecutando exploit <ip_objetivo> 21.',
            explanation: 'El exploit aprovecha la vulnerabilidad para inyectar una shell y abrir una puerta trasera en el sistema objetivo.',
            hint: 'Escribe exploit <ip_objetivo> 21 (ej: exploit 10.13.37.10 21).',
            check: (cmd) => {
              const parts = cmd.trim().toLowerCase().split(/\s+/);
              return parts[0] === 'exploit';
            }
          },
          {
            id: 'step_4_2',
            task: 'Establece una sesión interactiva remota en el objetivo con connect <ip_objetivo>.',
            explanation: 'connect enlaza tu terminal directamente con la shell remota de la máquina comprometida con privilegios root.',
            hint: 'Escribe connect seguido de la IP objetivo (ej: connect 10.13.37.10).',
            check: (cmd) => cmd.trim().toLowerCase().startsWith('connect')
          },
          {
            id: 'step_4_3',
            task: 'Inyecta un payload de trolling psicológico ejecutando freeze o invert.',
            explanation: 'Los troyanos psicológicos congelan la terminal del rival o rotan su monitor 180° para que pierda el control táctico.',
            hint: 'Escribe freeze o invert y presiona Enter.',
            check: (cmd) => {
              const c = cmd.trim().toLowerCase();
              return c.startsWith('freeze') || c.startsWith('invert') || c.startsWith('glitch') || c.startsWith('popup') || c.startsWith('chaos');
            }
          },
          {
            id: 'step_4_4',
            task: 'Destruye el núcleo del sistema rival ejecutando rm /boot/kernel.sys.',
            explanation: 'Borrar el archivo crítico de arranque provoca un Kernel Panic irreversible en la máquina enemiga, logrando la victoria inmediata.',
            hint: 'Escribe rm /boot/kernel.sys y presiona Enter.',
            check: (cmd) => {
              const c = cmd.trim().toLowerCase();
              return c.includes('rm') && (c.includes('kernel.sys') || c.includes('/boot/kernel.sys'));
            }
          }
        ]
      },
      {
        id: 'mod_5',
        num: 5,
        title: 'Defensa Activa & Mitigación (Blue Teaming)',
        shortTitle: 'Blue Team & Mitigación',
        desc: 'Analiza registros de auditoría, rastrea procesos maliciosos en memoria y blinda el firewall.',
        icon: '🛡️',
        reward: 200,
        badge: 'ESPECIALISTA BLUE TEAM',
        steps: [
          {
            id: 'step_5_1',
            task: 'Audita los eventos recientes del sistema ejecutando cat /var/log/syslog.',
            explanation: 'Los registros en /var/log/syslog alertan sobre intentos de intrusión, peticiones sospechosas y malware inyectado.',
            hint: 'Escribe cat /var/log/syslog y presiona Enter.',
            check: (cmd) => {
              const c = cmd.trim().toLowerCase();
              return c.includes('cat') && c.includes('syslog');
            }
          },
          {
            id: 'step_5_2',
            task: 'Inspecciona los procesos activos en memoria ejecutando ps.',
            explanation: 'ps lista los procesos en ejecución y sus Process IDs (PID) para rastrear troyanos o conexiones no autorizadas.',
            hint: 'Escribe ps y presiona Enter.',
            check: (cmd) => cmd.trim().toLowerCase() === 'ps'
          },
          {
            id: 'step_5_3',
            task: 'Neutraliza un proceso invasor ejecutando kill <PID>.',
            explanation: 'El comando kill despacha una señal de terminación forzada (SIGKILL) al proceso para erradicar el malware de RAM.',
            hint: 'Escribe kill seguido de cualquier PID listado (por ejemplo: kill 105 o kill 201).',
            check: (cmd) => cmd.trim().toLowerCase().startsWith('kill')
          },
          {
            id: 'step_5_4',
            task: 'Cierra el puerto perimetral ejecutando firewall block 21.',
            explanation: 'La segmentación perimetral con firewall bloquea paquetes en puertos vulnerables, impidiendo re-infecciones.',
            hint: 'Escribe firewall block 21 y presiona Enter.',
            check: (cmd) => {
              const c = cmd.trim().toLowerCase();
              return c.startsWith('firewall') && (c.includes('block') || c.includes('close') || c.includes('21'));
            }
          }
        ]
      }
    ];

    this.init();
  }

  loadProgress() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) return JSON.parse(data);
    } catch (_) {}

    return {
      unlockedModules: ['mod_1'],
      completedModules: [],
      completedSteps: {}
    };
  }

  saveProgress() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (_) {}
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Abrir modal de Academia desde Header
    const btnHeader = document.getElementById('btn-header-academy');
    if (btnHeader) {
      btnHeader.addEventListener('click', () => this.openModal());
    }

    // Abrir modal de Academia desde el Lobby
    const btnLobby = document.getElementById('btn-open-academy');
    if (btnLobby) {
      btnLobby.addEventListener('click', () => this.openModal());
    }

    // Cerrar modal
    const btnClose = document.getElementById('btn-close-academy');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeModal());
    }
    const backdrop = document.querySelector('#modal-academy .modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeModal());
    }

    // Botones del Mentor HUD
    const btnHint = document.getElementById('btn-mentor-hint');
    if (btnHint) {
      btnHint.addEventListener('click', () => this.toggleHint());
    }

    const btnExit = document.getElementById('btn-exit-academy');
    if (btnExit) {
      btnExit.addEventListener('click', () => this.exitLesson());
    }
  }

  openModal() {
    const modal = document.getElementById('modal-academy');
    if (!modal) return;
    this.renderModal();
    modal.style.display = 'flex';
    if (window.cyberAudio) window.cyberAudio.playSuccess();
  }

  closeModal() {
    const modal = document.getElementById('modal-academy');
    if (modal) modal.style.display = 'none';
  }

  renderModal() {
    const grid = document.getElementById('academy-modules-grid');
    const progText = document.getElementById('academy-progress-text');
    const progFill = document.getElementById('academy-progress-fill');
    if (!grid) return;

    const totalMods = this.modules.length;
    const completedCount = this.progress.completedModules.length;
    const pct = Math.round((completedCount / totalMods) * 100);

    if (progText) progText.textContent = `${completedCount}/${totalMods} Módulos Completados (${pct}%)`;
    if (progFill) progFill.style.width = `${pct}%`;

    grid.innerHTML = this.modules.map((mod) => {
      const isCompleted = this.progress.completedModules.includes(mod.id);
      const isUnlocked = this.progress.unlockedModules.includes(mod.id) || isCompleted;
      const statusClass = isCompleted ? 'completed' : (isUnlocked ? 'active' : 'locked');

      let badgeHtml = '';
      let actionBtnHtml = '';

      if (isCompleted) {
        badgeHtml = '<span class="mod-status-badge badge-done">✓ CUMPLIDO</span>';
        actionBtnHtml = `<button class="cyber-btn btn-sm btn-academy-start" onclick="window.hackWarsAcademy.startLesson('${mod.id}')">REPASAR MÓDULO</button>`;
      } else if (isUnlocked) {
        badgeHtml = '<span class="mod-status-badge badge-active">⚡ DISPONIBLE</span>';
        actionBtnHtml = `<button class="cyber-btn btn-sm btn-primary btn-academy-start" onclick="window.hackWarsAcademy.startLesson('${mod.id}')">INICIAR LECCIÓN ▶</button>`;
      } else {
        badgeHtml = '<span class="mod-status-badge badge-locked">🔒 BLOQUEADO</span>';
        actionBtnHtml = `<button class="cyber-btn btn-sm btn-secondary" disabled style="opacity: 0.5;">BLOQUEADO</button>`;
      }

      return `
        <div class="academy-mod-card ${statusClass}">
          <div class="mod-card-top">
            <span class="mod-icon">${mod.icon}</span>
            <div class="mod-meta">
              <span class="mod-tag">MÓDULO ${mod.num} // ${mod.badge}</span>
              <h3 class="mod-title">${mod.title}</h3>
            </div>
          </div>
          <p class="mod-desc">${mod.desc}</p>
          <div class="mod-card-footer">
            <div class="mod-reward">
              <span>RECOMPENSA:</span>
              <strong style="color: var(--color-amber);">+${mod.reward} ฿</strong>
            </div>
            ${badgeHtml}
          </div>
          <div class="mod-card-action">
            ${actionBtnHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  startLesson(moduleId) {
    const mod = this.modules.find(m => m.id === moduleId);
    if (!mod) return;

    this.activeSession = {
      moduleId: mod.id,
      stepIndex: 0,
      isComplete: false
    };

    this.closeModal();

    // Iniciar partida sandbox local con bot pasivo
    const aliasInput = document.getElementById('input-nickname');
    const username = (aliasInput && aliasInput.value.trim()) || localStorage.getItem('hackwars_alias') || 'Hacker_Cadete';
    
    // Iniciar el motor en modo práctica/academia
    const socket = window.hackWarsSocket || (window.io && window.io());
    if (socket) {
      socket.emit('start_bot_game', { username });
    }

    // Configurar y mostrar el HUD del Cyber-Mentor
    setTimeout(() => {
      this.renderMentorHud();
    }, 450);
  }

  renderMentorHud() {
    if (!this.activeSession) return;
    const hud = document.getElementById('academy-mentor-hud');
    if (!hud) return;

    const mod = this.modules.find(m => m.id === this.activeSession.moduleId);
    if (!mod) return;

    const step = mod.steps[this.activeSession.stepIndex];
    if (!step) return;

    const modTag = document.getElementById('mentor-module-tag');
    const stepTag = document.getElementById('mentor-step-tag');
    const taskText = document.getElementById('mentor-task-text');
    const expText = document.getElementById('mentor-explanation-text');
    const hintBox = document.getElementById('mentor-hint-box');

    if (modTag) modTag.textContent = `MÓDULO ${mod.num}: ${mod.shortTitle.toUpperCase()}`;
    if (stepTag) stepTag.textContent = `PASO ${this.activeSession.stepIndex + 1}/${mod.steps.length}`;
    if (taskText) taskText.textContent = step.task;
    if (expText) expText.textContent = step.explanation;
    if (hintBox) {
      hintBox.textContent = `💡 SUGERENCIA: ${step.hint}`;
      hintBox.style.display = 'none';
    }

    hud.classList.remove('success-pulse');
    hud.style.display = 'flex';
  }

  toggleHint() {
    const hintBox = document.getElementById('mentor-hint-box');
    if (hintBox) {
      const isHidden = hintBox.style.display === 'none';
      hintBox.style.display = isHidden ? 'block' : 'none';
      if (window.cyberAudio) window.cyberAudio.playKey();
    }
  }

  exitLesson() {
    const hud = document.getElementById('academy-mentor-hud');
    if (hud) hud.style.display = 'none';
    this.activeSession = null;
    
    // Notificar en consola
    if (typeof window.printToTerminal === 'function') {
      window.printToTerminal('\n[!] Sesión de Academia finalizada por el usuario.\n', 'warning');
    }
  }

  handleCommand(cmdLine) {
    if (!this.activeSession || this.activeSession.isComplete) return;

    const mod = this.modules.find(m => m.id === this.activeSession.moduleId);
    if (!mod) return;

    const currentStep = mod.steps[this.activeSession.stepIndex];
    if (!currentStep) return;

    // Verificar si el comando ejecutado cumple el objetivo del paso
    if (currentStep.check(cmdLine)) {
      this.onStepSuccess(mod, currentStep);
    }
  }

  onStepSuccess(mod, step) {
    if (window.cyberAudio) window.cyberAudio.playSuccess();

    const hud = document.getElementById('academy-mentor-hud');
    if (hud) hud.classList.add('success-pulse');

    // Imprimir felicitación en terminal
    if (typeof window.printToTerminal === 'function') {
      window.printToTerminal(`\n[CYBER-MENTOR] ✔ ¡Excelente! Paso ${this.activeSession.stepIndex + 1} completado con éxito.\n`, 'success');
    }

    setTimeout(() => {
      this.advanceStep(mod);
    }, 900);
  }

  advanceStep(mod) {
    this.activeSession.stepIndex++;

    if (this.activeSession.stepIndex >= mod.steps.length) {
      this.completeModule(mod);
    } else {
      this.renderMentorHud();
    }
  }

  completeModule(mod) {
    this.activeSession.isComplete = true;

    // Guardar módulo como completado
    if (!this.progress.completedModules.includes(mod.id)) {
      this.progress.completedModules.push(mod.id);
    }

    // Desbloquear siguiente módulo
    const nextModIndex = this.modules.findIndex(m => m.id === mod.id) + 1;
    if (nextModIndex < this.modules.length) {
      const nextMod = this.modules[nextModIndex];
      if (!this.progress.unlockedModules.includes(nextMod.id)) {
        this.progress.unlockedModules.push(nextMod.id);
      }
    }

    this.saveProgress();

    // Recompensar con Bytecoins
    if (window.hackWarsEconomy) {
      window.hackWarsEconomy.addBytecoins(mod.reward, `Graduación Módulo ${mod.num}`);
    }

    // Audio triunfal
    if (window.cyberAudio) window.cyberAudio.playSuccess();

    // Mensaje en terminal
    if (typeof window.printToTerminal === 'function') {
      window.printToTerminal(`\n╔══════════════════════════════════════════════════════════════════════╗
║               ¡MÓDULO ${mod.num} DE ACADEMIA COMPLETADO!              ║
║         Recompensa acreditada a tu billetera: +${mod.reward} ฿               ║
╚══════════════════════════════════════════════════════════════════════╝\n`, 'success');
    }

    // Mostrar modal de felicitación
    this.showCompletionModal(mod);
  }

  showCompletionModal(mod) {
    const hud = document.getElementById('academy-mentor-hud');
    if (hud) hud.style.display = 'none';

    const nextModIndex = this.modules.findIndex(m => m.id === mod.id) + 1;
    const hasNext = nextModIndex < this.modules.length;
    const nextMod = hasNext ? this.modules[nextModIndex] : null;

    const modal = document.createElement('div');
    modal.className = 'cyber-modal';
    modal.style.display = 'flex';
    modal.id = 'modal-module-victory';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content modal-glow" style="max-width: 500px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">${mod.icon}</div>
        <h2 style="color: var(--color-green); font-family: var(--font-title); font-size: 18px; margin-bottom: 6px;">
          ¡MÓDULO ${mod.num} COMPLETADO!
        </h2>
        <p style="color: var(--text-main); font-size: 13px; margin-bottom: 16px;">
          Has dominado los conceptos de: <strong>${mod.title}</strong>
        </p>

        <div style="background: rgba(0, 255, 119, 0.08); border: 1px solid var(--color-green); padding: 14px; border-radius: 6px; margin-bottom: 20px;">
          <span style="font-size: 11px; color: var(--text-muted); display: block;">RECOMPENSA DE GRADUACIÓN:</span>
          <span style="font-size: 22px; font-weight: 800; color: var(--color-amber);">+${mod.reward} ฿</span>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center;">
          ${hasNext ? `
            <button class="cyber-btn btn-primary" onclick="document.getElementById('modal-module-victory').remove(); window.hackWarsAcademy.startLesson('${nextMod.id}');">
              SIGUIENTE MÓDULO ▶
            </button>
          ` : `
            <button class="cyber-btn btn-primary" onclick="document.getElementById('modal-module-victory').remove(); window.hackWarsAcademy.openModal();">
              VER MAPA DE ACADEMIA
            </button>
          `}
          <button class="cyber-btn btn-secondary" onclick="document.getElementById('modal-module-victory').remove();">
            VOLVER A TERMINAL
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }
}

// Instanciar globalmente
window.hackWarsAcademy = new HackWarsAcademy();
