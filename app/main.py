# main.py

from app.transcriber import transcribe_audio
from app.typer import type_text
import sounddevice as sd
from scipy.io.wavfile import write
import numpy as np
import tkinter as tk
from pynput import keyboard
import os
import time

from app.ui import show_overlay, update_overlay_status, stop_overlay, start_gui

is_recording = True
fs = 44100
duration = 300  # fallback duration in seconds

def record_audio():
    global is_recording
    is_recording = True

    print("\U0001F3A4 Starting recording...")
    show_overlay()

    recording_stopped_by_key = [False]

    def on_press(key):
        if key == keyboard.Key.esc:
            print("\u23F9\uFE0F ESC pressed!")
            recording_stopped_by_key[0] = True
            return False

    listener = keyboard.Listener(on_press=on_press)
    listener.start()

    recording = []

    def callback(indata, frames, time_info, status):
        if is_recording:
            recording.append(indata.copy())

    try:
        silence_threshold = 500
        silence_duration_required = 5
        silence_start_time = None

        start_time = time.time()
        max_total_duration = duration

        def is_silent(chunk):
            return np.max(np.abs(chunk)) < silence_threshold

        with sd.InputStream(samplerate=fs, channels=1, dtype='int16', callback=callback):
            print("\U0001F399️ Listening for silence...")
            while True:
                sd.sleep(100)
                current_time = time.time()

                if recording_stopped_by_key[0]:
                    print("\U0001F6D1 ESC pressed. Stopping.")
                    break

                if len(recording) == 0:
                    continue

                recent_chunk = recording[-1]

                if not is_silent(recent_chunk):
                    silence_start_time = None
                    update_overlay_status("Recording...", color="black", text_color="white")
                else:
                    if silence_start_time is None:
                        silence_start_time = current_time
                    elif current_time - silence_start_time >= silence_duration_required:
                        print("\U0001F9D8 Detected 5 seconds of silence. Stopping.")
                        break
                    else:
                        update_overlay_status("Listening... (quiet)", color="darkred", text_color="white")

                if current_time - start_time >= max_total_duration:
                    print("\u23F3 Max recording time reached. Stopping.")
                    break

    finally:
        stop_overlay()
        is_recording = False
        print("\U0001F6D1 Closing listener.")
        listener.stop()

    print("\U0001F6D1 Recording done, writing to file...")

    if recording:
        audio_data = np.concatenate(recording, axis=0)
        write("temp_audio.wav", fs, audio_data)
    else:
        print("\u26A0\uFE0F No audio recorded.")

    print("\u2705 record_audio() finished.")

def handle_command():
    print("\U0001F3A7 Wake word triggered. Recording starts now...")
    record_audio()

    if not os.path.exists("temp_audio.wav"):
        print("\u274C temp_audio.wav was not created.")
        return

    print("\U0001F9E0 Transcribing...")
    try:
        text = transcribe_audio()
        print(f"\U0001F4DD Transcribed Text: {text}")
        print("\u2328️ Typing text...")
        type_text(text)
    except Exception as e:
        print(f"\u274C Transcription failed: {e}")
