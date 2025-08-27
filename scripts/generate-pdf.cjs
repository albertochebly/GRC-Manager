// This script uses Puppeteer to generate a PDF from a local HTML report page.
// 1. Install puppeteer: npm install puppeteer
// 2. Run: node scripts/generate-pdf.cjs

const puppeteer = require('puppeteer');

(async () => {
  // Path to your local report page (adjust as needed)
  const reportUrl = 'http://localhost:5000/report-preview'; // Change to your report route
  const outputPath = 'Maturity-Assessment-Report.pdf';

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(reportUrl, { waitUntil: 'networkidle0' });

  // Optional: set PDF options (format, margins, etc.)
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' },
  });

  await browser.close();
  console.log('PDF generated:', outputPath);
})();
