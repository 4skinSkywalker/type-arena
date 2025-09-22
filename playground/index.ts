const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const bot = fs.readFileSync('./bot.js', 'utf8');

    const args = process.argv.slice(2);
    const [ roomId, playerName, playerSpeed, headless ] = args;

    if (!roomId || !playerName) {
        console.error('Missing arguments.');
        process.exit(1);
    }

    const windowWidth = 1400;
    const windowHeight = 800;
    const windowXPos = 0;
    const windowYPos = 0;

    const browser = await puppeteer.launch({
        headless: headless === 'true',
        args: [
            `--window-size=${windowWidth},${windowHeight}`,
            `--window-position=${windowXPos},${windowYPos}`
        ],
        defaultViewport: null
    });

    const page = await browser.newPage();

    await page.setViewport({
        width: windowWidth,
        height: windowHeight,
    });

    await page.evaluateOnNewDocument((opts: { playerName: string, playerSpeed: string }) => {
        localStorage.setItem('clientInfo', JSON.stringify({
            name: opts.playerName,
            car: 1 + Math.floor(Math.random() * 7),
            wpm: opts.playerSpeed || 0,
            accuracy: Math.max(Math.random(), 0.9)
        }));
    }, { playerName, playerSpeed });

    await page.goto('https://type-arena.dev/multiplayer/' + roomId, { waitUntil: 'networkidle0' });
    // await page.goto('http://localhost:4200/multiplayer/' + roomId, { waitUntil: 'networkidle0' });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.evaluate((opts: { bot: string, playerName: string, playerSpeed: string }) => {
        (window as any).playerName = opts.playerName;
        (window as any).playerSpeed = opts.playerSpeed;
        eval(opts.bot);
    }, { bot, playerName, playerSpeed });
})();
