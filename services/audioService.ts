class AudioService {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isEnabled = true;
  }

  playTone(type: string) {
    if (!this.isEnabled || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    if (type.includes('shinkansen')) {
      osc.type = 'sawtooth'; 
      osc.frequency.setValueAtTime(600, now); 
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.4);
      gainNode.gain.setValueAtTime(0.15, now); 
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); 
      osc.start(now); 
      osc.stop(now + 0.4);
    } else if (['rapit','kuroshio','special_rapid'].includes(type)) {
      osc.type = 'square'; 
      osc.frequency.setValueAtTime(200, now); 
      osc.frequency.linearRampToValueAtTime(150, now + 0.3);
      gainNode.gain.setValueAtTime(0.2, now); 
      gainNode.gain.linearRampToValueAtTime(0, now + 0.4); 
      osc.start(now); 
      osc.stop(now + 0.4);
    } else if (type.includes('local') || type === 'medetai') {
      osc.type = 'square'; 
      osc.frequency.setValueAtTime(350, now); 
      osc.frequency.setValueAtTime(300, now + 0.2);
      gainNode.gain.setValueAtTime(0.1, now); 
      gainNode.gain.linearRampToValueAtTime(0, now + 0.4); 
      osc.start(now); 
      osc.stop(now + 0.4);
    } else {
      // Cars/Others
      osc.type = 'triangle'; 
      const pitch = 200 + Math.random() * 150; 
      osc.frequency.setValueAtTime(pitch, now);
      gainNode.gain.setValueAtTime(0.1, now); 
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15); 
      osc.start(now); 
      osc.stop(now + 0.15);
    }
  }
}

export const audioService = new AudioService();
