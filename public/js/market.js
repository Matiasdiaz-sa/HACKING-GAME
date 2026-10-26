// ==========================================================================
// HACKWARS // THE BLACK MARKET (LA TIENDA NEGRA CLANDESTINA)
// Gestión del catálogo cosmético, compra, previsualización y equipamiento
// ==========================================================================

const MARKET_CATALOG = [
  // --- TEMAS VISUALES ---
  {
    id: 'theme_matrix',
    category: 'theme',
    name: 'Matrix Phosphor',
    desc: 'Verde fósforo clásico de terminal monocromática con halo esmeralda.',
    price: 0,
    previewStyle: 'background: #07090e; color: #00ff77; border-color: #00ff77;'
  },
  {
    id: 'theme_cyberpunk',
    category: 'theme',
    name: 'Cyberpunk Night City',
    desc: 'Rosa neón vibrante, cyan eléctrico y sombras moradas synthwave.',
    price: 500,
    previewStyle: 'background: #0a0414; color: #ff007f; border-color: #00f0ff;'
  },
  {
    id: 'theme_amber',
    category: 'theme',
    name: 'Amber Retro 1982',
    desc: 'Ámbar cálido vintage emulando las legendarias terminales VT100.',
    price: 350,
    previewStyle: 'background: #0e0802; color: #ffb000; border-color: #ffb000;'
  },
  {
    id: 'theme_dracula',
    category: 'theme',
    name: 'Dracula Carbon',
    desc: 'Paleta moderna gris carbón con elegantes acentos violeta y turquesa.',
    price: 600,
    previewStyle: 'background: #12131a; color: #bd93f9; border-color: #50fa7b;'
  },
  {
    id: 'theme_blood',
    category: 'theme',
    name: 'Blood Syndicate',
    desc: 'Rojo sangre hacker clandestino con resplandor carmesí agresivo.',
    price: 850,
    previewStyle: 'background: #0f0204; color: #ff1a40; border-color: #ff1a40;'
  },
  {
    id: 'theme_ghost',
    category: 'theme',
    name: 'Ghost Protocol',
    desc: 'Monocromático blanco plata minimalista de alto contraste y sigilo.',
    price: 1000,
    previewStyle: 'background: #0b0d10; color: #ffffff; border-color: #8b949e;'
  },

  // --- SOUNDPACKS DE TECLADO MECÁNICO ---
  {
    id: 'sound_default',
    category: 'sound',
    name: 'Cyber Beep Synth',
    desc: 'Tono sintetizado básico ligero por defecto.',
    price: 0,
    previewText: '🔊 [Beep Default]'
  },
  {
    id: 'sound_cherry_blue',
    category: 'sound',
    name: 'Cherry MX Blue',
    desc: 'Clicks mecánicos audibles, nítidos y ultra satisfactorios.',
    price: 400,
    previewText: '🔊 [Clicky Switch]'
  },
  {
    id: 'sound_model_m',
    category: 'sound',
    name: 'IBM Model M 1984',
    desc: 'Resortes pesados de impacto metálico (Buckling Spring vintage).',
    price: 500,
    previewText: '🔊 [Heavy Spring]'
  },
  {
    id: 'sound_scifi_beeper',
    category: 'sound',
    name: 'Sci-Fi Beeper',
    desc: 'Tonos electrónicos limpios inspirados en películas de ciencia ficción.',
    price: 450,
    previewText: '🔊 [Crystal Beep]'
  },
  {
    id: 'sound_typewriter',
    category: 'sound',
    name: 'Máquina de Escribir',
    desc: 'Martillazos mecánicos metálicos con impacto sólido en la platina.',
    price: 650,
    previewText: '🔊 [Mechanical Hammer]'
  },

  // --- TÍTULOS DE HACKER DINÁMICOS ---
  {
    id: 'title_script_kiddie',
    category: 'title',
    name: '[Script Kiddie]',
    desc: 'Título inicial para recién iniciados en el combate cibernético.',
    price: 0,
    titleValue: '[Script Kiddie]'
  },
  {
    id: 'title_packet_sniffer',
    category: 'title',
    name: '[Packet Sniffer]',
    desc: 'Especialista en captura e intercepción de tráfico en subredes.',
    price: 300,
    titleValue: '[Packet Sniffer]'
  },
  {
    id: 'title_cyber_mercenary',
    category: 'title',
    name: '[Cyber Mercenary]',
    desc: 'Veterano con contratos y ofensivas exitosas a su favor.',
    price: 600,
    titleValue: '[Cyber Mercenary]'
  },
  {
    id: 'title_zeroday_god',
    category: 'title',
    name: '[Zero-Day God]',
    desc: 'Dominio absoluto de exploits no parcheados y brechas críticas.',
    price: 1200,
    titleValue: '[Zero-Day God]'
  },
  {
    id: 'title_kernel_slayer',
    category: 'title',
    name: '[Kernel Slayer]',
    desc: 'Famoso por causar Kernel Panic destruyendo /boot/kernel.sys.',
    price: 500,
    titleValue: '[Kernel Slayer]'
  },
  {
    id: 'title_ghost_shell',
    category: 'title',
    name: '[Ghost in the Shell]',
    desc: 'El título de mayor prestigio. Intrusión indetectable.',
    price: 2000,
    titleValue: '[Ghost in the Shell]'
  }
];

class BlackMarketController {
  constructor() {
    this.currentCategory = 'theme';
    this.dom = {
      modal: document.getElementById('modal-market'),
      btnClose: document.getElementById('btn-close-market'),
      grid: document.getElementById('market-items-grid'),
      tabs: document.querySelectorAll('.market-tab-btn'),
      userCoinsBadge: document.getElementById('header-bytecoins-val'),
      headerRankBadge: document.getElementById('header-rank-badge'),
      headerRankText: document.getElementById('header-rank-text'),
      btnOpenMarket: document.getElementById('btn-open-market'),
      modalCoinsVal: document.getElementById('market-modal-coins-val')
    };

    this.initEvents();
    this.applyEquippedSettings();
  }

  initEvents() {
    // Abrir modal de tienda
    if (this.dom.btnOpenMarket) {
      this.dom.btnOpenMarket.addEventListener('click', () => this.open());
    }

    // Cerrar modal
    if (this.dom.btnClose) {
      this.dom.btnClose.addEventListener('click', () => this.close());
    }

    // Pestañas
    this.dom.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.dom.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentCategory = tab.dataset.category;
        this.renderCatalog();
        if (window.cyberAudio) window.cyberAudio.playBeep(700, 0.05);
      });
    });

    // Suscripción a cambios en la economía
    if (window.hackWarsEconomy) {
      window.hackWarsEconomy.subscribe(profile => {
        this.updateHeader(profile);
      });
    }
  }

  open() {
    if (this.dom.modal) {
      this.dom.modal.style.display = 'flex';
      this.renderCatalog();
      if (window.cyberAudio) window.cyberAudio.playSuccess();
    }
  }

  close() {
    if (this.dom.modal) {
      this.dom.modal.style.display = 'none';
      // Restaurar tema equipado por si estaba previsualizando
      this.applyEquippedSettings();
    }
  }

  updateHeader(profile) {
    if (this.dom.userCoinsBadge) {
      this.dom.userCoinsBadge.textContent = profile.bytecoins.toLocaleString();
    }
    if (this.dom.modalCoinsVal) {
      this.dom.modalCoinsVal.textContent = profile.bytecoins.toLocaleString();
    }
    if (this.dom.headerRankText) {
      const rank = window.hackWarsEconomy.getRankInfo(profile.elo);
      this.dom.headerRankText.textContent = `${rank.name} • ${profile.elo} ELO`;
    }
  }

  applyEquippedSettings() {
    const profile = window.hackWarsEconomy.profile;
    // 1. Aplicar tema al body
    document.body.setAttribute('data-theme', profile.equippedTheme || 'theme_matrix');

    // 2. Aplicar soundpack
    if (window.cyberAudio) {
      window.cyberAudio.setSoundpack(profile.equippedSound || 'sound_default');
    }

    // 3. Actualizar prefijo del prompt con el título de hacker
    this.updatePromptPrefix();
  }

  updatePromptPrefix() {
    const profile = window.hackWarsEconomy.profile;
    const promptPrefix = document.getElementById('prompt-prefix');
    if (promptPrefix) {
      const title = profile.equippedTitle || '[Script Kiddie]';
      promptPrefix.textContent = `${title} root@node:~#`;
    }
  }

  renderCatalog() {
    if (!this.dom.grid) return;
    this.dom.grid.innerHTML = '';

    const items = MARKET_CATALOG.filter(i => i.category === this.currentCategory);
    const profile = window.hackWarsEconomy.profile;

    items.forEach(item => {
      const isUnlocked = window.hackWarsEconomy.isUnlocked(item.id);
      let isEquipped = false;

      if (item.category === 'theme') isEquipped = profile.equippedTheme === item.id;
      if (item.category === 'sound') isEquipped = profile.equippedSound === item.id;
      if (item.category === 'title') isEquipped = profile.equippedTitle === (item.titleValue || item.name);

      const card = document.createElement('div');
      card.className = `market-card ${isEquipped ? 'equipped' : ''}`;

      // Cabecera de la tarjeta
      const topDiv = document.createElement('div');
      topDiv.className = 'market-card-top';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'market-card-title';
      titleSpan.textContent = item.name;

      const priceSpan = document.createElement('span');
      priceSpan.className = 'market-price';
      priceSpan.innerHTML = item.price === 0 ? 'GRATIS' : `${item.price} ฿`;

      topDiv.appendChild(titleSpan);
      topDiv.appendChild(priceSpan);

      // Descripción
      const descP = document.createElement('p');
      descP.className = 'market-card-desc';
      descP.textContent = item.desc;

      // Vista previa según categoría
      const previewDiv = document.createElement('div');
      previewDiv.className = 'market-preview-box';

      if (item.category === 'theme') {
        previewDiv.style.cssText = item.previewStyle;
        previewDiv.textContent = 'TERMINAL PREVIEW';
        // Hover temporal para previsualizar tema
        card.addEventListener('mouseenter', () => {
          document.body.setAttribute('data-theme', item.id);
        });
        card.addEventListener('mouseleave', () => {
          this.applyEquippedSettings();
        });
      } else if (item.category === 'sound') {
        previewDiv.textContent = item.previewText;
        previewDiv.style.cursor = 'pointer';
        previewDiv.title = 'Haz click para escuchar muestra de sonido';
        previewDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          const prev = window.cyberAudio.currentSoundpack;
          window.cyberAudio.setSoundpack(item.id);
          for (let i = 0; i < 4; i++) {
            setTimeout(() => window.cyberAudio.playKey(), i * 90);
          }
          setTimeout(() => window.cyberAudio.setSoundpack(prev), 450);
        });
      } else if (item.category === 'title') {
        previewDiv.textContent = `${item.titleValue} root@node:~#`;
        previewDiv.style.color = 'var(--color-green)';
      }

      // Botón de Acción
      const actionBtn = document.createElement('button');
      actionBtn.className = 'btn-market-action';

      if (isEquipped) {
        actionBtn.textContent = 'EQUIPADO ✓';
        actionBtn.classList.add('btn-equipped');
        actionBtn.disabled = true;
      } else if (isUnlocked) {
        actionBtn.textContent = 'EQUIPAR';
        actionBtn.addEventListener('click', () => {
          window.hackWarsEconomy.equipItem(item.category, item.titleValue || item.id);
          this.applyEquippedSettings();
          this.renderCatalog();
          if (window.cyberAudio) window.cyberAudio.playSuccess();
        });
      } else {
        const canAfford = profile.bytecoins >= item.price;
        actionBtn.textContent = canAfford ? `DESBLOQUEAR (${item.price} ฿)` : `FALTAN ${item.price - profile.bytecoins} ฿`;
        actionBtn.disabled = !canAfford;

        actionBtn.addEventListener('click', () => {
          if (window.hackWarsEconomy.unlockItem(item.id, item.price)) {
            window.hackWarsEconomy.equipItem(item.category, item.titleValue || item.id);
            this.applyEquippedSettings();
            this.renderCatalog();
          }
        });
      }

      card.appendChild(topDiv);
      card.appendChild(descP);
      card.appendChild(previewDiv);
      card.appendChild(actionBtn);

      this.dom.grid.appendChild(card);
    });
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.blackMarket = new BlackMarketController();
});
