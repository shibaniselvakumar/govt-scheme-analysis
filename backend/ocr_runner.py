import pytesseract
from PIL import Image
import cv2
import numpy as np

# Windows tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def run_ocr_from_path(file_path):
    image = Image.open(file_path).convert("RGB")
    img = np.array(image)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]

    text = pytesseract.image_to_string(gray, lang="eng")

    print("\n🧠 OCR OUTPUT FROM ocr_runner.py")
    print("--------------------------------")
    print(text.strip())
    print("--------------------------------\n")

    return text.strip()