import whisper

model = whisper.load_model("base")

def transcribe_audio():
    print("🔁 Starting whisper model...")
    result = model.transcribe("temp_audio.wav", fp16=False)
    return result['text']
