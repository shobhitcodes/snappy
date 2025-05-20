import cv2
import sys
import os

TEMPLATE_PATHS = [
    "assets/ad_template1.png",
    "assets/ad_template2.png",
    "assets/ad_template3.png",
]
TEMPLATE_MATCH_THRESHOLD = 0.70
IMAGE_TOP_CROP_PERCENTAGE = 0.08

def detect_ad(screen_path):
    img = cv2.imread(screen_path)
    if img is None:
        raise ValueError(f"Could not read screenshot: {screen_path}")
    
    h, w, _ = img.shape
    # top = img[:int(h * IMAGE_TOP_CROP_PERCENTAGE), :]

    for template_path in TEMPLATE_PATHS:
        template = cv2.imread(template_path)
        if template is None:
            print(f"⚠️ Could not read template: {template_path}")
            continue

        match_result = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, _ = cv2.minMaxLoc(match_result)
        print(f"[{os.path.basename(template_path)}] max_val: {max_val}")

        if max_val > TEMPLATE_MATCH_THRESHOLD:
            print(f"✅ Matched with template: {template_path}")
            return True

    return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: detect_ad.py <screenshot_path>")
        sys.exit(1)

    screenshot_path = sys.argv[1]

    try:
        is_ad = detect_ad(screenshot_path)
        print("Detected as Ad" if is_ad else "No Ad Detected")
    except Exception as e:
        print("⚠️ Error running detection:", str(e))
        sys.exit(1)
