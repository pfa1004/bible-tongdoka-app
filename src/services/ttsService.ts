export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
}

export const VOICES: VoiceOption[] = [
  { id: 'ko-KR-InJoonNeural', name: '👨 AI 남성 음성 (인준 - 한국어)', gender: 'male' },
  { id: 'ko-KR-HyunsuMultilingualNeural', name: '👨 AI 남성 음성 (현수 - 한국어)', gender: 'male' },
  { id: 'ko-KR-SunHiNeural', name: '👩 AI 여성 음성 (선희 - 한국어)', gender: 'female' },
  { id: 'en-US-AriaNeural', name: '👱‍♀️ AI 영어 여성 (Aria - 영어)', gender: 'female' },
  { id: 'en-US-GuyNeural', name: '👱‍♂️ AI 영어 남성 (Guy - 영어)', gender: 'male' },
];

export async function fetchVoices(): Promise<VoiceOption[]> {
  return VOICES;
}

function cleanText(text: string): string {
  let cleaned = text.replace(/https?:\/\/\S+/g, '');
  cleaned = cleaned.replace(/\[.*?\]\(.*?\)/g, '');
  cleaned = cleaned.replace(/\[.*?\]/g, '');
  cleaned = cleaned.replace(/\(.*?\)/g, '');
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');
  cleaned = cleaned.replace(/\*{1,3}(.*?)\*{1,3}/g, '$1');
  cleaned = cleaned.replace(/^\s*[\*\-•]\s*/gm, '');
  cleaned = cleaned.replace(/-/g, ' ');
  cleaned = cleaned.replace(/[^0-9a-zA-Z가-힣\.\,\?\!\s\/]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned || text.trim();
}

/**
 * 모바일/PC 어디서나 서버 없이 MS Edge TTS 서버에 직접 WebSocket 연결하는 무결점 엔진
 */
function generateDirectEdgeTTSAudioUrl(
  text: string,
  voice: string,
  rate: string = '+0%'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const cleanedText = cleanText(text);
    if (!cleanedText) {
      reject(new Error('텍스트가 비어있습니다.'));
      return;
    }

    const TRUSTED_TOKEN = '6A5AA1D4EA5E40C99C49C23C13507056';
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    const audioChunks: Uint8Array[] = [];
    const requestId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const dateStr = new Date().toUTCString();

    const timer = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try { ws.close(); } catch {}
      }
      reject(new Error('TTS WebSocket 통신 시간 초과'));
    }, 3000);

    ws.onopen = () => {
      // 1. Config 헤더 전송
      const configMsg =
        `X-Timestamp:${dateStr}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        `{"context":{"synthesis":{"client":{"name":"Client","version":"10.0.22621.1413"}}}}`;
      ws.send(configMsg);

      // 2. SSML 전송
      const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ko-KR'>` +
        `<voice name='${voice}'>` +
        `<prosody pitch='+0Hz' rate='${rate}'>${cleanedText}</prosody>` +
        `</voice>` +
        `</speak>`;

      const ssmlMsg =
        `X-RequestId:${requestId}\r\n` +
        `X-Timestamp:${dateStr}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;

      ws.send(ssmlMsg);
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          clearTimeout(timer);
          try { ws.close(); } catch {}

          if (audioChunks.length === 0) {
            reject(new Error('오디오 데이터를 수신하지 못했습니다.'));
            return;
          }

          const blob = new Blob(audioChunks, { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(blob);
          resolve(audioUrl);
        }
      } else if (event.data instanceof ArrayBuffer) {
        const view = new DataView(event.data);
        if (view.byteLength >= 2) {
          const headerLength = view.getUint16(0, false); // Big-Endian
          if (view.byteLength >= 2 + headerLength) {
            const audioData = new Uint8Array(event.data, 2 + headerLength);
            audioChunks.push(audioData);
          }
        }
      }
    };

    ws.onerror = (err) => {
      clearTimeout(timer);
      reject(err);
    };
  });
}

export async function generateSpeechAudioUrl(
  text: string,
  voice: string = 'ko-KR-InJoonNeural',
  rate: string = '+0%'
): Promise<string> {
  const cleanVoiceId = voice.replace('edge:', '');

  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0');

  // 1차: 로컬 파이썬 edge-tts 오디오 서버 (로컬 환경일 때 즉시 합성)
  if (isLocalHost) {
    try {
      const res = await fetch('http://127.0.0.1:5050/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: cleanVoiceId, rate }),
      });
      if (res.ok) {
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn('Local Python TTS server unavailable:', e);
    }
  }

  // 2차: Direct Edge TTS WebSocket 통신 (서버 없이 브라우저에서 직접 Edge TTS 음성 생성이 가능한 무결점 엔진)
  try {
    return await generateDirectEdgeTTSAudioUrl(text, cleanVoiceId, rate);
  } catch (err) {
    console.warn('Direct Edge TTS synthesis failed, falling back to Web Speech API:', err);
    throw new Error('Web Speech API 폴백');
  }
}
