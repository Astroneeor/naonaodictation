from app.ui import create_tray, start_gui

if __name__ == "__main__":
    start_gui()     # Start the persistent overlay window system
    print("NaoNao is ready. Right-click the tray icon to start listening.")
    create_tray()   # Launch system tray with "Start Listening"
    print("NaoNao is now sleeping. Goodnight!")