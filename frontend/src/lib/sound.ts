import { Howl } from 'howler';

/**
 * Sound Effects Manager
 */
class SoundManager {
  private sounds: Map<string, Howl> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Tarayıcı localStorage'dan ses ayarını oku
    const savedEnabled = localStorage.getItem('soundEnabled');
    const savedVolume = localStorage.getItem('soundVolume');
    
    if (savedEnabled !== null) {
      this.enabled = savedEnabled === 'true';
    }
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }

    this.initSounds();
  }

  /**
   * Ses efektlerini yükle
   */
  private initSounds() {
    // Basit beep sesleri için data URL kullan
    // Gerçek projede external sound files kullanılabilir
    
    this.sounds.set('click', new Howl({
      src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZKA=='],
      volume: this.volume,
    }));

    this.sounds.set('success', new Howl({
      src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA=='],
      volume: this.volume * 1.2,
    }));

    this.sounds.set('error', new Howl({
      src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgoWEcV5afI+mnohgNjVfn9DYp2UfBz6X1+7BciEELIDK796JOAobaLjn4J1PDAxQpd7ts2EaBzaN0+zFcCYFJXXC6tSMPwsVXK/f56NUFApFm9rqumseAzCE0PLRgzIFHWu87tmVQw=='],
      volume: this.volume,
    }));

    this.sounds.set('notification', new Howl({
      src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZMQ=='],
      volume: this.volume * 0.8,
    }));

    this.sounds.set('sale', new Howl({
      src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZIA=='],
      volume: this.volume * 1.5,
    }));
  }

  /**
   * Ses çal
   */
  play(soundName: string) {
    if (!this.enabled) return;

    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.play();
    }
  }

  /**
   * Click sesi
   */
  playClick() {
    this.play('click');
  }

  /**
   * Success sesi
   */
  playSuccess() {
    this.play('success');
  }

  /**
   * Error sesi
   */
  playError() {
    this.play('error');
  }

  /**
   * Notification sesi
   */
  playNotification() {
    this.play('notification');
  }

  /**
   * Sale complete sesi
   */
  playSale() {
    this.play('sale');
  }

  /**
   * Sesi aç/kapat
   */
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', String(this.enabled));
    return this.enabled;
  }

  /**
   * Ses seviyesini ayarla (0-1 arası)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundVolume', String(this.volume));
    
    // Tüm seslerin volume'ünü güncelle
    this.sounds.forEach(sound => {
      sound.volume(this.volume);
    });
  }

  /**
   * Ses aktif mi?
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Mevcut volume
   */
  getVolume() {
    return this.volume;
  }
}

// Singleton instance
export const soundManager = new SoundManager();

