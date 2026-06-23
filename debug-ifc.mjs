import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log('Navigating to http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/');
  
  await page.waitForSelector('input[type="file"]');
  const inputUploadHandle = await page.$('input[type="file"]');
  
  console.log('Uploading 01_BIMcollab_Example_ARC.ifc...');
  await inputUploadHandle.uploadFile('C:\\Users\\mutah\\OneDrive\\Desktop\\BIM project\\ClashDetectionApp\\01_BIMcollab_Example_ARC.ifc');
  
  console.log('Waiting 15 seconds to capture logs...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  await browser.close();
  console.log('Done.');
})();
