from playwright.sync_api import sync_playwright, expect
import time
import os

def verify_chat_history(page):
    # Go to the application
    page.goto("http://localhost:5173")

    # Wait for the page to load
    expect(page.get_by_role("heading", name="Copilot Streamforge")).to_be_visible()

    # Type a message in the Prompt Studio Input
    prompt_input = page.get_by_placeholder("Describe the response you want to simulate...")
    prompt_input.fill("Hello, how are you?")
    page.keyboard.press("Enter")

    # Wait for the message to appear in the timeline
    expect(page.get_by_text("Hello, how are you?")).to_be_visible()

    # Wait a bit for potential response (even if it's an error)
    time.sleep(2)

    # Take a screenshot after first turn
    page.screenshot(path="verification/first_turn.png")

    # Refresh the page to test persistence
    page.reload()

    # Wait for the page to load again
    expect(page.get_by_role("heading", name="Copilot Streamforge")).to_be_visible()

    # Check if the message is still there in the timeline
    expect(page.get_by_text("Hello, how are you?")).to_be_visible()

    # Take a screenshot after refresh
    page.screenshot(path="verification/after_refresh.png")

    # Click "New chat"
    page.get_by_role("button", name="New chat").click()

    # Check if the timeline is cleared
    expect(page.get_by_text("No messages yet.")).to_be_visible()

    # Take a screenshot after new chat
    page.screenshot(path="verification/new_chat.png")

if __name__ == "__main__":
    os.makedirs("verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_chat_history(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
