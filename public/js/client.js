// ==========================================================================
// HACKWARS LAN - CLIENT CONTROLLER & TERMINAL ENGINE
// ==========================================================================

(() => {
  'use strict';

  // Conexión Socket.IO
  const socket = io();

  // Estado Local del Cliente
  const state = {
    myUsername: '',
    roomId: null,
    isHost: false,
    myIp: null,
    myHostname: null,
    remoteHostIp: null,
    currentPath: '/root',
    commandHistory: [],
    historyIndex: -1,
    activeTaskTimer: null,
    activeTaskStartTime: 0,
    activeTaskDuration: 0,
    knownCommands: [
      'help', 'ayuda', 'ifconfig', 'ip', 'netdiscover', 'nmap', 'probe', 'exploit',
      'connect', 'submit', 'ps', 'kill', 'firewall', 'patch', 'clearlogs',
      'clear', 'cls', 'ls', 'cd', 'cat', 'rm', 'exit', 'test',
      'popup', 'alert', 'freeze', 'glitch', 'invert', 'flip', 'chaos', 'mousechaos',
      'say', 'msg', 'gane', 'win', 'pwn', 'pwned', 'gg', 'deface',
      'market', 'shop', 'tienda', 'profile', 'stats', 'perfil', 'bounties', 'misiones', 'contratos', 'wallet', 'coins', 'saldo'
    ],
    commonPaths: [
      '/boot/kernel.sys', '/etc/passwd', '/home/admin/flag.txt', '/home/admin/notas.txt',
      '/var/log/syslog', '/root/readme.txt', '/boot', '/etc', '/home', '/home/admin', '/var', '/root'
    ]
  };

  // Referencias al DOM
  const dom = {
    // Pantallas
    viewLobby: document.getElementById('view-lobby'),
    viewBattle: document.getElementById('view-battle'),
    
    // Header
    headerMatchInfo: document.getElementById('header-match-info'),
    headerRoomCode: document.getElementById('header-room-code'),
    headerOpponentName: document.getElementById('header-opponent-name'),
    btnToggleCrt: document.getElementById('btn-toggle-crt'),
    btnToggleSound: document.getElementById('btn-toggle-sound'),
    btnOpenHelp: document.getElementById('btn-open-help'),
    
    // Lobby
    inputNickname: document.getElementById('input-nickname'),
    btnQuickMatch: document.getElementById('btn-quick-match'),
    inputRoomCode: document.getElementById('input-room-code'),
    btnJoinRoom: document.getElementById('btn-join-room'),
    lanUrlDisplay: document.getElementById('lan-url-display'),
    btnCopyLanUrl: document.getElementById('btn-copy-lan-url'),
    lobbyWaitingState: document.getElementById('lobby-waiting-state'),
    waitingRoomCode: document.getElementById('waiting-room-code'),
    waitingRoomCodeShare: document.getElementById('waiting-room-code-share'),
    
    // Terminal
    terminalOutput: document.getElementById('terminal-output'),
    terminalInput: document.getElementById('terminal-input'),
    promptPrefix: document.getElementById('prompt-prefix'),
    btnExecCmd: document.getElementById('btn-exec-cmd'),
    btnClearTerm: document.getElementById('btn-clear-term'),
    termSessionBadge: document.getElementById('term-session-badge'),
    
    // Progress Bar
    taskProgressBox: document.getElementById('task-progress-box'),
    taskLabel: document.getElementById('task-label'),
    taskPercent: document.getElementById('task-percent'),
    taskAsciiBar: document.getElementById('task-ascii-bar'),
    
    // Monitor
    monHostname: document.getElementById('mon-hostname'),
    monVirtualIp: document.getElementById('mon-virtual-ip'),
    monSubnet: document.getElementById('mon-subnet'),
    monCpuNum: document.getElementById('mon-cpu-num'),
    monCpuFill: document.getElementById('mon-cpu-fill'),
    cpuStatusText: document.getElementById('cpu-status-text'),
    portsGrid: document.getElementById('ports-grid'),
    monProcCount: document.getElementById('mon-proc-count'),
    monProcTbody: document.getElementById('mon-proc-tbody'),
    
    // Syslog
    syslogFeed: document.getElementById('syslog-feed'),
    btnQuickClearlogs: document.getElementById('btn-quick-clearlogs'),
    
    // Modales
    modalHelp: document.getElementById('modal-help'),
    btnCloseHelp: document.getElementById('btn-close-help'),
    modalGameover: document.getElementById('modal-gameover'),
    gameoverTitle: document.getElementById('gameover-title'),
    gameoverBadge: document.getElementById('gameover-badge'),
    gameoverReason: document.getElementById('gameover-reason'),
    btnRematch: document.getElementById('btn-rematch'),
    btnReturnLobby: document.getElementById('btn-return-lobby')
  };

  // ==========================================================================
  // INICIALIZACIÓN Y CONFIGURACIÓN DE RED LAN
  // ==========================================================================
  async function initLobbyInfo() {
    // Si ya tenemos la URL del origen en el navegador, colocarla de inmediato como base
    if (dom.lanUrlDisplay && window.location.hostname) {
      const fallbackPort = window.location.port || '3000';
      dom.lanUrlDisplay.value = `http://${window.location.hostname}:${fallbackPort}`;
    }

    try {
      const res = await fetch('/api/info');
      const data = await res.json();
      if (data.connectUrl && dom.lanUrlDisplay) {
        dom.lanUrlDisplay.value = data.connectUrl;
      }
    } catch (e) {
      if (dom.lanUrlDisplay && window.location.origin) {
        dom.lanUrlDisplay.value = window.location.origin;
      }
    }
  }

  // Ejecutar inmediatamente al cargar el script
  initLobbyInfo();

  // Copiar URL de red LAN al portapapeles
  dom.btnCopyLanUrl.addEventListener('click', () => {
    navigator.clipboard.writeText(dom.lanUrlDisplay.value).then(() => {
      const originalText = dom.btnCopyLanUrl.textContent;
      dom.btnCopyLanUrl.textContent = '¡COPIADO!';
      dom.btnCopyLanUrl.style.background = '#00ff77';
      dom.btnCopyLanUrl.style.color = '#000';
      if (window.cyberAudio) window.cyberAudio.playSuccess();
      setTimeout(() => {
        dom.btnCopyLanUrl.textContent = originalText;
        dom.btnCopyLanUrl.style.background = '';
        dom.btnCopyLanUrl.style.color = '';
      }, 2000);
    });
  });

  // Detección de Reto Directo por Parámetro de URL (?room=XXXX o ?join=XXXX)
  const urlParams = new URLSearchParams(window.location.search);
  const challengeRoom = (urlParams.get('room') || urlParams.get('join') || '').trim().toUpperCase();

  if (challengeRoom && challengeRoom.length <= 6) {
    if (dom.inputRoomCode) dom.inputRoomCode.value = challengeRoom;
    const bannerContainer = document.getElementById('challenge-banner-container');
    if (bannerContainer) {
      bannerContainer.style.display = 'flex';
      bannerContainer.className = 'challenge-banner';
      bannerContainer.innerHTML = `
        <div>
          <strong>⚔️ ¡DESAFÍO DIRECTO RECIBIDO!</strong><br>
          Has sido retado a combatir en la sala privada <strong>[${challengeRoom}]</strong>.
        </div>
        <button class="cyber-btn btn-sm" id="btn-quick-accept-challenge" style="background: var(--color-cyan); color: #000; font-weight: 700;">ACEPTAR RETO</button>
      `;
      document.getElementById('btn-quick-accept-challenge')?.addEventListener('click', () => {
        joinMatch(challengeRoom);
      });
    }
  }

  // Botón Copiar Link de Reto Directo
  const btnCopyChallenge = document.getElementById('btn-copy-challenge-link');
  if (btnCopyChallenge) {
    btnCopyChallenge.addEventListener('click', () => {
      let code = dom.inputRoomCode.value.trim().toUpperCase();
      if (!code) {
        code = Math.random().toString(36).substring(2, 6).toUpperCase();
        dom.inputRoomCode.value = code;
      }
      const challengeUrl = `${window.location.origin}/?join=${code}`;
      navigator.clipboard.writeText(challengeUrl).then(() => {
        const orig = btnCopyChallenge.textContent;
        btnCopyChallenge.textContent = '¡LINK COPIADO!';
        btnCopyChallenge.style.background = '#00ff77';
        btnCopyChallenge.style.color = '#000';
        if (window.cyberAudio) window.cyberAudio.playSuccess();
        setTimeout(() => {
          btnCopyChallenge.textContent = orig;
          btnCopyChallenge.style.background = '';
          btnCopyChallenge.style.color = '';
        }, 2000);
      });
    });
  }

  // Botón Retar por WhatsApp
  const btnShareWa = document.getElementById('btn-share-whatsapp');
  if (btnShareWa) {
    btnShareWa.addEventListener('click', () => {
      let code = dom.inputRoomCode.value.trim().toUpperCase();
      if (!code) {
        code = Math.random().toString(36).substring(2, 6).toUpperCase();
        dom.inputRoomCode.value = code;
      }
      const challengeUrl = `${window.location.origin}/?join=${code}`;
      const msg = `⚔️ Te desafío a un combate de hacking 1v1 en HackWars. Haz clic aquí para entrar a mi sala privada: ${challengeUrl}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }

  // Botón en Header para abrir The Black Market
  const btnHeaderMarket = document.getElementById('btn-header-market');
  if (btnHeaderMarket) {
    btnHeaderMarket.addEventListener('click', () => {
      if (window.blackMarket) window.blackMarket.open();
    });
  }

  // Guardar alias en localStorage
  const savedName = localStorage.getItem('hackwars_alias');
  if (savedName) dom.inputNickname.value = savedName;

  // Unirse a Partida Rápida
  dom.btnQuickMatch.addEventListener('click', () => {
    joinMatch('');
  });

  // Modo Práctica / Simulador contra Bot IA
  dom.btnPracticeBot = document.getElementById('btn-practice-bot');
  if (dom.btnPracticeBot) {
    dom.btnPracticeBot.addEventListener('click', () => {
      const username = (dom.inputNickname.value || 'Hacker_' + Math.floor(Math.random() * 900 + 100)).trim();
      localStorage.setItem('hackwars_alias', username);
      state.myUsername = username;
      if (window.cyberAudio) window.cyberAudio.playSuccess();
      socket.emit('start_bot_game', { username });
    });
  }

  // Unirse con Código de Sala
  dom.btnJoinRoom.addEventListener('click', () => {
    const code = dom.inputRoomCode.value.trim().toUpperCase();
    if (!code) {
      alert('Ingresa un código de 4 caracteres o usa Emparejamiento Rápido.');
      return;
    }
    joinMatch(code);
  });

  function joinMatch(roomCode) {
    const username = (dom.inputNickname.value || 'Hacker_' + Math.floor(Math.random() * 900 + 100)).trim();
    localStorage.setItem('hackwars_alias', username);
    state.myUsername = username;

    if (window.cyberAudio) window.cyberAudio.playBeep(600, 0.1);

    socket.emit('join_game', {
      username,
      roomCode
    });
  }

  // Evento: Unido a la sala en espera
  socket.on('lobby_joined', (data) => {
    state.roomId = data.roomId;
    state.isHost = data.isHost;

    if (data.playersCount === 1) {
      // Mostrar pantalla de radar esperando al segundo jugador
      dom.lobbyWaitingState.style.display = 'flex';
      dom.waitingRoomCode.textContent = data.roomId;
      dom.waitingRoomCodeShare.textContent = data.roomId;
      document.querySelector('.lobby-actions-grid').style.opacity = '0.3';
      document.querySelector('.lobby-actions-grid').style.pointerEvents = 'none';
    }
  });

  // Evento: Error de lobby
  socket.on('lobby_error', (data) => {
    alert(data.message);
  });

  // Evento: ¡Partida Iniciada! Ambos jugadores conectados
  socket.on('match_started', (data) => {
    state.roomId = data.roomId;
    state.myIp = data.myIp;
    state.myHostname = data.myHostname;
    state.currentPath = '/root';
    state.remoteHostIp = null;

    // Cambiar vista del Lobby a la Terminal de Combate
    dom.viewLobby.style.display = 'none';
    dom.viewBattle.style.display = 'block';

    // Actualizar barra de estado superior
    dom.headerMatchInfo.style.display = 'flex';
    dom.headerRoomCode.textContent = data.roomId;
    dom.headerOpponentName.textContent = data.opponentUsername;

    // Audio de inicio
    if (window.cyberAudio) window.cyberAudio.playSuccess();

    // Actualizar UI con el estado inicial del VM
    updateUiState(data.myState);
    updatePromptPrefix();

    // Mensaje de inicio en la terminal
    printToTerminal(`
[+] Enlace de red virtual establecido exitosamente.
[+] Tu IP asignada: ${state.myIp} (${state.myHostname})
[+] Adversario en subred: ${data.opponentUsername}
[+] Objetivo: Descubre su IP, vulnera sus servicios y captura la FLAG o destruye /boot/kernel.sys.
[*] ¡COMBATE INICIADO! Escribe 'help' para instrucciones.
--------------------------------------------------------------------------------`, 'success');

    dom.terminalInput.focus();
  });

  // ==========================================================================
  // MANEJO DE COMANDOS Y TERMINAL
  // ==========================================================================

  // Enviar comando al presionar Enter o botón de ejecutar
  function submitCurrentCommand() {
    const raw = dom.terminalInput.value;
    dom.terminalInput.value = '';
    state.historyIndex = -1;

    if (!raw.trim()) return;

    // Guardar en historial
    state.commandHistory.unshift(raw);
    if (state.commandHistory.length > 50) state.commandHistory.pop();

    const trimmed = raw.trim().toLowerCase();
    if (trimmed === 'clear' || trimmed === 'cls') {
      clearTerminal();
      return;
    }

    if (trimmed === 'market' || trimmed === 'shop' || trimmed === 'tienda') {
      if (window.blackMarket) window.blackMarket.open();
      printToTerminal('[+] Abriendo The Black Market...', 'info');
      return;
    }

    if (trimmed === 'profile' || trimmed === 'stats' || trimmed === 'perfil') {
      if (window.hackWarsEconomy) {
        printToTerminal(window.hackWarsEconomy.formatAsciiProfile(), 'highlight');
      }
      return;
    }

    if (trimmed === 'bounties' || trimmed === 'misiones' || trimmed === 'contratos') {
      if (window.hackWarsEconomy) {
        printToTerminal(window.hackWarsEconomy.formatAsciiBounties(), 'highlight');
      }
      return;
    }

    if (trimmed === 'wallet' || trimmed === 'coins' || trimmed === 'saldo') {
      if (window.hackWarsEconomy) {
        const p = window.hackWarsEconomy.profile;
        printToTerminal(`\n🪙 SALDO DISPONIBLE: ${p.bytecoins.toLocaleString()} ฿ | RATING: ${p.elo} ELO\n`, 'info');
      }
      return;
    }

    // Registrar evento de troyano para contratos diarios si corresponde
    if (trimmed.startsWith('freeze') || trimmed.startsWith('invert') || trimmed.startsWith('popup') || trimmed.startsWith('chaos') || trimmed.startsWith('alert') || trimmed.startsWith('flip')) {
      if (window.hackWarsEconomy) {
        window.hackWarsEconomy.triggerBountyEvent('TROJAN');
      }
    }

    // Imprimir comando local en terminal
    printCommandLine(raw);

    // Audio de ejecución
    if (window.cyberAudio) window.cyberAudio.playBeep(800, 0.05);

    // Enviar al servidor autoritativo
    socket.emit('send_command', { command: raw });
  }

  dom.terminalInput.addEventListener('keydown', (e) => {
    // Sonido sutil de tecla
    if (window.cyberAudio && e.key.length === 1) {
      window.cyberAudio.playKey();
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      submitCurrentCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory(-1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabAutocomplete();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      clearTerminal();
    }
  });

  dom.btnExecCmd.addEventListener('click', submitCurrentCommand);
  dom.btnClearTerm.addEventListener('click', clearTerminal);

  // Navegación por historial de comandos
  function navigateHistory(direction) {
    if (state.commandHistory.length === 0) return;
    state.historyIndex += direction;
    if (state.historyIndex < 0) {
      state.historyIndex = -1;
      dom.terminalInput.value = '';
    } else if (state.historyIndex >= state.commandHistory.length) {
      state.historyIndex = state.commandHistory.length - 1;
    }

    if (state.historyIndex !== -1) {
      dom.terminalInput.value = state.commandHistory[state.historyIndex];
    }
  }

  // Autocompletado con tecla Tab
  function handleTabAutocomplete() {
    const text = dom.terminalInput.value;
    const parts = text.split(' ');
    
    if (parts.length <= 1) {
      // Autocompletar comando
      const token = parts[0].toLowerCase();
      if (!token) return;
      const matches = state.knownCommands.filter(c => c.startsWith(token));
      if (matches.length === 1) {
        dom.terminalInput.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        printToTerminal(`Sugerencias: ${matches.join('  ')}`, 'info');
      }
    } else {
      // Autocompletar ruta de archivo
      const lastToken = parts[parts.length - 1];
      const matches = state.commonPaths.filter(p => p.startsWith(lastToken));
      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0];
        dom.terminalInput.value = parts.join(' ');
      } else if (matches.length > 1) {
        printToTerminal(`Rutas coincidentes: ${matches.join('  ')}`, 'info');
      }
    }
  }

  // Imprimir línea de comando del usuario
  function printCommandLine(cmd) {
    const entry = document.createElement('div');
    entry.className = 'term-entry';

    const cmdLine = document.createElement('div');
    cmdLine.className = 'term-cmd-line';
    
    const promptSpan = document.createElement('span');
    promptSpan.className = 'term-cmd-prompt';
    promptSpan.textContent = dom.promptPrefix.textContent + ' ';

    const textSpan = document.createElement('span');
    textSpan.textContent = cmd;

    cmdLine.appendChild(promptSpan);
    cmdLine.appendChild(textSpan);
    entry.appendChild(cmdLine);

    dom.terminalOutput.appendChild(entry);
    scrollTerminalToBottom(true);
  }

  // Imprimir resultado o mensaje en la terminal
  function printToTerminal(text, type = 'normal') {
    if (!text && text !== '') return;
    const block = document.createElement('div');
    block.className = `term-output-text ${type}`;
    block.textContent = text;
    dom.terminalOutput.appendChild(block);
    scrollTerminalToBottom();
  }

  function clearTerminal() {
    dom.terminalOutput.innerHTML = '';
  }

  function scrollTerminalToBottom(force = true) {
    const el = dom.terminalOutput;
    if (!el) return;
    if (force) {
      el.scrollTop = el.scrollHeight;
    } else {
      const isNearBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < 250;
      if (isNearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }

  // Prevenir que la ventana o cuerpo hagan scroll accidental
  window.addEventListener('scroll', () => {
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0);
    }
  }, { passive: true });

  // Al hacer clic en cualquier parte de la terminal, enfocar el input de texto automáticamente
  const paneTerm = document.getElementById('pane-terminal');
  if (paneTerm) {
    paneTerm.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON' && !window.getSelection().toString()) {
        if (dom.terminalInput && !dom.terminalInput.disabled) {
          dom.terminalInput.focus();
        }
      }
    });
  }

  // Actualizar el prompt dinámico de la terminal
  function updatePromptPrefix() {
    const title = (window.hackWarsEconomy && window.hackWarsEconomy.profile && window.hackWarsEconomy.profile.equippedTitle)
      ? `${window.hackWarsEconomy.profile.equippedTitle} `
      : '';
    if (state.remoteHostIp) {
      dom.promptPrefix.textContent = `${title}[REMOTO] root@${state.remoteHostIp}:${state.currentPath}#`;
      dom.promptPrefix.classList.add('remote');
      dom.termSessionBadge.textContent = `SESIÓN: REMOTA (${state.remoteHostIp})`;
      dom.termSessionBadge.classList.add('remote-mode');
    } else {
      dom.promptPrefix.textContent = `${title}root@${state.myHostname || 'local'}:${state.currentPath}#`;
      dom.promptPrefix.classList.remove('remote');
      dom.termSessionBadge.textContent = 'SESIÓN: LOCAL';
      dom.termSessionBadge.classList.remove('remote-mode');
    }
  }

  // ==========================================================================
  // EVENTOS DEL SERVIDOR (COMMANDS, TASKS, TROLLING, NOTIFICATIONS)
  // ==========================================================================

  socket.on('command_result', (data) => {
    if (data.clear) {
      clearTerminal();
    }

    if (data.newPath) {
      state.currentPath = data.newPath;
      updatePromptPrefix();
    }

    if (data.remoteConnected) {
      state.remoteHostIp = data.targetIp;
      state.currentPath = data.cwd || '/root';
      updatePromptPrefix();
      if (window.cyberAudio) window.cyberAudio.playSuccess();
    }

    if (data.output) {
      printToTerminal(data.output);
    }
    if (dom.terminalInput && !dom.terminalInput.disabled) {
      dom.terminalInput.focus();
    }
  });

  // Tarea de progreso iniciada (netdiscover, nmap, probe, exploit, patch)
  socket.on('task_start', (data) => {
    startProgressBar(data.name, data.label, data.duration);
    if (window.cyberAudio) window.cyberAudio.playBeep(440, 0.1);
  });

  socket.on('task_complete', (data) => {
    stopProgressBar();
    if (data.output) {
      printToTerminal(data.output, 'success');
    }
    if (window.cyberAudio) window.cyberAudio.playSuccess();
    if (dom.terminalInput) {
      dom.terminalInput.disabled = false;
      dom.terminalInput.focus();
    }
  });

  socket.on('task_cancelled', (data) => {
    stopProgressBar();
    printToTerminal(`[CANCELADO] ${data.reason}`, 'error');
    if (window.cyberAudio) window.cyberAudio.playAlert();
    if (dom.terminalInput) {
      dom.terminalInput.disabled = false;
      dom.terminalInput.focus();
    }
  });

  socket.on('connection_severed', (data) => {
    state.remoteHostIp = null;
    state.currentPath = '/root';
    updatePromptPrefix();
    printToTerminal(`\n${data.message}\n`, 'error');
    if (window.cyberAudio) window.cyberAudio.playAlarm();
    if (dom.terminalInput) {
      dom.terminalInput.disabled = false;
      dom.terminalInput.focus();
    }
  });

  // Sincronización del estado de la VM (recursos, puertos, procesos, syslog)
  socket.on('state_update', (data) => {
    if (data.remoteHostIp !== undefined) {
      state.remoteHostIp = data.remoteHostIp;
      updatePromptPrefix();
    }
    updateUiState(data.myState);
  });

  // ==========================================================================
  // RECEPCIÓN DE ATAQUES TROYANOS Y TROLLING CIBERNÉTICO
  // ==========================================================================

  // 1. Popup de Intrusión en Pantalla
  socket.on('victim_popup', (data) => {
    if (window.cyberAudio) window.cyberAudio.playAlarm();
    createHackerPopup(data.message, data.from);
  });

  function createHackerPopup(message, from) {
    const container = document.getElementById('popups-container') || document.body;
    const popup = document.createElement('div');
    popup.className = 'hacker-popup-window';

    // Posición aleatoria dentro de la pantalla
    const topPct = 15 + Math.random() * 45;
    const leftPct = 10 + Math.random() * 55;
    popup.style.top = `${topPct}%`;
    popup.style.left = `${leftPct}%`;

    popup.innerHTML = `
      <div class="popup-header">
        <span>⚠️ [INTRUSIÓN // ${from}]</span>
        <button class="popup-close-btn" title="Cerrar">&times;</button>
      </div>
      <div class="popup-body">
        <div class="popup-skull">💀</div>
        <div class="popup-text">${escapeHtml(message)}</div>
      </div>
    `;

    popup.querySelector('.popup-close-btn').addEventListener('click', () => {
      popup.remove();
    });

    // Auto-cierre opcional tras 12s para no saturar eternamente
    setTimeout(() => {
      if (popup.parentNode) popup.remove();
    }, 12000);

    container.appendChild(popup);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 2. Congelamiento de Consola (Freeze)
  let freezeInterval = null;
  socket.on('victim_freeze', (data) => {
    if (window.cyberAudio) window.cyberAudio.playAlarm();
    const overlay = document.getElementById('freeze-overlay');
    const timerSpan = document.getElementById('freeze-timer');
    const input = dom.terminalInput;

    if (!overlay) return;
    overlay.style.display = 'flex';
    input.disabled = true;

    let timeLeft = Math.ceil((data.duration || 4000) / 1000);
    if (timerSpan) timerSpan.textContent = timeLeft;

    if (freezeInterval) clearInterval(freezeInterval);
    freezeInterval = setInterval(() => {
      timeLeft--;
      if (timerSpan) timerSpan.textContent = Math.max(0, timeLeft);
      if (timeLeft <= 0) {
        clearInterval(freezeInterval);
        overlay.style.display = 'none';
        input.disabled = false;
        input.focus();
      }
    }, 1000);
  });

  // 3. Glitch y Sacudida de Monitor
  socket.on('victim_glitch', (data) => {
    if (window.cyberAudio) window.cyberAudio.playAlert();
    document.body.classList.add('victim-glitched');
    setTimeout(() => {
      document.body.classList.remove('victim-glitched');
    }, data.duration || 4500);
  });

  // 4. Pantalla Invertida
  socket.on('victim_invert', (data) => {
    if (window.cyberAudio) window.cyberAudio.playBeep(200, 0.3);
    document.body.classList.add('victim-inverted');
    setTimeout(() => {
      document.body.classList.remove('victim-inverted');
    }, data.duration || 5000);
  });

  // 5. Caos de Mouse / Punteros Erráticos
  socket.on('victim_chaos', (data) => {
    if (window.cyberAudio) window.cyberAudio.playAlert();
    triggerMouseChaos(data.duration || 5000);
  });

  function triggerMouseChaos(duration) {
    const container = document.getElementById('chaos-container') || document.body;
    const cursors = [];

    // Crear 8 punteros fantasma
    for (let i = 0; i < 8; i++) {
      const cur = document.createElement('div');
      cur.className = 'chaos-cursor';
      cur.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="#ff2a5f" d="M0,0 L18,14 L10,14 L8,22 Z" />
        </svg>
      `;
      cur.style.top = `${Math.random() * 80}%`;
      cur.style.left = `${Math.random() * 80}%`;
      container.appendChild(cur);
      cursors.push(cur);
    }

    const interval = setInterval(() => {
      cursors.forEach(cur => {
        cur.style.top = `${Math.random() * 90}vh`;
        cur.style.left = `${Math.random() * 90}vw`;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      cursors.forEach(c => c.remove());
    }, duration);
  }

  // 6. Mensaje intruso proyectado en terminal
  socket.on('victim_message', (data) => {
    if (window.cyberAudio) window.cyberAudio.playAlarm();
    printToTerminal(`\n⚠️ [MENSAJE DIRECTO DEL INTRUSO (${data.from})]: "${data.message}"\n`, 'victim-msg');
  });

  // ==========================================================================
  // MOTOR DE BARRA DE PROGRESO ASCII
  // ==========================================================================
  function startProgressBar(name, label, duration) {
    stopProgressBar();
    dom.taskProgressBox.style.display = 'block';
    dom.taskLabel.textContent = `> ${label}`;
    dom.taskPercent.textContent = '0%';
    dom.taskAsciiBar.textContent = '[░░░░░░░░░░░░░░░░░░░░]';

    state.activeTaskStartTime = Date.now();
    state.activeTaskDuration = duration;

    const barLength = 20;
    state.activeTaskTimer = setInterval(() => {
      const elapsed = Date.now() - state.activeTaskStartTime;
      const progress = Math.min(1, elapsed / state.activeTaskDuration);
      const percentInt = Math.floor(progress * 100);

      dom.taskPercent.textContent = `${percentInt}%`;

      const filled = Math.floor(progress * barLength);
      const empty = barLength - filled;
      dom.taskAsciiBar.textContent = `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;

      if (progress >= 1) {
        clearInterval(state.activeTaskTimer);
      }
    }, 80);
  }

  function stopProgressBar() {
    if (state.activeTaskTimer) {
      clearInterval(state.activeTaskTimer);
      state.activeTaskTimer = null;
    }
    dom.taskProgressBox.style.display = 'none';
  }

  // ==========================================================================
  // ACTUALIZACIÓN DE INTERFAZ DEL MONITOR Y SYSLOG
  // ==========================================================================
  function updateUiState(vmState) {
    if (!vmState) return;

    // IP y Hostname
    dom.monHostname.textContent = vmState.hostname || 'node-sec';
    dom.monVirtualIp.textContent = vmState.virtualIp || '10.13.37.--';

    // Barra de CPU
    const cpuUsed = vmState.resources?.usedCpu || 0;
    dom.monCpuNum.textContent = `${cpuUsed}%`;
    dom.monCpuFill.style.width = `${cpuUsed}%`;

    dom.monCpuFill.classList.remove('warning', 'danger');
    if (cpuUsed >= 80) {
      dom.monCpuFill.classList.add('danger');
      dom.cpuStatusText.textContent = 'SOBRECARGA CRÍTICA';
      dom.cpuStatusText.className = 'status-crit';
    } else if (cpuUsed >= 50) {
      dom.monCpuFill.classList.add('warning');
      dom.cpuStatusText.textContent = 'ELEVADO';
      dom.cpuStatusText.className = 'status-warn';
    } else {
      dom.cpuStatusText.textContent = 'ESTABLE';
      dom.cpuStatusText.className = 'status-ok';
    }

    // Puertos
    if (vmState.ports) {
      for (const [portNum, info] of Object.entries(vmState.ports)) {
        const card = document.getElementById(`port-card-${portNum}`);
        if (!card) continue;

        card.classList.remove('compromised');
        const statusSpan = card.querySelector('.port-status');

        if (info.compromised) {
          card.classList.add('compromised');
          statusSpan.className = 'port-status status-compromised';
          statusSpan.textContent = 'COMPROMETIDO';
        } else if (info.open) {
          statusSpan.className = 'port-status status-open';
          statusSpan.textContent = 'ABIERTO';
        } else {
          statusSpan.className = 'port-status status-closed';
          statusSpan.textContent = 'CERRADO';
        }
      }
    }

    // Procesos
    if (vmState.processes) {
      dom.monProcCount.textContent = `${vmState.processes.length} tareas`;
      dom.monProcTbody.innerHTML = '';

      vmState.processes.forEach(p => {
        const tr = document.createElement('tr');
        if (p.type === 'incoming_attack') {
          tr.className = 'proc-row-attack';
          // Alerta sonora si aparece ataque entrante
          if (window.cyberAudio) window.cyberAudio.playAlarm();
        }

        const tdPid = document.createElement('td');
        tdPid.textContent = p.pid;

        const tdName = document.createElement('td');
        tdName.textContent = p.name;

        const tdCpu = document.createElement('td');
        tdCpu.textContent = `${p.cpu}%`;

        const tdUser = document.createElement('td');
        tdUser.textContent = p.user;

        const tdAct = document.createElement('td');
        if (p.type !== 'system') {
          const btn = document.createElement('button');
          btn.className = 'btn-kill-proc';
          btn.textContent = 'KILL';
          btn.title = `Matar proceso PID ${p.pid}`;
          btn.addEventListener('click', () => {
            socket.emit('send_command', { command: `kill ${p.pid}` });
            printCommandLine(`kill ${p.pid}`);
          });
          tdAct.appendChild(btn);
        } else {
          tdAct.textContent = '-';
        }

        tr.appendChild(tdPid);
        tr.appendChild(tdName);
        tr.appendChild(tdCpu);
        tr.appendChild(tdUser);
        tr.appendChild(tdAct);

        dom.monProcTbody.appendChild(tr);
      });
    }

    // Syslog feed
    if (vmState.syslog) {
      dom.syslogFeed.innerHTML = '';
      vmState.syslog.forEach(entry => {
        const div = document.createElement('div');
        div.className = `log-entry log-${entry.level.toLowerCase()}`;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = `[${entry.timestamp}]`;

        const tagSpan = document.createElement('span');
        tagSpan.className = `log-tag tag-${entry.level.toLowerCase()}`;
        tagSpan.textContent = `[${entry.level}]`;

        const msgSpan = document.createElement('span');
        msgSpan.className = 'log-msg';
        msgSpan.textContent = entry.message;

        div.appendChild(timeSpan);
        div.appendChild(tagSpan);
        div.appendChild(msgSpan);
        dom.syslogFeed.appendChild(div);
      });
      dom.syslogFeed.scrollTop = dom.syslogFeed.scrollHeight;
    }
  }

  // Limpiar logs con 1 click
  dom.btnQuickClearlogs.addEventListener('click', () => {
    socket.emit('send_command', { command: 'clearlogs' });
    printCommandLine('clearlogs');
  });

  // ==========================================================================
  // RECOMPENSAS DURANTE EL COMBATE (FIRST BLOOD, DEFENSA EXITOSA)
  // ==========================================================================
  socket.on('bounty_reward', (data) => {
    if (window.hackWarsEconomy) {
      window.hackWarsEconomy.addBytecoins(data.reward, data.message);
    }
    printToTerminal(`\n🪙 ${data.message}`, 'highlight');
  });

  // Función de Kill-Cam / Defacement Overlay dramático
  function showDefaceKillCam(isWinner, winnerUsername, onFinished) {
    const overlay = document.getElementById('deface-overlay');
    const skullEl = document.getElementById('deface-skull-art');
    const bannerEl = document.getElementById('deface-banner-text');
    const subtextEl = document.getElementById('deface-subtext-msg');

    if (!overlay || !skullEl || !bannerEl) {
      onFinished();
      return;
    }

    const skullArt = `
             .-''''''-.
           .'          '.
          /   X      X   \\
         :                :
         |                |
         : ',          ,' :
          \\  '--------'  /
           '.          .'
             '-......-'
               ||||||
    `;
    skullEl.textContent = skullArt;

    if (isWinner) {
      bannerEl.textContent = '¡DEFACEMENT TOTAL & VICTORIA!';
      bannerEl.style.background = 'var(--color-green)';
      bannerEl.style.color = '#000';
      skullEl.style.color = 'var(--color-green)';
      subtextEl.textContent = `NODO RIVAL CONQUISTADO POR ${state.myUsername} // ZERO-DAY CONFIRMADO`;
      if (window.cyberAudio) window.cyberAudio.playSuccess();
    } else {
      bannerEl.textContent = 'SISTEMA COMPROMETIDO';
      bannerEl.style.background = 'var(--color-red)';
      bannerEl.style.color = '#fff';
      skullEl.style.color = 'var(--color-red)';
      subtextEl.textContent = `PWNED BY ${winnerUsername || 'OPONENTE'} // ROOT ACCESS SEIZED`;
      if (window.cyberAudio) window.cyberAudio.playAlarm();
    }

    overlay.style.display = 'flex';

    setTimeout(() => {
      overlay.style.display = 'none';
      onFinished();
    }, 2400);
  }

  // ==========================================================================
  // FIN DE PARTIDA (GAME OVER)
  // ==========================================================================
  socket.on('game_over', (data) => {
    const isWinner = data.winner === state.myUsername;

    showDefaceKillCam(isWinner, data.winner, () => {
      dom.modalGameover.style.display = 'flex';

      if (isWinner) {
        dom.gameoverTitle.textContent = '¡VICTORIA CIBERNÉTICA!';
        dom.gameoverTitle.className = 'gameover-title win';
        dom.gameoverBadge.textContent = 'OPERACIÓN EXITOSA';
        dom.gameoverBadge.style.color = '#00ff77';
      } else {
        dom.gameoverTitle.textContent = 'SISTEMA COMPROMETIDO';
        dom.gameoverTitle.className = 'gameover-title lose';
        dom.gameoverBadge.textContent = 'DERROTA DEL NODO';
        dom.gameoverBadge.style.color = '#ff2a5f';
      }

      dom.gameoverReason.textContent = data.reason;

      // Liquidar recompensas en economía y actualizar estadísticas
      if (window.hackWarsEconomy) {
        const summary = window.hackWarsEconomy.recordMatch({
          isWinner,
          winType: data.winType || 'VICTORY',
          durationSec: data.durationSec || 0,
          isBot: !!data.isBotMatch
        });

        const durEl = document.getElementById('gameover-duration');
        if (durEl) durEl.textContent = `${data.durationSec || 0} segundos`;

        const eloEl = document.getElementById('gameover-elo-change');
        if (eloEl) {
          const sign = summary.eloResult.delta >= 0 ? '+' : '';
          eloEl.textContent = `${summary.rank.name} (${sign}${summary.eloResult.delta} ELO -> ${summary.eloResult.newElo})`;
          eloEl.style.color = isWinner ? '#00ff77' : '#ff2a5f';
        }

        const rewardsList = document.getElementById('gameover-rewards-list');
        if (rewardsList) {
          rewardsList.innerHTML = summary.rewards.map(r => `
            <div class="reward-item">
              <span>• ${r.label}</span>
              <span>+${r.amount} ฿</span>
            </div>
          `).join('');
        }

        // Configurar botón compartir en WhatsApp
        const btnShareWa = document.getElementById('btn-share-victory-wa');
        if (btnShareWa) {
          btnShareWa.onclick = () => {
            const outcome = isWinner ? '¡Acabo de ganar un duelo 1v1' : '¡Acabo de jugar una partida intensa';
            const msg = `⚔️ ${outcome} en HackWars en ${data.durationSec || 0}s! ¿Te atreves a desafiarme en terminal? Entra aquí: ${window.location.origin}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
          };
        }
      }
    });
  });

  // Revancha
  dom.btnRematch.addEventListener('click', () => {
    dom.modalGameover.style.display = 'none';
    socket.emit('request_rematch');
    printToTerminal('\n[+] Solicitud de revancha enviada a la red...\n', 'info');
  });

  // Volver al Lobby
  dom.btnReturnLobby.addEventListener('click', () => {
    window.location.reload();
  });

  // ==========================================================================
  // CONTROLES DE HEADER (CRT, AUDIO, MANUAL)
  // ==========================================================================
  let crtActive = true;
  dom.btnToggleCrt.addEventListener('click', () => {
    crtActive = !crtActive;
    document.body.classList.toggle('crt-enabled', crtActive);
    dom.btnToggleCrt.textContent = crtActive ? 'CRT: ON' : 'CRT: OFF';
    dom.btnToggleCrt.style.borderColor = crtActive ? '' : 'var(--text-dim)';
  });

  dom.btnToggleSound.addEventListener('click', () => {
    if (!window.cyberAudio) return;
    const isMuted = window.cyberAudio.toggleMute();
    dom.btnToggleSound.textContent = isMuted ? 'AUDIO: 🔇' : 'AUDIO: 🔊';
    dom.btnToggleSound.style.borderColor = isMuted ? 'var(--text-dim)' : '';
  });

  dom.btnOpenHelp.addEventListener('click', () => {
    dom.modalHelp.style.display = 'flex';
  });

  dom.btnCloseHelp.addEventListener('click', () => {
    dom.modalHelp.style.display = 'none';
  });

  document.querySelector('#modal-help .modal-backdrop').addEventListener('click', () => {
    dom.modalHelp.style.display = 'none';
  });

  window.addEventListener('keydown', (e) => {
    if (dom.viewBattle.style.display !== 'none') {
      if (document.activeElement !== dom.terminalInput && dom.terminalInput && !dom.terminalInput.disabled) {
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          dom.terminalInput.focus();
        }
      }
    }
  });

  // --- MODAL DE CONTRATOS DIARIOS (BOUNTIES) ---
  const modalBounties = document.getElementById('modal-bounties');
  const btnOpenBounties = document.getElementById('btn-open-bounties');
  const btnCloseBounties = document.getElementById('btn-close-bounties');
  const bountiesContainer = document.getElementById('bounties-list-container');

  function renderBountiesModal() {
    if (!bountiesContainer || !window.hackWarsEconomy) return;
    const bounties = window.hackWarsEconomy.profile.bounties || window.hackWarsEconomy.getDefaultBounties();
    bountiesContainer.innerHTML = bounties.map((b, idx) => {
      const pct = Math.round((b.progress / b.target) * 100);
      return `
        <div class="bounty-item ${b.completed ? 'completed' : ''}">
          <div class="bounty-header-row">
            <span class="bounty-title">[#${idx + 1}] ${b.title}</span>
            <span class="bounty-reward-tag">+${b.reward} ฿</span>
          </div>
          <p class="bounty-desc">${b.desc}</p>
          <div class="bounty-progress-bg">
            <div class="bounty-progress-fill" style="width: ${pct}%;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            <span>Progreso: ${b.progress} / ${b.target}</span>
            <span style="color: ${b.completed ? 'var(--color-green)' : 'var(--color-amber)'}; font-weight: 700;">
              ${b.completed ? '✓ CONTRATO CUMPLIDO' : `${pct}%`}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  btnOpenBounties?.addEventListener('click', () => {
    renderBountiesModal();
    if (modalBounties) modalBounties.style.display = 'flex';
    if (window.cyberAudio) window.cyberAudio.playSuccess();
  });
  btnCloseBounties?.addEventListener('click', () => {
    if (modalBounties) modalBounties.style.display = 'none';
  });
  document.querySelector('#modal-bounties .modal-backdrop')?.addEventListener('click', () => {
    if (modalBounties) modalBounties.style.display = 'none';
  });

  // --- MODAL DE FICHA DE AGENTE / CREDENCIAL HACKER ---
  const modalProfile = document.getElementById('modal-profile');
  const btnOpenProfile = document.getElementById('btn-open-profile');
  const btnCloseProfile = document.getElementById('btn-close-profile');
  const btnCopyHackerCard = document.getElementById('btn-copy-hacker-card');

  function renderProfileModal() {
    if (!window.hackWarsEconomy) return;
    const p = window.hackWarsEconomy.profile;
    const rank = window.hackWarsEconomy.getRankInfo(p.elo);
    const winrate = p.stats.matchesPlayed > 0 
      ? ((p.stats.wins / p.stats.matchesPlayed) * 100).toFixed(1) + '%' 
      : '0.0%';

    const aliasEl = document.getElementById('card-agent-alias');
    if (aliasEl) aliasEl.textContent = p.username || 'Hacker_Zero';

    const titleEl = document.getElementById('card-agent-title');
    if (titleEl) titleEl.textContent = p.equippedTitle || '[Script Kiddie]';

    const rankEl = document.getElementById('card-agent-rank');
    if (rankEl) rankEl.textContent = rank.name;

    const eloEl = document.getElementById('card-agent-elo');
    if (eloEl) eloEl.textContent = `${p.elo} ELO`;

    const coinsEl = document.getElementById('card-agent-coins');
    if (coinsEl) coinsEl.textContent = `${p.bytecoins.toLocaleString()} ฿`;

    const wrEl = document.getElementById('card-agent-winrate');
    if (wrEl) wrEl.textContent = `${winrate} (${p.stats.wins}V - ${p.stats.losses}D)`;

    const kernelsEl = document.getElementById('card-agent-kernels');
    if (kernelsEl) kernelsEl.textContent = p.stats.kernelsDestroyed;

    const speedEl = document.getElementById('card-agent-speed');
    if (speedEl) speedEl.textContent = p.stats.fastestWinSec ? `${p.stats.fastestWinSec}s` : 'Sin registrar';
  }

  btnOpenProfile?.addEventListener('click', () => {
    renderProfileModal();
    if (modalProfile) modalProfile.style.display = 'flex';
    if (window.cyberAudio) window.cyberAudio.playSuccess();
  });
  btnCloseProfile?.addEventListener('click', () => {
    if (modalProfile) modalProfile.style.display = 'none';
  });
  document.querySelector('#modal-profile .modal-backdrop')?.addEventListener('click', () => {
    if (modalProfile) modalProfile.style.display = 'none';
  });

  btnCopyHackerCard?.addEventListener('click', () => {
    if (!window.hackWarsEconomy) return;
    const p = window.hackWarsEconomy.profile;
    const rank = window.hackWarsEconomy.getRankInfo(p.elo);
    const textToShare = `🪪 FICHA DE AGENTE HACKWARS // Codename: ${p.username} | Título: ${p.equippedTitle} | División: ${rank.name} (${p.elo} ELO) | Victorias: ${p.stats.wins} | Kernels Destruidos: ${p.stats.kernelsDestroyed} | ¿Te atreves a retarme? Juega en: ${window.location.origin}`;
    navigator.clipboard.writeText(textToShare).then(() => {
      const orig = btnCopyHackerCard.textContent;
      btnCopyHackerCard.textContent = '¡FICHA COPIADA AL PORTAPAPELES!';
      btnCopyHackerCard.style.background = '#00ff77';
      btnCopyHackerCard.style.color = '#000';
      if (window.cyberAudio) window.cyberAudio.playSuccess();
      setTimeout(() => {
        btnCopyHackerCard.textContent = orig;
        btnCopyHackerCard.style.background = '';
        btnCopyHackerCard.style.color = '';
      }, 2000);
    });
  });

  // --- MODAL DE RECARGA DE MONEDAS (STORE SIMULADA) ---
  const modalRecharge = document.getElementById('modal-recharge');
  const btnOpenRecharge = document.getElementById('btn-open-recharge');
  const btnCloseRecharge = document.getElementById('btn-close-recharge');
  const rechargeCurrentBalance = document.getElementById('recharge-current-balance');

  btnOpenRecharge?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!window.hackWarsEconomy) return;
    if (rechargeCurrentBalance) {
      rechargeCurrentBalance.textContent = window.hackWarsEconomy.profile.bytecoins.toLocaleString();
    }
    if (modalRecharge) modalRecharge.style.display = 'flex';
    if (window.cyberAudio) window.cyberAudio.playSuccess();
  });

  btnCloseRecharge?.addEventListener('click', () => {
    if (modalRecharge) modalRecharge.style.display = 'none';
  });
  document.querySelector('#modal-recharge .modal-backdrop')?.addEventListener('click', () => {
    if (modalRecharge) modalRecharge.style.display = 'none';
  });

  document.querySelectorAll('.btn-do-recharge').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount || '500', 10);
      if (window.hackWarsEconomy) {
        window.hackWarsEconomy.addBytecoins(amount, 'Recarga Exitosa (Demo)');
        if (rechargeCurrentBalance) {
          rechargeCurrentBalance.textContent = window.hackWarsEconomy.profile.bytecoins.toLocaleString();
        }
      }
      setTimeout(() => {
        if (modalRecharge) modalRecharge.style.display = 'none';
      }, 700);
    });
  });

  // --- MODAL DE ROADMAP ---
  const modalRoadmap = document.getElementById('modal-roadmap');
  const btnOpenRoadmap = document.getElementById('btn-open-roadmap');
  const btnCloseRoadmap = document.getElementById('btn-close-roadmap');

  btnOpenRoadmap?.addEventListener('click', () => {
    if (modalRoadmap) modalRoadmap.style.display = 'flex';
    if (window.cyberAudio) window.cyberAudio.playSuccess();
  });
  btnCloseRoadmap?.addEventListener('click', () => {
    if (modalRoadmap) modalRoadmap.style.display = 'none';
  });
  document.querySelector('#modal-roadmap .modal-backdrop')?.addEventListener('click', () => {
    if (modalRoadmap) modalRoadmap.style.display = 'none';
  });

  // --- RENDERIZADO DEL SIDEBAR DE MISIONES LATERAL (LOBBY) ---
  const sidebarMissionsList = document.getElementById('sidebar-missions-list');
  const sidebarPendingBadge = document.getElementById('sidebar-pending-badge');

  function renderLobbySidebarMissions() {
    if (!sidebarMissionsList || !window.hackWarsEconomy) return;
    const bounties = window.hackWarsEconomy.profile.bounties || window.hackWarsEconomy.getDefaultBounties();
    const pendingCount = bounties.filter(b => !b.completed).length;

    if (sidebarPendingBadge) {
      sidebarPendingBadge.textContent = `${pendingCount} PENDIENTES`;
      sidebarPendingBadge.style.color = pendingCount === 0 ? 'var(--color-green)' : 'var(--color-amber)';
      sidebarPendingBadge.style.borderColor = pendingCount === 0 ? 'var(--color-green)' : 'var(--color-amber)';
    }

    sidebarMissionsList.innerHTML = bounties.map((b) => {
      const pct = Math.round((b.progress / b.target) * 100);
      return `
        <div class="sidebar-mission-card ${b.completed ? 'completed' : ''}">
          <div class="sidebar-mission-top">
            <span class="sidebar-mission-name">${b.title}</span>
            <span class="sidebar-mission-reward">+${b.reward} ฿</span>
          </div>
          <p class="sidebar-mission-desc">${b.desc}</p>
          <div class="sidebar-prog-bar-bg">
            <div class="sidebar-prog-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="sidebar-prog-text">
            <span>Progreso: ${b.progress}/${b.target}</span>
            <span style="color: ${b.completed ? 'var(--color-green)' : 'var(--color-cyan)'}; font-weight: 700;">
              ${b.completed ? '✓ CUMPLIDO' : `${pct}%`}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Inicializar sidebar y suscribir a cambios de economía
  renderLobbySidebarMissions();
  if (window.hackWarsEconomy) {
    window.hackWarsEconomy.subscribe(() => {
      renderLobbySidebarMissions();
    });
  }

  // --- CONTROL DE COLAPSO / DESPLIEGUE DEL SIDEBAR DE MISIONES ---
  const btnToggleMissions = document.getElementById('btn-toggle-missions-sidebar');
  const missionsSidebar = document.getElementById('lobby-missions-sidebar');
  if (btnToggleMissions && missionsSidebar) {
    if (window.innerWidth < 1200) {
      missionsSidebar.classList.add('collapsed');
    }

    btnToggleMissions.addEventListener('click', (e) => {
      e.stopPropagation();
      missionsSidebar.classList.toggle('collapsed');
      if (window.cyberAudio && typeof window.cyberAudio.playKey === 'function') {
        window.cyberAudio.playKey();
      }
    });
  }

  // Cargar IP LAN para compartir
  initLobbyInfo();

})();
