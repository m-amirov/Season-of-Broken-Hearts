import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const scenarioPath = path.resolve(process.argv[2] ?? '');
const outputPath = path.resolve(process.argv[3] ?? 'artifacts/evidence/playwright-scenario.json');
const playwrightModule = process.env.STAGE52_PLAYWRIGHT_MODULE;
const chromePath = process.env.STAGE52_CHROME_PATH;
if (!playwrightModule || !chromePath) throw new Error('STAGE52_PLAYWRIGHT_MODULE and STAGE52_CHROME_PATH are required');
if (!fs.existsSync(scenarioPath)) throw new Error(`Missing scenario: ${scenarioPath}`);

const { chromium } = await import(pathToFileURL(playwrightModule).href);
const scenario = eval(fs.readFileSync(scenarioPath, 'utf8')); // scenario files are local, reviewed QA functions.
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
try {
  await page.goto(process.env.STAGE52_BASE_URL ?? 'http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  const result = await scenario(page);
  const output = { status: 'PASS', scenario: path.relative(root, scenarioPath).replaceAll('\\', '/'), result };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({ status: output.status, output: path.relative(root, outputPath).replaceAll('\\', '/') }, null, 2));
} finally {
  await browser.close();
}
