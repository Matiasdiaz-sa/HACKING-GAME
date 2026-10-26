// ==========================================================================
// HACKWARS // ECONOMY & GAMIFICATION MODULE
// Gestiona Bytecoins (฿), Rangos ELO, Títulos y Estadísticas del Jugador
// ==========================================================================

class EconomyManager {
  constructor() {
    this.storageKey = 'hackwars_player_profile_v1';
    this.profile = this.loadProfile();
    this.listeners = new Set();
    this.checkDailyStreak();
  }

  // Cargar o inicializar perfil con valores por defecto
  loadProfile() {
    const defaultProfile = {
      username: localStorage.getItem('hackwars_alias') || 'Hacker_Zero',
      bytecoins: 200, // Saldo de bienvenida para incentivar uso de la tienda
      elo: 1000,
      equippedTheme: 'theme_matrix',
      equippedSound: 'sound_default',
      equippedTitle: '[Script Kiddie]',
      unlockedItems: ['theme_matrix', 'sound_default', 'title_script_kiddie'],
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        firstBloods: 0,
        kernelsDestroyed: 0,
        flagsCaptured: 0,
        exploitsDefended: 0,
        fastestWinSec: null
      },
      dailyStreak: 1,
      lastDailyCheckDate: new Date().toISOString().split('T')[0]
    };

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultProfile,
          ...parsed,
          stats: { ...defaultProfile.stats, ...(parsed.stats || {}) },
          unlockedItems: parsed.unlockedItems || defaultProfile.unlockedItems
        };
      }
    } catch (e) {
      console.warn('[ECONOMY] Error cargando perfil:', e);
    }

    this.saveProfile(defaultProfile);
    return defaultProfile;
  }

  // Persistir en LocalStorage
  saveProfile(customProfile = null) {
    if (customProfile) this.profile = customProfile;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
      this.notifyListeners();
    } catch (e) {
      console.error('[ECONOMY] Error guardando perfil:', e);
    }
  }

  // Suscribirse a cambios en la economía (Reactivo)
  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.profile);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb(this.profile);
      } catch (err) {
        console.error('[ECONOMY] Error en listener:', err);
      }
    }
  }

  // Añadir Bytecoins con notificación visual flotante
  addBytecoins(amount, reason = '') {
    if (amount <= 0) return;
    this.profile.bytecoins += amount;
    this.saveProfile();
    this.showToast(`+${amount} ฿ ${reason}`);
    if (window.cyberAudio) window.cyberAudio.playSuccess();
  }

  // Descontar Bytecoins
  spendBytecoins(amount) {
    if (this.profile.bytecoins < amount) return false;
    this.profile.bytecoins -= amount;
    this.saveProfile();
    if (window.cyberAudio) window.cyberAudio.playBeep(440, 0.1);
    return true;
  }

  // Obtener Rango y División ELO según la escala del README
  getRankInfo(elo = this.profile.elo) {
    if (elo >= 7000) return { name: 'Exabyte 1337', badgeClass: 'rank-exabyte', tier: 6 };
    if (elo >= 5000) return { name: 'Terabyte', badgeClass: 'rank-terabyte', tier: 5 };
    if (elo >= 3500) return { name: 'Gigabyte', badgeClass: 'rank-gigabyte', tier: 4 };
    if (elo >= 2000) return { name: 'Megabyte', badgeClass: 'rank-megabyte', tier: 3 };
    if (elo >= 1000) return { name: 'Kilobyte', badgeClass: 'rank-kilobyte', tier: 2 };
    return { name: 'Byte 0', badgeClass: 'rank-byte0', tier: 1 };
  }

  // Actualizar ELO al finalizar partida
  updateElo(isWin, isBot = false) {
    let delta = 0;
    if (isBot) {
      delta = isWin ? 10 : 0; // Contra bot solo se gana poco ELO y no se pierde
    } else {
      delta = isWin ? 30 : -15; // PvP estándar
    }

    this.profile.elo = Math.max(0, this.profile.elo + delta);
    this.saveProfile();
    return { newElo: this.profile.elo, delta };
  }

  // Registrar resultado de combate y liquidar recompensas oficiales
  recordMatch(data) {
    const { isWinner, winType, durationSec, isBot } = data;
    this.profile.stats.matchesPlayed++;

    let earnedCoins = 0;
    const rewards = [];

    if (isWinner) {
      this.profile.stats.wins++;
      const baseWin = isBot ? 40 : 100;
      earnedCoins += baseWin;
      rewards.push({ label: isBot ? 'Victoria vs Bot IA' : 'Victoria PvP', amount: baseWin });

      // Récord de tiempo más rápido
      if (durationSec && (!this.profile.stats.fastestWinSec || durationSec < this.profile.stats.fastestWinSec)) {
        this.profile.stats.fastestWinSec = durationSec;
      }

      // Bonus según método de victoria
      if (winType === 'KERNEL_PANIC') {
        this.profile.stats.kernelsDestroyed++;
        earnedCoins += 75;
        rewards.push({ label: 'Destrucción de Kernel (rm /boot/kernel.sys)', amount: 75 });
      } else if (winType === 'FLAG_SUBMIT') {
        this.profile.stats.flagsCaptured++;
        earnedCoins += 50;
        rewards.push({ label: 'Captura de Bandera (CTF Submit)', amount: 50 });
      } else if (winType === 'DEFACE_EASTER_EGG') {
        earnedCoins += 120;
        rewards.push({ label: 'Defacement Secreto (Easter Egg GANE)', amount: 120 });
      }
    } else {
      this.profile.stats.losses++;
      // Recompensa de consolación por participación
      earnedCoins += 15;
      rewards.push({ label: 'Participación en Combate', amount: 15 });
    }

    this.profile.bytecoins += earnedCoins;
    const eloResult = this.updateElo(isWinner, isBot);
    this.saveProfile();

    return {
      earnedCoins,
      rewards,
      eloResult,
      rank: this.getRankInfo()
    };
  }

  // Desbloqueo y equipamiento de ítems
  isUnlocked(itemId) {
    return this.profile.unlockedItems.includes(itemId);
  }

  unlockItem(itemId, price) {
    if (this.isUnlocked(itemId)) return true;
    if (!this.spendBytecoins(price)) return false;

    this.profile.unlockedItems.push(itemId);
    this.saveProfile();
    this.showToast(`¡Ítem desbloqueado con éxito!`);
    return true;
  }

  equipItem(type, itemId) {
    if (!this.isUnlocked(itemId)) return false;
    if (type === 'theme') {
      this.profile.equippedTheme = itemId;
    } else if (type === 'sound') {
      this.profile.equippedSound = itemId;
    } else if (type === 'title') {
      this.profile.equippedTitle = itemId;
    }
    this.saveProfile();
    return true;
  }

  // Notificación tipo toast flotante
  showToast(message) {
    const existing = document.querySelector('.coin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'coin-toast';
    toast.innerHTML = `<span style="font-size: 18px;">🪙</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Recompensa diaria de conexión (Daily Streak)
  checkDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = this.profile.lastDailyCheckDate;

    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastDate === yesterday) {
        this.profile.dailyStreak = (this.profile.dailyStreak || 1) + 1;
      } else {
        this.profile.dailyStreak = 1;
      }

      this.profile.lastDailyCheckDate = today;
      let streakBonus = 20;
      if (this.profile.dailyStreak === 3) streakBonus = 60;
      if (this.profile.dailyStreak >= 7) streakBonus = 200;

      this.profile.bytecoins += streakBonus;
      this.saveProfile();
      setTimeout(() => {
        this.showToast(`¡Racha Diaria (Día ${this.profile.dailyStreak})! Recibes +${streakBonus} ฿`);
      }, 1500);
    }
  }
}

// Instancia única accesible globalmente
window.hackWarsEconomy = new EconomyManager();
