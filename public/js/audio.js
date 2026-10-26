// ==========================================================================
// HACKWARS // PROCEDURAL AUDIO ENGINE & SOUNDPACKS (Web Audio API)
// Cero descargas de archivos externos, latencia ultra baja
// ==========================================================================

class CyberAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.currentSoundpack = 'sound_default';
    this.initAudio();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    } catch (e) {
      console.warn('[AUDIO] Web Audio API no soportada:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.initAudio();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundpack(packId) {
    this.currentSoundpack = packId || 'sound_default';
  }

  // Reproducción de pulsación de teclado según el Soundpack equipado
  playKey() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    try {
      switch (this.currentSoundpack) {
        case 'sound_cherry_blue':
          // Cherry MX Blue: Click nítido de alta frecuencia + cuerpo mecánico
          this._playCherryBlue(t);
          break;

        case 'sound_model_m':
          // IBM Model M 1984: Resorte metálico pesado (Buckling Spring)
          this._playModelM(t);
          break;

        case 'sound_scifi_beeper':
          // Sci-Fi Beeper: Tono electrónico cristalino retro-futurista
          this._playSciFiBeeper(t);
          break;

        case 'sound_typewriter':
          // Máquina de escribir: Martillazo metálico con impacto en platina
          this._playTypewriter(t);
          break;

        case 'sound_default':
        default:
          // Sintetizador Cyber básico por defecto
          this._playDefaultKey(t);
          break;
      }
    } catch (_) {}
  }

  _playDefaultKey(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, t);
    gain.gain.setValueAtTime(0.015, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.04);
  }

  _playCherryBlue(t) {
    // 1. Click agudo del switch
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(2400 + Math.random() * 300, t);
    clickGain.gain.setValueAtTime(0.03, t);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
    click.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    click.start();
    click.stop(t + 0.02);

    // 2. Resonancia plástica del chasis
    const body = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(380 + Math.random() * 40, t);
    bodyGain.gain.setValueAtTime(0.02, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    body.connect(bodyGain);
    bodyGain.connect(this.ctx.destination);
    body.start();
    body.stop(t + 0.035);
  }

  _playModelM(t) {
    // Impacto metálico de resorte pesado
    const spring = this.ctx.createOscillator();
    const springGain = this.ctx.createGain();
    spring.type = 'sawtooth';
    spring.frequency.setValueAtTime(520 + Math.random() * 60, t);
    spring.frequency.exponentialRampToValueAtTime(180, t + 0.06);
    springGain.gain.setValueAtTime(0.03, t);
    springGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    spring.connect(springGain);
    springGain.connect(this.ctx.destination);
    spring.start();
    spring.stop(t + 0.06);
  }

  _playSciFiBeeper(t) {
    // Pip electrónico limpio
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200 + Math.random() * 150, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.03);
    gain.gain.setValueAtTime(0.025, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.03);
  }

  _playTypewriter(t) {
    // Golpe seco de martillo
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 + Math.random() * 30, t);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.05);
  }

  playBeep(freq = 880, duration = 0.08) {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {}
  }

  playSuccess() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.07 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.07);
        osc.stop(this.ctx.currentTime + idx * 0.07 + 0.15);
      });
    } catch (_) {}
  }

  playAlert() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (_) {}
  }

  playAlarm() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    try {
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime + i * 0.15);
        osc.frequency.linearRampToValueAtTime(450, this.ctx.currentTime + i * 0.15 + 0.12);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + i * 0.15 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.15);
        osc.stop(this.ctx.currentTime + i * 0.15 + 0.12);
      }
    } catch (_) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

window.cyberAudio = new CyberAudio();
