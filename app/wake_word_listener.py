from vosk import Model, KaldiRecognizer
import sounddevice as sd
import queue
import json
import difflib

q = queue.Queue()

def audio_callback(indata, frames, time, status):
    if status:
        print(f"Audio status: {status}")
    q.put(bytes(indata))

def is_fuzzy_match(transcript, wake_phrases, threshold=0.75):
    for phrase in wake_phrases:
        ratio = difflib.SequenceMatcher(None, transcript, phrase).ratio()
        if ratio >= threshold:
            print(f"🔍 Fuzzy match: '{transcript}' ≈ '{phrase}' ({ratio:.2f})")
            return True
    return False

def listen_for_wake_word(callback, wake_phrases=["now now"]):
    print("🔊 Loading Vosk model...")
    model = Model("models/vosk-model-small-en-us-0.15")

    recognizer = KaldiRecognizer(model, 16000)

    print("🎤 Listening for wake word...")

    with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype='int16',
                           channels=1, callback=audio_callback):
        while True:
            data = q.get()
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                transcript = result.get("text", "").lower()
                print(f"📝 Heard: {transcript}")

                if is_fuzzy_match(transcript, wake_phrases):
                    print("✅ Wake word detected!")
                    callback()