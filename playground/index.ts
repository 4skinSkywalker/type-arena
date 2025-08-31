const puppeteer = require('puppeteer');

(async () => {
    const windowWidth = 1400;
    const windowHeight = 800;
    const windowXPos = 0;
    const windowYPos = 0;

    const browser = await puppeteer.launch({
        headless: false,
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

    await page.evaluateOnNewDocument(() => {
        localStorage.setItem('clientInfo', JSON.stringify({ name: "Fredo", car: 1, wpm: 0, accuracy: 0 }));
    });

    await page.goto('https://type-arena.dev/multiplayer/mx9ncoqbqw9', { waitUntil: 'networkidle0' });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.evaluate(() => {
        eval(`
(function() {
    /*
    TODO:
    1. Various level of skills
    2. Make it know when it's the admin
    3. Make it wait 15s or start if everybody has finished
    */
    const avgTypingSpeed = 170;
    let raceStarted = false;
    let quote = "";
    let textIndex = 0;
    let text = "";
    
    function getInput() {
        return document.querySelector("#text-control");
    }
    
    function type() {
        getInput().value = text;
        getInput().dispatchEvent(
            new Event("input", {
                bubbles: true,
                cancelable: false,
                composed: true
            })
        );
    }
    
    function typingLoop() {
        const rnd = Math.random() * avgTypingSpeed;
        const signRnd = Math.random() > 0.5 ? rnd : -rnd;
        setTimeout(() => {
            if (!raceStarted) {
                return;
            }
            
            const char = quote[textIndex++];
            text += char;
            type();
            
            if (text.length < quote.length) {
                typingLoop();
            }
        }, avgTypingSpeed + signRnd);
    }

    function statusLoop() {
        setInterval(() => {
            if (raceStarted !== window.raceStarted) {
                console.log("raceStarted changed", window.raceStarted);
                raceStarted = window.raceStarted;

                if (raceStarted) {
                    typingLoop();
                } else {
                    textIndex = 0;
                    text = "";
                }
            }

            if (quote !== room.race.quote.quote) {
                console.log("quote changed", room.race.quote.quote);
                quote = room.race.quote.quote;
            }
        }, 100)
    }
    statusLoop();
})();
`);
    });
})();