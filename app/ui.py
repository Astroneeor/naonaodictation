# app/ui.py
from pystray import Icon, Menu, MenuItem
from PIL import Image
import threading
from app.main import jarvis_loop

def start_jarvis(icon, item):
    threading.Thread(target=jarvis_loop, daemon=True).start()

def exit_app(icon, item):
    icon.stop()

def create_tray():
    image = Image.open("app/icon.ico")  # Replace with your .ico or .png
    menu = Menu(
        MenuItem("Start Listening", start_jarvis),
        MenuItem("Exit", exit_app)
    )
    Icon("Jarvis", image, "Voice Typing Jarvis", menu).run()
