from pystray import Icon, Menu, MenuItem
from PIL import Image
import threading
from app.main import naonao_loop

def start_naonao(icon, item):
    threading.Thread(target=naonao_loop, daemon=True).start()

def exit_app(icon, item):
    icon.stop()

def create_tray():
    image = Image.open("app/icon.ico")  # Replace with your .ico or .png
    menu = Menu(
        MenuItem("Start Listening", start_naonao),
        MenuItem("Exit", exit_app)
    )
    Icon("NaoNao", image, "Voice Typing NaoNao", menu).run()
