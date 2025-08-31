const puppeteer = require('puppeteer');

(async () => {
    const args = process.argv.slice(2);
    const roomId = args[0];

    if (!roomId) {
        console.error('Please provide a roomId as an argument.');
        process.exit(1);
    }

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
        const nicks = [
            "Shadow",
            "Hunter",
            "Starlight",
            "Archer",
            "Wolf666",
            "Owlbe",
            "Maverick",
            "Vagabond",
            "WildCard",
            "Frostbite",
            "Javaman",
            "DonaldTrump",
            "TestTheCats"
        ];
        localStorage.setItem('clientInfo', JSON.stringify({ name: nicks[Math.floor(Math.random()*nicks.length)], car: 1+Math.floor(Math.random()*7), wpm: 0, accuracy: 0 }));
    });

    await page.goto('https://type-arena.dev/multiplayer/' + roomId, { waitUntil: 'networkidle0' });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.evaluate(() => {
        eval(`
(function() {
    const difficulties = {
        easy: {
            avgTypingSpeed: 200,
            errRate: 0.1
        },
        medium: {
            avgTypingSpeed: 170,
            errRate: 0.05
        },
        hard: {
            avgTypingSpeed: 140,
            errRate: 0.01
        }
    };
    const _difficulties = Object.values(difficulties);
    const difficulty = _difficulties[Math.floor(Math.random()*_difficulties.length)];
    const {avgTypingSpeed, errRate} = difficulty;

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
    
    let hasError = false;
    let prevChar = "";
    function typingLoop() {
        const rnd = Math.random() * avgTypingSpeed;
        const signRnd = Math.random() > 0.5 ? rnd : -rnd;
        setTimeout(() => {
            if (!raceStarted) {
                return;
            }
            
            let char;
            if (hasError) {
                text = text.slice(0, textIndex);
                char = prevChar;
                hasError = false;
                prevChar = "";
                textIndex++;
            } else {
                if (Math.random() < errRate) {
                    char = "#";
                    hasError = true;
                    prevChar = quote[textIndex];
                } else {
                    char = quote[textIndex];
                    textIndex++;
                }
            }
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