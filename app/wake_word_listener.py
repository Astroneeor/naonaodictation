import os
from dotenv import load_dotenv
from pvporcupine import create
import sounddevice as sd
import struct

load_dotenv()
ACCESS_KEY = os.getenv("PV_ACCESS_KEY")

def listen_for_wake_word(callback):
    porcupine = create(
        access_key=ACCESS_KEY,
        keyword_paths=["app/naonao_windows.ppn"]
    )
    stream = sd.InputStream(channels=1, samplerate=porcupine.sample_rate, dtype='int16')
    with stream:
        while True:
            pcm = stream.read(porcupine.frame_length)[0]
            pcm = struct.unpack_from("h" * porcupine.frame_length, pcm)
            keyword_index = porcupine.process(pcm)
            if keyword_index >= 0:
                callback()
