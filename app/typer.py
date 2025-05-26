import pyautogui
import time

def type_text(text):
    time.sleep(0.5)
    pyautogui.typewrite(text)
