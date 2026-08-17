import os
import re
import asyncio
import tempfile
import edge_tts
import gradio as gr

VOICES = [
    {"id": "ko-KR-InJoonNeural", "name": "👨 AI 남성 음성 (인준)"},
    {"id": "ko-KR-HyunsuMultilingualNeural", "name": "👨 AI 남성 음성 (현수)"},
    {"id": "ko-KR-SunHiNeural", "name": "👩 AI 여성 음성 (선희)"},
    {"id": "en-US-AriaNeural", "name": "👱‍♀️ AI 영어 여성 (Aria)"},
    {"id": "en-US-GuyNeural", "name": "👱‍♂️ AI 영어 남성 (Guy)"}
]

def clean_text(text: str) -> str:
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'\[.*?\]\(.*?\)', '', text)
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'\(.*?\)', '', text)
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', text)
    text = re.sub(r'^\s*[\*\-•]\s*', '', text, flags=re.MULTILINE)
    text = text.replace('-', ' ')
    text = re.sub(r'[^0-9a-zA-Z가-힣\.\,\?\!\s\/]', '', text)
    text = re.sub(r' +', ' ', text)
    return text.strip()

def generate_tts_fn(text, voice="ko-KR-InJoonNeural", rate="+0%"):
    if not text or not text.strip():
        return None
    voice = str(voice).replace('edge:', '').strip()
    if not voice:
        voice = "ko-KR-InJoonNeural"
    cleaned = clean_text(text) or text.strip()
    
    async def _run():
        communicate = edge_tts.Communicate(cleaned, voice, rate=rate)
        temp_path = os.path.join(tempfile.gettempdir(), f"tts_{hash(text) & 0xFFFFFFFF}.mp3")
        await communicate.save(temp_path)
        return temp_path

    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(_run())

voice_ids = [v["id"] for v in VOICES]

demo = gr.Interface(
    fn=generate_tts_fn,
    inputs=[
        gr.Textbox(label="Text", value="태초에 하나님이 천지를 창조하시니라."),
        gr.Dropdown(label="Voice", choices=voice_ids, value="ko-KR-InJoonNeural"),
        gr.Dropdown(label="Rate", choices=["-20%", "-10%", "+0%", "+10%", "+20%"], value="+0%")
    ],
    outputs=gr.Audio(label="Audio", type="filepath"),
    title="Bible AI TTS Server",
    api_name="tts"
)

if __name__ == "__main__":
    demo.launch()
