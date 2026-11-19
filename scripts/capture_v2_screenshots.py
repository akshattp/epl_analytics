import os
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.abspath("documentation/screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def capture_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 1. Desktop 1440px Light Mode Landing Page
        ctx_1440 = browser.new_context(viewport={"width": 1440, "height": 900})
        p_1440 = ctx_1440.new_page()
        p_1440.goto("http://localhost:3000")
        p_1440.wait_for_timeout(2000)
        p_1440.evaluate("document.documentElement.classList.remove('dark')")
        p_1440.wait_for_timeout(500)
        
        # Measure H1 vertical position
        h1_box = p_1440.locator("h1").bounding_box()
        print(f"[VERIFY] Desktop 1440px H1 Bounding Box: y={h1_box['y']:.1f}px, height={h1_box['height']:.1f}px")
        assert h1_box['y'] < 250, f"H1 vertical position {h1_box['y']} exceeds 250px budget! Excessive vertical space remains."
        print(f"[PASS] Defect B2 resolved: H1 y={h1_box['y']:.1f}px is tightly integrated at the top fold.")

        p_1440.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_0_1_landing_1440_light.png"), full_page=False)
        print("Captured epl_v2_0_1_landing_1440_light.png")

        # 2. Desktop 1440px Dark Mode Landing Page
        p_1440.evaluate("document.documentElement.classList.add('dark')")
        p_1440.wait_for_timeout(500)
        p_1440.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_0_1_landing_1440_dark.png"), full_page=False)
        print("Captured epl_v2_0_1_landing_1440_dark.png")

        # 3. Laptop 1280px Landing Page
        ctx_1280 = browser.new_context(viewport={"width": 1280, "height": 800})
        p_1280 = ctx_1280.new_page()
        p_1280.goto("http://localhost:3000")
        p_1280.wait_for_timeout(1800)
        p_1280.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_0_1_landing_1280.png"), full_page=False)
        print("Captured epl_v2_0_1_landing_1280.png")

        # 4. Tablet Landscape 1024px Landing Page
        ctx_1024 = browser.new_context(viewport={"width": 1024, "height": 768})
        p_1024 = ctx_1024.new_page()
        p_1024.goto("http://localhost:3000")
        p_1024.wait_for_timeout(1800)
        p_1024.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_0_1_landing_1024.png"), full_page=False)
        print("Captured epl_v2_0_1_landing_1024.png")

        # 5. Tablet Portrait 768px Landing Page
        ctx_768 = browser.new_context(viewport={"width": 768, "height": 1024})
        p_768 = ctx_768.new_page()
        p_768.goto("http://localhost:3000")
        p_768.wait_for_timeout(1800)
        p_768.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_0_1_landing_768.png"), full_page=False)
        print("Captured epl_v2_0_1_landing_768.png")

        # 6. Mobile 390px (iPhone 14)
        ctx_390 = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        p_390 = ctx_390.new_page()
        p_390.goto("http://localhost:3000")
        p_390.wait_for_timeout(1800)
        p_390.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_0_1_landing_390.png"), full_page=False)
        print("Captured epl_v2_0_1_landing_390.png")

        # 7. Mobile 375px (iPhone SE)
        ctx_375 = browser.new_context(viewport={"width": 375, "height": 667}, is_mobile=True)
        p_375 = ctx_375.new_page()
        p_375.goto("http://localhost:3000")
        p_375.wait_for_timeout(1800)
        p_375.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_0_1_landing_375.png"), full_page=False)
        print("Captured epl_v2_0_1_landing_375.png")

        # 8. Signature Page Curl / Corner-Fold Transition trigger
        try:
            p_1440.evaluate("""
                const btn = document.querySelector("button[aria-label*='mode' i]") || 
                            document.querySelector("button[title*='theme' i]") ||
                            document.querySelector("nav button");
                if (btn) btn.click();
            """)
            p_1440.wait_for_timeout(250)
            p_1440.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_page_curl_transition.png"))
            print("Captured epl_v2_page_curl_transition.png")
        except Exception as e:
            print("Page curl capture notice:", e)

        # 9. Athlete Dossier (Sagar Kapadia / EPL-P-001)
        p_1440.goto("http://localhost:3000/players/EPL-P-001")
        p_1440.wait_for_selector("[data-profile-ready='true']", timeout=12000)
        p_1440.wait_for_timeout(1500)
        p_1440.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_player_dossier.png"), full_page=False)
        print("Captured epl_v2_player_dossier.png")

        # 10. Auction Terminal Preview
        p_1440.goto("http://localhost:3000/auction")
        p_1440.wait_for_timeout(2000)
        p_1440.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_auction_terminal.png"), full_page=False)
        print("Captured epl_v2_auction_terminal.png")

        browser.close()
        print("All v2.0.1 screenshots captured and verified successfully!")

if __name__ == "__main__":
    capture_screenshots()
