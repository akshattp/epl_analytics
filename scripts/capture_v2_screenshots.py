import os
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.abspath("documentation/screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def capture_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 1. Desktop Light Mode Landing Page
        context_light = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context_light.new_page()
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)
        # Ensure light mode
        page.evaluate("document.documentElement.classList.remove('dark')")
        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_landing_light.png"), full_page=False)
        print("Captured epl_v2_landing_light.png")

        # 2. Desktop Dark Mode Landing Page
        page.evaluate("document.documentElement.classList.add('dark')")
        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_landing_dark.png"), full_page=False)
        print("Captured epl_v2_landing_dark.png")

        # 3. Signature Page Curl / Corner-Fold Transition trigger
        try:
            page.evaluate("""
                const btn = document.querySelector("button[aria-label*='mode' i]") || 
                            document.querySelector("button[title*='theme' i]") ||
                            document.querySelector("nav button");
                if (btn) btn.click();
            """)
            page.wait_for_timeout(250)
            page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_page_curl_transition.png"))
            print("Captured epl_v2_page_curl_transition.png")
        except Exception as e:
            print("Page curl capture notice:", e)

        # 4. Athlete Dossier (Sagar Kapadia / EPL-P-001)
        page.goto("http://localhost:3000/players/EPL-P-001")
        page.wait_for_selector("[data-profile-ready='true']", timeout=12000)
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_player_dossier.png"), full_page=False)
        print("Captured epl_v2_player_dossier.png")

        # 5. Mobile Landing Page (iPhone 14 Viewport)
        mobile_context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        mobile_page = mobile_context.new_page()
        mobile_page.goto("http://localhost:3000")
        mobile_page.wait_for_timeout(2000)
        mobile_page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_mobile_landing.png"))
        print("Captured epl_v2_mobile_landing.png")

        # 6. Auction Terminal Preview
        page.goto("http://localhost:3000/auction")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "epl_v2_auction_terminal.png"), full_page=False)
        print("Captured epl_v2_auction_terminal.png")

        browser.close()
        print("All screenshots captured successfully!")

if __name__ == "__main__":
    capture_screenshots()
