from app.wake_word_listener import listen_for_wake_word
from app.transcriber import transcribe_audio
from app.typer import type_text

def handle_command():
    print("Wake word detected!")
    text = transcribe_audio()
    type_text(text)

def jarvis_loop():
    print("Jarvis is listening...")
    listen_for_wake_word(handle_command)
