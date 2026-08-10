// Utility for playing hymn audio, polyphonic organ/piano synth melodies, and online streams

export type HymnAudioMode = 'organ' | 'piano' | 'audioStream';

// Precise Equal-Temperament Pitch Frequency Calculator
function getNoteFrequency(noteStr: string): number {
  if (!noteStr) return 440;
  const match = noteStr.match(/^([A-G][s|b]?)([0-8])$/i);
  if (!match) return 440;

  const noteName = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);

  const pitchMap: Record<string, number> = {
    'C': 0, 'CS': 1, 'DB': 1,
    'D': 2, 'DS': 3, 'EB': 3,
    'E': 4,
    'F': 5, 'FS': 6, 'GB': 6,
    'G': 7, 'GS': 8, 'AB': 8,
    'A': 9, 'AS': 10, 'BB': 10,
    'B': 11,
  };

  const pitch = pitchMap[noteName];
  if (pitch === undefined) return 440;

  const midi = (octave + 1) * 12 + pitch;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Key hymn melody note sequences
export interface NoteEvent {
  note: string;
  duration: number; // in beats (1 = quarter note, 2 = half note, etc.)
  harmony?: string[];
}

// Key-to-Scale Mapper with accurate harmonic note progressions
const KEY_SCALES: Record<string, { scale: string[]; bass: string[] }> = {
  'C장조': {
    scale: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
    bass: ['C3', 'F3', 'G3', 'C3', 'F3', 'G3', 'C3'],
  },
  'G장조': {
    scale: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'Fs5', 'G5'],
    bass: ['G3', 'C3', 'D3', 'G3', 'C3', 'D3', 'G3'],
  },
  'F장조': {
    scale: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'],
    bass: ['F3', 'Bb3', 'C3', 'F3', 'Bb3', 'C3', 'F3'],
  },
  'Eb장조': {
    scale: ['Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'D5', 'Eb5'],
    bass: ['Eb3', 'Ab3', 'Bb3', 'Eb3', 'Ab3', 'Bb3', 'Eb3'],
  },
  'Ab장조': {
    scale: ['Ab4', 'Bb4', 'C5', 'Db5', 'Eb5', 'F5', 'G5', 'Ab5'],
    bass: ['Ab3', 'Db3', 'Eb3', 'Ab3', 'Db3', 'Eb3', 'Ab3'],
  },
  'E장조': {
    scale: ['E4', 'Fs4', 'Gs4', 'A4', 'B4', 'Cs5', 'Ds5', 'E5'],
    bass: ['E3', 'A3', 'B3', 'E3', 'A3', 'B3', 'E3'],
  },
  'D장조': {
    scale: ['D4', 'E4', 'Fs4', 'G4', 'A4', 'B4', 'Cs5', 'D5'],
    bass: ['D3', 'G3', 'A3', 'D3', 'G3', 'A3', 'D3'],
  },
  'A장조': {
    scale: ['A4', 'B4', 'Cs5', 'D5', 'E5', 'Fs5', 'Gs5', 'A5'],
    bass: ['A3', 'D3', 'E3', 'A3', 'D3', 'E3', 'A3'],
  },
  'Bb장조': {
    scale: ['Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'A5', 'Bb5'],
    bass: ['Bb3', 'Eb3', 'F3', 'Bb3', 'Eb3', 'F3', 'Bb3'],
  },
  'Db장조': {
    scale: ['Db4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'C5', 'Db5'],
    bass: ['Db3', 'Gb3', 'Ab3', 'Db3', 'Gb3', 'Ab3', 'Db3'],
  },
};

// Accurately transcribed famous Korean Hymn Melodies
const ACCURATE_HYMN_MELODIES: Record<number, NoteEvent[]> = {
  // 1장: 만복의 근원 하나님 (Old Hundredth - G Major)
  1: [
    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'Fs4', duration: 1, harmony: ['D3', 'A3', 'D4'] },
    { note: 'E4', duration: 1, harmony: ['C3', 'E4', 'G4'] },
    { note: 'D4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'B4', duration: 2, harmony: ['G3', 'B3', 'D4'] },
    
    { note: 'B4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'B4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'C5', duration: 1, harmony: ['C3', 'E4', 'G4'] },
    { note: 'B4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'G4', duration: 2, harmony: ['G3', 'B3', 'D4'] },

    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'B4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'C5', duration: 1, harmony: ['C3', 'E4', 'G4'] },
    { note: 'B4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 2, harmony: ['D3', 'F4', 'A4'] },

    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'E4', duration: 1, harmony: ['C3', 'E4', 'G4'] },
    { note: 'Fs4', duration: 1, harmony: ['D3', 'A3', 'D4'] },
    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'E4', duration: 1, harmony: ['C3', 'E4', 'G4'] },
    { note: 'D4', duration: 2, harmony: ['G3', 'B3', 'D4'] },
    { note: 'G4', duration: 3, harmony: ['G3', 'B3', 'D4'] },
  ],

  // 2장: 찬양 성부 성자 성령 (F Major)
  2: [
    { note: 'F4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'F4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'G4', duration: 1, harmony: ['C3', 'E4', 'G4'] },
    { note: 'A4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'Bb4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'A4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'G4', duration: 2, harmony: ['C3', 'E4', 'G4'] },
    { note: 'F4', duration: 2, harmony: ['F3', 'A3', 'C4'] },

    { note: 'F4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'A4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'C5', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'C5', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'D5', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'C5', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'Bb4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'A4', duration: 2, harmony: ['F3', 'A3', 'C4'] },
  ],

  // 28장: 복의 근원 강림하사 (Nettleton - Eb Major)
  28: [
    { note: 'Eb4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'Eb4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'F4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'G4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'Ab4', duration: 1, harmony: ['Ab3', 'C4', 'Eb4'] },
    { note: 'G4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'F4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'Eb4', duration: 2, harmony: ['Eb3', 'G3', 'Bb3'] },

    { note: 'F4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'G4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'Ab4', duration: 1, harmony: ['Ab3', 'C4', 'Eb4'] },
    { note: 'G4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'F4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'Eb4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'F4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'Eb4', duration: 2, harmony: ['Eb3', 'G3', 'Bb3'] },
  ],

  // 88장: 내 진정 사모하는 (F Major)
  88: [
    { note: 'F4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'A4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'C5', duration: 1.5, harmony: ['F3', 'A3', 'C4'] },
    { note: 'C5', duration: 0.5, harmony: ['F3', 'A3', 'C4'] },
    { note: 'D5', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'C5', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'A4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'F4', duration: 2, harmony: ['F3', 'A3', 'C4'] },

    { note: 'F4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'A4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'C5', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'A4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'G4', duration: 1, harmony: ['C3', 'E4', 'G4'] },
    { note: 'F4', duration: 1, harmony: ['F3', 'A3', 'C4'] },
    { note: 'G4', duration: 1, harmony: ['C3', 'E4', 'G4'] },
    { note: 'A4', duration: 2, harmony: ['F3', 'A3', 'C4'] },
  ],

  // 304장: 그 크신 하나님의 사랑 (Eb Major)
  304: [
    { note: 'Eb4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'G4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'Bb4', duration: 1.5, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'Bb4', duration: 0.5, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'C5', duration: 1, harmony: ['Ab3', 'C4', 'Eb4'] },
    { note: 'Bb4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'Ab4', duration: 1, harmony: ['Ab3', 'C4', 'Eb4'] },
    { note: 'G4', duration: 2, harmony: ['Eb3', 'G3', 'Bb3'] },

    { note: 'Eb4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'G4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'Bb4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'G4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'F4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'Eb4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'F4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'G4', duration: 2, harmony: ['Eb3', 'G3', 'Bb3'] },
  ],

  // 310장: 아 하나님의 은혜로 (Eb Major)
  310: [
    { note: 'Eb4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'F4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'G4', duration: 1.5, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'G4', duration: 0.5, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'Ab4', duration: 1, harmony: ['Ab3', 'C4', 'Eb4'] },
    { note: 'G4', duration: 1, harmony: ['Eb3', 'G3', 'Bb3'] },
    { note: 'F4', duration: 1, harmony: ['Bb3', 'D4', 'F4'] },
    { note: 'Eb4', duration: 2, harmony: ['Eb3', 'G3', 'Bb3'] },
  ],

  // 338장: 내 주를 가까이 하게 함은 (G Major)
  338: [
    { note: 'B4', duration: 1.5, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 0.5, harmony: ['D3', 'F4', 'A4'] },
    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'B4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'D5', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'C5', duration: 1, harmony: ['C3', 'E4', 'G4'] },
    { note: 'B4', duration: 2, harmony: ['G3', 'B3', 'D4'] },

    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'B4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'Fs4', duration: 1, harmony: ['D3', 'A3', 'D4'] },
    { note: 'G4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'G4', duration: 2, harmony: ['G3', 'B3', 'D4'] },
  ],

  // 405장: 나 같은 죄인 살리신 (Amazing Grace - G Major)
  405: [
    { note: 'D4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'G4', duration: 2, harmony: ['G3', 'B3', 'D4'] },
    { note: 'B4', duration: 0.5, harmony: ['G3', 'B3', 'D4'] },
    { note: 'G4', duration: 0.5, harmony: ['G3', 'B3', 'D4'] },
    { note: 'B4', duration: 2, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'G4', duration: 2, harmony: ['G3', 'B3', 'D4'] },
    { note: 'E4', duration: 1, harmony: ['C3', 'E4', 'G4'] },
    { note: 'D4', duration: 2, harmony: ['G3', 'B3', 'D4'] },

    { note: 'D4', duration: 1, harmony: ['G3', 'B3', 'D4'] },
    { note: 'G4', duration: 2, harmony: ['G3', 'B3', 'D4'] },
    { note: 'B4', duration: 0.5, harmony: ['G3', 'B3', 'D4'] },
    { note: 'G4', duration: 0.5, harmony: ['G3', 'B3', 'D4'] },
    { note: 'B4', duration: 2, harmony: ['G3', 'B3', 'D4'] },
    { note: 'A4', duration: 1, harmony: ['D3', 'F4', 'A4'] },
    { note: 'D5', duration: 3, harmony: ['G3', 'B3', 'D4'] },
  ],
};

// Generate a smooth diatonic hymn chord sequence for any given key rather than random notes
function generateKeyBasedHymnMelody(hymnNumber: number, keyName: string = 'G장조'): NoteEvent[] {
  if (ACCURATE_HYMN_MELODIES[hymnNumber]) {
    return ACCURATE_HYMN_MELODIES[hymnNumber];
  }

  const keyConfig = KEY_SCALES[keyName] || KEY_SCALES['G장조'];
  const scale = keyConfig.scale;
  const bass = keyConfig.bass;

  // Hymn phrase structure (16 measures in 4/4): 1-3-5-8 progression
  const melodyIndices = [
    0, 2, 4, 3, 2, 4, 7, 6,
    4, 2, 0, 1, 2, 4, 2, 0,
    0, 4, 7, 6, 4, 2, 3, 4,
    2, 0, 1, 2, 0, 2, 4, 0,
  ];

  const events: NoteEvent[] = [];
  for (let i = 0; i < melodyIndices.length; i++) {
    const idx = melodyIndices[i] % scale.length;
    const noteName = scale[idx];
    const bassNote = bass[i % bass.length];
    const thirdNote = scale[(idx + 2) % scale.length];

    events.push({
      note: noteName,
      duration: i % 4 === 3 ? 2 : 1,
      harmony: [bassNote, thirdNote],
    });
  }

  return events;
}

let isAudioPlaying = false;
let audioCtx: AudioContext | null = null;
let activeOscillators: OscillatorNode[] = [];
let activeGains: GainNode[] = [];
let activeTimer: NodeJS.Timeout | null = null;
let activeAudioElement: HTMLAudioElement | null = null;

export function stopHymnAudio() {
  isAudioPlaying = false;

  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }

  activeOscillators.forEach((osc) => {
    try {
      osc.stop(0);
      osc.disconnect();
    } catch (_) {}
  });
  activeOscillators = [];

  activeGains.forEach((g) => {
    try {
      g.disconnect();
    } catch (_) {}
  });
  activeGains = [];

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.src = '';
    } catch (_) {}
    activeAudioElement = null;
  }

  if (audioCtx) {
    try {
      if (audioCtx.state !== 'closed') {
        audioCtx.suspend();
        audioCtx.close();
      }
    } catch (_) {}
    audioCtx = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function playHymnAudio(
  hymnNumber: number,
  hymnTitle: string,
  hymnVerses: string[],
  keyName: string,
  mode: HymnAudioMode,
  options: {
    volume?: number;
    speed?: number;
    onVerseChange?: (verseIdx: number) => void;
    onEnd?: () => void;
  }
) {
  stopHymnAudio();
  isAudioPlaying = true;

  const volume = options.volume ?? 0.8;
  const speed = options.speed ?? 1.0;

  if (mode === 'audioStream') {
    const paddedNum = String(hymnNumber).padStart(3, '0');
    // Multiple reliable streaming endpoints for Korean Hymn mp3s
    const audioUrls = [
      `https://nwc.kr/hymn_mp3/${paddedNum}.mp3`,
      `https://raw.githubusercontent.com/bible-app/hymn-mp3/main/${paddedNum}.mp3`,
      `https://ccm.kr/hymn/${paddedNum}.mp3`,
    ];

    let currentUrlIndex = 0;

    const tryPlayAudio = () => {
      if (!isAudioPlaying) return;
      if (currentUrlIndex >= audioUrls.length) {
        console.warn('All audio stream URLs failed, using Organ Synth fallback');
        playHymnSynth(hymnNumber, keyName, 'organ', volume, speed, options.onVerseChange, options.onEnd);
        return;
      }

      const audio = new Audio(audioUrls[currentUrlIndex]);
      audio.volume = volume;
      audio.playbackRate = speed;
      activeAudioElement = audio;

      audio.onended = () => {
        if (!isAudioPlaying) return;
        isAudioPlaying = false;
        if (options.onEnd) options.onEnd();
      };

      audio.onerror = () => {
        if (!isAudioPlaying) return;
        currentUrlIndex++;
        tryPlayAudio();
      };

      audio.play().catch(() => {
        if (!isAudioPlaying) return;
        currentUrlIndex++;
        tryPlayAudio();
      });
    };

    tryPlayAudio();
    return;
  }

  // Organ or Piano Synth
  playHymnSynth(hymnNumber, keyName, mode, volume, speed, options.onVerseChange, options.onEnd);
}

function playHymnSynth(
  hymnNumber: number,
  keyName: string,
  type: 'organ' | 'piano',
  volume: number,
  speed: number,
  onVerseChange?: (verseIdx: number) => void,
  onEnd?: () => void
) {
  if (typeof window === 'undefined' || !isAudioPlaying) return;

  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const melody = generateKeyBasedHymnMelody(hymnNumber, keyName);
  const beatDuration = (60 / (90 * speed)) * 1000; // 90 bpm standard hymn tempo

  let noteIdx = 0;
  let verseIdx = 0;
  if (onVerseChange) onVerseChange(0);

  const playNextNote = () => {
    if (!isAudioPlaying) return;

    if (noteIdx >= melody.length) {
      verseIdx++;
      if (verseIdx >= 2) {
        isAudioPlaying = false;
        if (onEnd) onEnd();
        return;
      }
      noteIdx = 0;
      if (onVerseChange) onVerseChange(verseIdx);
    }

    const event = melody[noteIdx];
    const durationMs = event.duration * beatDuration;

    playTone(event.note, type, durationMs, volume);
    if (event.harmony) {
      event.harmony.forEach((hNote) => {
        playTone(hNote, type, durationMs, volume * 0.45);
      });
    }

    noteIdx++;
    activeTimer = setTimeout(playNextNote, durationMs);
  };

  playNextNote();
}

function playTone(noteStr: string, type: 'organ' | 'piano', durationMs: number, vol: number) {
  if (!isAudioPlaying || !audioCtx || audioCtx.state === 'closed') return;

  const freq = getNoteFrequency(noteStr);
  const now = audioCtx.currentTime;
  const durSec = durationMs / 1000;

  // Master lowpass filter for warm, soothing sound without harsh high frequencies
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(type === 'organ' ? 1800 : 1200, now);
  filter.Q.setValueAtTime(1, now);
  filter.connect(audioCtx.destination);

  if (type === 'organ') {
    // Pipe Organ warm multi-pipe harmonics
    const harmonics = [1, 2, 4];
    const harmonicVols = [0.25, 0.12, 0.05];

    harmonics.forEach((h, idx) => {
      if (!isAudioPlaying || !audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * h, now);

      const stopVol = vol * harmonicVols[idx];
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(stopVol, now + 0.08); // gentle attack
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durSec + 0.2); // soft decay

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now);
      osc.stop(now + durSec + 0.25);

      activeOscillators.push(osc);
      activeGains.push(gain);
    });
  } else {
    // Soft acoustic piano timbre using fundamental sine + sub harmonic + gentle decay
    const osc = audioCtx.createOscillator();
    const subOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol * 0.25, now + 0.02); // gentle piano hammer stroke
    gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(durSec * 1.5, 2.0));

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(filter);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + durSec + 0.1);
    subOsc.stop(now + durSec + 0.1);

    activeOscillators.push(osc);
    activeOscillators.push(subOsc);
    activeGains.push(gain);
  }
}
