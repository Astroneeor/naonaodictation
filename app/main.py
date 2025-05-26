from app.wake_word_listener import listen_for_wake_word
from app.transcriber import transcribe_audio
import sounddevice as sd
from scipy.io.wavfile import write
import numpy as np
import threading
import tkinter as tk
from pynput import keyboard
from app.transcriber import transcribe_audio
from app.typer import type_text

is_recording = True
fs = 44100
duration = 5  # fallback duration in seconds
window = None

def show_overlay():
    global window
    window = tk.Tk()
    window.title("NaoNao is Listening")
    window.attributes("-topmost", True)
    window.geometry("200x80+100+100")
    window.configure(bg="black")
    label = tk.Label(window, text="Recording...", fg="white", bg="black", font=("Arial", 14))
    label.pack(expand=True)
    window.overrideredirect(True)
    window.update()
    window.mainloop()

def stop_overlay():
    global window
    if window:
        window.destroy()
        window = None

def on_press(key):
    global is_recording
    if key == keyboard.Key.esc:
        is_recording = False
        return False  # stop listener

def record_audio():
    global is_recording
    is_recording = True

    # Start the overlay window in a separate thread
    overlay_thread = threading.Thread(target=show_overlay)
    overlay_thread.start()

    # Start key listener in another thread
    listener = keyboard.Listener(on_press=on_press)
    listener.start()

    print("Recording...")
    recording = []

    def callback(indata, frames, time, status):
        if is_recording:
            recording.append(indata.copy())

    with sd.InputStream(samplerate=fs, channels=1, dtype='int16', callback=callback):
        sd.sleep(int(duration * 1000))  # fallback time in ms

    listener.stop()
    stop_overlay()
    print("Recording stopped")

    if recording:
        full_recording = np.concatenate(recording, axis=0)
        write("temp_audio.wav", fs, full_recording)

def handle_command():
    record_audio()
    text = transcribe_audio()
    print("Transcribed:", text)
    type_text(text)


def naonao_loop():
    print("NaoNao is listening...")
    listen_for_wake_word(handle_command)
