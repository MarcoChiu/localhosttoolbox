const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Endpoint to capture full page screenshot
app.post('/api/screenshot', async (req, res) => {
    const { url, width = 1920, delay = 1000, format = 'png', scroll = true } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
        console.log(`[Screenshot] Starting capture for: ${url}`);
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Set viewport width, height can be temporary since fullPage is true
        await page.setViewport({
            width: parseInt(width, 10),
            height: 1080,
            deviceScaleFactor: 1
        });

        // Set User-Agent to sound like a normal desktop browser
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to the URL
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Optional: Scroll to bottom to trigger lazy loading
        if (scroll) {
            console.log(`[Screenshot] Scrolling page to trigger lazy loading...`);
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 200;
                    const timer = setInterval(() => {
                        const scrollHeight = document.documentElement.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            window.scrollTo(0, 0); // Scroll back to top
                            resolve();
                        }
                    }, 50);
                });
            });
        }

        // Wait custom delay time
        if (delay > 0) {
            console.log(`[Screenshot] Waiting for delay: ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, parseInt(delay, 10)));
        }

        console.log(`[Screenshot] Taking screenshot...`);
        const screenshotBuffer = await page.screenshot({
            fullPage: true,
            type: format === 'png' ? 'png' : 'jpeg',
            quality: format === 'jpeg' ? 85 : undefined
        });

        console.log(`[Screenshot] Capture completed successfully.`);
        res.setHeader('Content-Type', format === 'png' ? 'image/png' : 'image/jpeg');
        res.send(screenshotBuffer);

    } catch (error) {
        console.error(`[Screenshot Error]`, error);
        res.status(500).json({ error: error.message || 'Failed to capture screenshot' });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Health check endpoint for the frontend to detect backend
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Screenshot API is running locally.' });
});

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  本地截圖與 PDF 工具箱伺服器已啟動！`);
    console.log(`  請在瀏覽器中開啟: http://localhost:${PORT}`);
    console.log(`==================================================`);
});
