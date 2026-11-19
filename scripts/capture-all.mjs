import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('docs/screenshots/sprint-1');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('🌐 Launching Chrome Headless for High-DPI Retina Screenshots...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1440,1050'
    ],
    defaultViewport: {
      width: 1440,
      height: 1050,
      deviceScaleFactor: 2
    }
  });

  const page = await browser.newPage();

  try {
    console.log('📍 Navigating to SingSlot on http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Skip splash screen
    await delay(300);
    await page.evaluate(() => {
      const splash = document.querySelector('div[aria-label="SingSlot Cinematic Splash Screen"]');
      if (splash) splash.click();
    });
    await delay(1200);

    // 1. Room Catalog Overview (Unauthenticated)
    console.log('📸 1. Room Catalog Overview...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_room_catalog_overview.png') });
    console.log('  ✅ Saved 01_room_catalog_overview.png');

    // 2. Open Login Modal
    console.log('📸 2. Login Modal...');
    await page.evaluate(() => {
      const signInBtn = document.querySelector('button[title*="User sign in"]');
      if (signInBtn) signInBtn.click();
    });
    await delay(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_modal.png') });
    console.log('  ✅ Saved 02_login_modal.png');

    // 3. Customer Alice Login & Navigate to Rooms & Slots
    console.log('📸 3. Customer Alice Login...');
    await page.evaluate(() => {
      const custBtn = document.querySelector('button[title*="Fill Customer credentials"]');
      if (custBtn) custBtn.click();
    });
    await delay(400);
    await page.evaluate(() => {
      const submit = document.querySelector('form button[type="submit"]');
      if (submit) submit.click();
    });
    await delay(1500);

    // Ensure activeNav is on Rooms & Slots
    await page.evaluate(() => {
      const roomNav = document.querySelector('button[title*="Rooms & Slots catalog"], div[title="SingSlot Home"]');
      if (roomNav) roomNav.click();
    });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_customer_logged_in.png') });
    console.log('  ✅ Saved 03_customer_logged_in.png');

    // 4. Time Slot Matrix View
    console.log('📸 4. Time Slot Matrix View...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const matrixBtn = buttons.find(b => b.innerText.includes('Time Slot Matrix'));
      if (matrixBtn) matrixBtn.click();
    });
    await delay(1200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_availability_time_slot_matrix.png') });
    console.log('  ✅ Saved 04_availability_time_slot_matrix.png');

    // Switch back to Browse Rooms
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const browseBtn = buttons.find(b => b.innerText.includes('Browse Rooms'));
      if (browseBtn) browseBtn.click();
    });
    await delay(800);

    // 5. Open Booking Modal on Medium Room M02
    console.log('📸 5. Booking Modal for Medium Room M02...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bookBtns = buttons.filter(b => b.innerText.trim() === 'Book Room');
      if (bookBtns[4]) bookBtns[4].click();
      else if (bookBtns[3]) bookBtns[3].click();
      else if (bookBtns[0]) bookBtns[0].click();
    });
    await delay(1000);

    // Pick first open future slot in select (looking for select with 'Slot #' options)
    let selectedSlotIndex = null;
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('div.fixed select'));
      const startSlotSelect = selects.find(sel =>
        Array.from(sel.options).some(o => o.text.includes('Slot #'))
      );
      if (startSlotSelect) {
        const valid = Array.from(startSlotSelect.options).find(o => !o.disabled && !o.text.includes('Elapsed'));
        if (valid) {
          startSlotSelect.value = valid.value;
          startSlotSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    await delay(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_booking_modal_selection.png') });
    console.log('  ✅ Saved 05_booking_modal_selection.png');

    // 6. Confirm Booking & Capture Receipt
    console.log('📸 6. Submitting Reservation & Capturing Confirmation Receipt...');
    await page.evaluate(() => {
      const submit = document.querySelector('div.fixed form button[type="submit"]');
      if (submit && !submit.disabled) submit.click();
    });
    await delay(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_booking_confirmation_receipt.png') });
    console.log('  ✅ Saved 06_booking_confirmation_receipt.png');

    // Close the booking modal via "Done & Return to Schedule"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div.fixed button'));
      const doneBtn = buttons.find(b => b.innerText.includes('Done & Return') || b.title?.includes('Close') || b.getAttribute('aria-label') === 'Close booking modal');
      if (doneBtn) doneBtn.click();
    });
    await delay(1000);

    // 7. My Bookings View (Shows newly created reservation)
    console.log('📸 7. Customer My Bookings View...');
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('header nav button'));
      const myBookingsBtn = navButtons.find(b => b.innerText.includes('My Bookings'));
      if (myBookingsBtn) myBookingsBtn.click();
    });
    await delay(1800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_customer_my_bookings.png') });
    console.log('  ✅ Saved 07_customer_my_bookings.png');

    // 8. Open Booking Detail Modal
    console.log('📸 8. Booking Detail Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('main button'));
      const viewDetailsBtn = buttons.find(b => b.innerText.includes('View Details'));
      if (viewDetailsBtn) viewDetailsBtn.click();
    });
    await delay(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_booking_detail_modal.png') });
    console.log('  ✅ Saved 08_booking_detail_modal.png');

    // Close detail modal via "Close" button or close icon
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div.fixed button'));
      const closeBtn = buttons.find(b => b.innerText.trim() === 'Close' || b.getAttribute('aria-label') === 'Close modal');
      if (closeBtn) closeBtn.click();
    });
    await delay(1000);

    // 9. Conflict Prevention Rejection
    console.log('📸 9. Double Booking Conflict Rejection...');
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('header nav button'));
      const roomNav = navButtons.find(b => b.innerText.includes('Rooms & Slots'));
      if (roomNav) roomNav.click();
    });
    await delay(1200);

    // Click Book Room on M02 again
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bookBtns = buttons.filter(b => b.innerText.trim() === 'Book Room');
      if (bookBtns[4]) bookBtns[4].click();
      else if (bookBtns[3]) bookBtns[3].click();
      else if (bookBtns[0]) bookBtns[0].click();
    });
    await delay(1000);

    // Select the exact same slot that is now occupied
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('div.fixed select'));
      const startSlotSelect = selects.find(sel =>
        Array.from(sel.options).some(o => o.text.includes('Slot #'))
      );
      if (startSlotSelect) {
        // Find the slot that was previously booked or slot 10
        const slot10 = Array.from(startSlotSelect.options).find(o => o.value === '10');
        if (slot10) {
          startSlotSelect.value = '10';
          startSlotSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    await delay(500);

    await page.evaluate(() => {
      const submit = document.querySelector('div.fixed form button[type="submit"]');
      if (submit && !submit.disabled) submit.click();
    });
    await delay(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_conflict_rejection_alert.png') });
    console.log('  ✅ Saved 09_conflict_rejection_alert.png');

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('div.fixed button[aria-label="Close booking modal"], div.fixed button');
      if (closeBtn) closeBtn.click();
    });
    await delay(1000);

    // 10. Logout & Login as Staff
    console.log('📸 10. Staff Login & Master Schedule View...');
    await page.evaluate(() => {
      const profileBtn = document.querySelector('header button[aria-label="User profile menu"]');
      if (profileBtn) profileBtn.click();
    });
    await delay(600);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('header button'));
      const logoutBtn = buttons.find(b => b.innerText.includes('Log Out'));
      if (logoutBtn) logoutBtn.click();
    });
    await delay(1200);

    // Sign in as Staff
    await page.evaluate(() => {
      const signInBtn = document.querySelector('button[title*="User sign in"]');
      if (signInBtn) signInBtn.click();
    });
    await delay(800);

    await page.evaluate(() => {
      const staffBtn = document.querySelector('button[title*="Fill Staff credentials"]');
      if (staffBtn) staffBtn.click();
    });
    await delay(400);

    await page.evaluate(() => {
      const submit = document.querySelector('form button[type="submit"]');
      if (submit) submit.click();
    });
    await delay(2000);

    // Navigate to Staff Schedule
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('header nav button'));
      const staffNav = navButtons.find(b => b.innerText.includes('Master Schedule'));
      if (staffNav) staffNav.click();
    });
    await delay(2200);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_staff_master_schedule.png') });
    console.log('  ✅ Saved 10_staff_master_schedule.png');

    console.log('\n🎉 ALL 10 HIGH-RES RETINA SCREENSHOTS CAPTURED CLEANLY!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Capture failed:', err);
  process.exit(1);
});
