/* ============================================
   SOUND EFFECTS SYSTEM
   Web Audio API - Programmatic Sounds
   Microsoft Fluent Design System
   ============================================ */

class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize AudioContext on first user interaction
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume AudioContext on any user interaction
      const resumeAudio = () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      };
      
      // Listen for user interactions
      document.addEventListener('click', resumeAudio, { once: true });
      document.addEventListener('keydown', resumeAudio, { once: true });
      document.addEventListener('touchstart', resumeAudio, { once: true });
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private async playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.enabled || !this.audioContext) return;

    try {
      // Resume AudioContext if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.value = volume;

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Error playing sound', e);
    }
  }

  // 🔊 Barcode scanned - Short beep
  beep() {
    this.playTone(1000, 0.1, 'square', 0.2);
  }

  // ✅ Success - Pleasant ding (2 tones)
  success() {
    if (!this.enabled || !this.audioContext) return;
    
    this.playTone(800, 0.1, 'sine', 0.25);
    setTimeout(() => this.playTone(1200, 0.15, 'sine', 0.2), 100);
  }

  // ❌ Error - Low buzz
  error() {
    if (!this.enabled || !this.audioContext) return;
    
    this.playTone(200, 0.15, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(150, 0.15, 'sawtooth', 0.3), 100);
  }

  // 💰 Cash register - Classic ding
  cashRegister() {
    if (!this.enabled || !this.audioContext) return;
    
    this.playTone(1500, 0.08, 'sine', 0.3);
    setTimeout(() => this.playTone(1200, 0.1, 'sine', 0.25), 80);
    setTimeout(() => this.playTone(900, 0.12, 'sine', 0.2), 180);
  }

  // 🗑️ Delete item - Soft pop
  delete() {
    this.playTone(600, 0.08, 'triangle', 0.2);
  }

  // 📦 Add to cart - Short click
  click() {
    this.playTone(1200, 0.05, 'square', 0.15);
  }

  // ⚠️ Warning - Two-tone alert
  warning() {
    if (!this.enabled || !this.audioContext) return;
    
    this.playTone(800, 0.1, 'square', 0.25);
    setTimeout(() => this.playTone(600, 0.1, 'square', 0.25), 120);
  }
}

// Singleton instance
export const soundEffects = new SoundEffects();

// localStorage key
const SOUND_SETTINGS_KEY = 'pos_sound_enabled';

// Load settings from localStorage
if (typeof window !== 'undefined') {
  const savedSetting = localStorage.getItem(SOUND_SETTINGS_KEY);
  if (savedSetting !== null) {
    soundEffects.setEnabled(savedSetting === 'true');
  }
}

// Save settings helper
export const saveSoundSettings = (enabled: boolean) => {
  soundEffects.setEnabled(enabled);
  if (typeof window !== 'undefined') {
    localStorage.setItem(SOUND_SETTINGS_KEY, String(enabled));
  }
};

export const getSoundSettings = (): boolean => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(SOUND_SETTINGS_KEY);
    return saved === null ? true : saved === 'true';
  }
  return true;
};
