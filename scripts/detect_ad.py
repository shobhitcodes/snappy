import cv2
import sys
import os

TEMPLATE_MATCH_THRESHOLD = 0.71

def detect_ad(screen_path, assets_dir):
    img = cv2.imread(screen_path)
    if img is None:
        raise ValueError(f"Could not read screenshot: {screen_path}")
    
    TEMPLATE_PATHS = [
        os.path.join(assets_dir, "ad_template1.png"),
        os.path.join(assets_dir, "ad_template2.png"),
        os.path.join(assets_dir, "ad_template3.png"),
    ]

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
    if len(sys.argv) < 3:
        print("Usage: detect_ad.py <screenshot_path> <assets_dir>")
        sys.exit(1)

    screenshot_path = sys.argv[1]
    assets_dir = sys.argv[2]

    try:
        is_ad = detect_ad(screenshot_path, assets_dir)
        print("Detected as Ad" if is_ad else "No Ad Detected")
    except Exception as e:
        print("⚠️ Error running detection:", str(e))
        sys.exit(1)
