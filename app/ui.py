import tkinter as tk
import threading
from pystray import Icon, Menu, MenuItem
from PIL import Image

# ----------------- Overlay GUI Globals -----------------
window = None
status_label = None

# ----------------- Overlay GUI Functions -----------------

def start_gui():
    def gui_thread():
        global window, status_label
        window = tk.Tk()
        window.title("NaoNao is Listening")
        window.attributes("-topmost", True)
        window.geometry("250x100+100+100")
        window.configure(bg="black")
        window.overrideredirect(True)

        status_label = tk.Label(window, text="", fg="white", bg="black", font=("Arial", 16))
        status_label.pack(expand=True)

        window.withdraw()  # Start hidden
        window.mainloop()

    threading.Thread(target=gui_thread, daemon=True).start()

def show_overlay():
    if window and status_label:
        def _show():
            window.deiconify()
            status_label.config(text="Recording...", fg="white", bg="black")
        window.after(0, _show)

def update_overlay_status(text, color="black", text_color="white"):
    if window and status_label:
        def _update():
            status_label.config(text=text, fg=text_color, bg=color)
            status_label.update_idletasks()
        window.after(0, _update)

def stop_overlay():
    if window and window.winfo_exists():
        def _hide():
            window.withdraw()
        window.after(0, _hide)

# ----------------- Tray Icon System -----------------

def start_naonao(icon, item):
    from app.loop import naonao_loop
    threading.Thread(target=naonao_loop, daemon=True).start()

def exit_app(icon, item):
    icon.stop()

def create_tray():
    image = Image.open("app/icon.ico")  # make sure this exists
    menu = Menu(
        MenuItem("Start Listening", start_naonao),
        MenuItem("Exit", exit_app)
    )
    Icon("NaoNao", image, "Voice Typing NaoNao", menu).run()
