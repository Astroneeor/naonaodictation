from pvporcupine import create
import sounddevice as sd
import struct

def listen_for_wake_word(callback):
    porcupine = create(keywords=["NaoNao"])
    stream = sd.InputStream(channels=1, samplerate=porcupine.sample_rate, dtype='int16')
    with stream:
        while True:
            pcm = stream.read(porcupine.frame_length)[0]
            pcm = struct.unpack_from("h" * porcupine.frame_length, pcm)
            keyword_index = porcupine.process(pcm)
            if keyword_index >= 0:
                callback()
