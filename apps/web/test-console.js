import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Log all console messages
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        const loc = msg.location();
        console.log(`  at ${loc.url}:${loc.lineNumber}:${loc.columnNumber}`);
      }
    });
    
    page.on('pageerror', err => {
      console.log(`[PAGE ERROR] ${err.message}`);
    });

    console.log("Navigating to tasks page...");
    await page.goto('http://localhost:4322/tasks', { waitUntil: 'networkidle2' });
    console.log("Page loaded. Clicking first task to open panel...");
    
    const taskItem = await page.$('.task-item');
    if (taskItem) {
      await taskItem.click();
      await page.waitForTimeout(1000); // wait for panel to open
      
      console.log("Clicking delete in task detail panel...");
      const tdDelete = await page.$('#td-delete');
      if (tdDelete) {
        await tdDelete.click();
        await page.waitForTimeout(1000); // wait for modal
      } else {
        console.log("#td-delete not found");
      }
    } else {
      console.log("No tasks found on page.");
    }
    
    await browser.close();
  } catch (err) {
    console.error("Test script failed:", err);
  }
})();
