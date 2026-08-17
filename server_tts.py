import sys
import os
import asyncio
import io
import tempfile
import subprocess
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# 1. 동영상편집프로그램 경로 추가 및 TTSManager 임포트
editor_path = r"C:\Users\Administrator\ai_brain\Programs\동영상편집프로그램"
if editor_path not in sys.path:
    sys.path.append(editor_path)

try:
    from core.tts_manager import TTSManager
    print("[TTS Server] core.tts_manager loaded successfully")
except Exception as e:
    print(f"[TTS Server] core.tts_manager load warning: {e}")
    TTSManager = None

import edge_tts

app = Flask(__name__)
CORS(app)

VOICES = [
    {"id": "ko-KR-SunHiNeural", "name": "여성 음성 (선희)", "gender": "female"},
    {"id": "ko-KR-InJoonNeural", "name": "남성 음성 (인준)", "gender": "male"},
    {"id": "ko-KR-HyunsuMultilingualNeural", "name": "남성 음성 (현수)", "gender": "male"},
    {"id": "en-US-AriaNeural", "name": "영어 여성 (Aria)", "gender": "female"}
]

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Bible TTS Server is running"})

@app.route('/api/voices', methods=['GET'])
def get_voices():
    return jsonify(VOICES)

async def _generate_audio(text, voice, rate="+0%"):
    # TTSManager가 있는 경우 정제 및 세그먼트 분석 활용
    cleaned_text = text
    if TTSManager:
        try:
            cleaned_text = TTSManager.clean_text(text)
        except Exception as e:
            print(f"텍스트 정제 중 예외: {e}")

    if not cleaned_text.strip():
        cleaned_text = text.strip()

    communicate = edge_tts.Communicate(cleaned_text, voice, rate=rate)
    
    # 임시 파일로 저장하여 반환
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, f"bible_tts_{os.getpid()}_{hash(text) & 0xFFFFFFFF}.mp3")
    
    await communicate.save(temp_path)
    return temp_path

@app.route('/api/tts', methods=['GET', 'POST'])
def generate_tts():
    try:
        if request.method == 'POST':
            data = request.json or {}
            text = data.get('text', '')
            raw_voice = data.get('voice', 'ko-KR-InJoonNeural')
            rate = data.get('rate', '+0%')
        else:
            text = request.args.get('text', '')
            raw_voice = request.args.get('voice', 'ko-KR-InJoonNeural')
            rate = request.args.get('rate', '+0%')

        voice = raw_voice.replace('edge:', '').strip()
        if not voice:
            voice = 'ko-KR-InJoonNeural'

        if not text.strip():
            return jsonify({"error": "텍스트가 비어있습니다."}), 400

        # asyncio를 이용해 edge_tts 오디오 생성
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        output_file = loop.run_until_complete(_generate_audio(text, voice, rate))
        loop.close()

        if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
            def remove_file_after():
                try:
                    if os.path.exists(output_file):
                        os.remove(output_file)
                except Exception:
                    pass

            # io.BytesIO로 메모리에 로드 후 임시 파일 삭제
            with open(output_file, 'rb') as f:
                audio_bytes = io.BytesIO(f.read())

            remove_file_after()
            return send_file(
                audio_bytes,
                mimetype="audio/mpeg",
                as_attachment=False,
                download_name="speech.mp3"
            )
        else:
            return jsonify({"error": "오디오 합성 생성 실패"}), 500

    except Exception as e:
        import traceback
        print(f"TTS Error: {e}\n{traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("TTS_PORT", 5050))
    print(f"[TTS Server] Bible TTS Server running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
