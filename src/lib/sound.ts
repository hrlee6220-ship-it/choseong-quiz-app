"use client";

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, delay = 0, type: OscillatorType = "sine", gainValue = 0.14) {
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  // 1차 힌트 (받침 전체 공개) 효과음
  playHint1() {
    this.playTone(523.25, 0.14, 0, "triangle", 0.16); // C5
    this.playTone(659.25, 0.22, 0.1, "triangle", 0.18); // E5
  }

  // 2차 힌트 (글자 하나 선택 모음 공개) 효과음
  playHint2() {
    this.playTone(587.33, 0.12, 0, "sine", 0.16); // D5
    this.playTone(880.0, 0.2, 0.07, "sine", 0.18); // A5
  }

  // 정답 공개 팡파르 효과음
  playAnswerReveal() {
    this.playTone(523.25, 0.14, 0, "triangle", 0.18); // C5
    this.playTone(659.25, 0.14, 0.1, "triangle", 0.18); // E5
    this.playTone(783.99, 0.14, 0.2, "triangle", 0.18); // G5
    this.playTone(1046.5, 0.42, 0.3, "triangle", 0.22); // C6
  }

  // 문제 넘기기 / 셔플 효과음
  playNextItem() {
    this.playTone(440, 0.09, 0, "sine", 0.1);
    this.playTone(554.37, 0.12, 0.06, "sine", 0.12);
  }
}

export const soundFX = new SoundEffects();
