from app.wake_word_listener import listen_for_wake_word
from app.main import handle_command

def naonao_loop():
    print("NaoNao is listening...")
    listen_for_wake_word(handle_command)
