import whisper

model = whisper.load_model("base")

def transcribe_audio():
    result = model.transcribe("temp_audio.wav", fp16=False)
    return result['text']
