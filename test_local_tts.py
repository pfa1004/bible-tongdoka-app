import requests

try:
    res = requests.post("http://127.0.0.1:5050/api/tts", json={
        "text": "태초에 하나님이 천지를 창조하시니라.",
        "voice": "ko-KR-InJoonNeural",
        "rate": "+0%"
    }, timeout=5)
    print("Status code:", res.status_code)
    print("Content length:", len(res.content))
    if res.status_code == 200 and len(res.content) > 1000:
        print("SUCCESS: Audio generated successfully!")
    else:
        print("FAILED:", res.text)
except Exception as e:
    print("ERROR:", e)
