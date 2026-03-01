import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  await page.goto("http://localhost:4322/tasks");
  await page.waitForTimeout(1000); // let scripts initialize
  
  // Click the first task to open detail panel
  const firstTask = await page.$('.task-item');
  if (firstTask) {
    console.log("Found task, clicking to open panel...");
    await firstTask.click();
    await page.waitForTimeout(500); // let panel slide in
    
    // Now click td-delete
    const delBtn = await page.$('#td-delete');
    if (delBtn) {
       console.log("Clicking td-delete...");
       await delBtn.click();
       await page.waitForTimeout(500); // Wait for modal
       
       // Click ok in confirmDialog
       const okBtn = await page.$('#confirm-ok');
       if (okBtn) {
          console.log("Found confirm-ok button");
       } else {
          console.log("confirm-ok button not found");
       }
    } else {
       console.log("td-delete btn not found");
    }
  } else {
    console.log("No tasks found");
  }

  await browser.close();
})();
