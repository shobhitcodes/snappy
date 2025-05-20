import cv2
import pytesseract
import sys

TEMPLATE_PATH = "assets/ad_template.png"
TEMPLATE_MATCH_THRESHOLD = 0.60
IMAGE_TOP_CROP_PERCENTAGE = 0.08
IMAGE_OCR_REGION_PATH = "assets/ocr_region_top.png"

def detect_ad(screen_path):
    img = cv2.imread(screen_path)
    template = cv2.imread(TEMPLATE_PATH)

    match_result = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, _ = cv2.minMaxLoc(match_result)
    print('max_val: ', max_val)

    if max_val > TEMPLATE_MATCH_THRESHOLD:
        return True

    # fallback to OCR
    # h, w, _ = img.shape
    # top = img[:int(h * IMAGE_TOP_CROP_PERCENTAGE), :]  # rows from 0 to 10% height
    # text = pytesseract.image_to_string(top)
    # cv2.imwrite(IMAGE_OCR_REGION_PATH, top)
    # print('OCR text (top): ', text)
    # return "Ad" in text

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: detect_ad.py <screenshot_path>")
        sys.exit(1)

    screenshot_path = sys.argv[1]

    try:
        is_ad = detect_ad(screenshot_path)
        print("Detected as Ad" if is_ad else "No Ad Detected")
    except Exception as e:
        print("Error running detection:", str(e))
        sys.exit(1)
