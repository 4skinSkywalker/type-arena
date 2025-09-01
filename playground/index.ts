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
    // await page.goto('http://localhost:4200/multiplayer/' + roomId, { waitUntil: 'networkidle0' });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.evaluate(() => {
        eval(`
(async function() {
    const difficulties = {
        easy: {
            avgTypingSpeed: 200,
            errRate: 0.1,
            noMistakesRate: 0.1,
            restartDelay: 5
        },
        medium: {
            avgTypingSpeed: 170,
            errRate: 0.05,
            noMistakesRate: 0.4,
            restartDelay: 10
        },
        hard: {
            avgTypingSpeed: 140,
            errRate: 0.01,
            noMistakesRate: 0.75,
            restartDelay: 15
        }
    };
    const _difficulties = Object.values(difficulties);
    const difficulty = _difficulties[Math.floor(Math.random()*_difficulties.length)];
    const {avgTypingSpeed, errRate, restartDelay} = difficulty;

    let isHost = false;
    let raceStarted = null;
    let quote = "";
    let deathMode = false;
    let textIndex = 0;
    let text = "";

    async function delay(ms = 2000) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }
    
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

    function newGameClick() {
        document.querySelector("#host-cmd-new").click();
    }
    function startGameClick() {
        document.querySelector("#host-cmd-start").click();
    }
    
    let finished = false;
    let hasError = false;
    let prevChar = "";
    let noMistake = deathMode ? Math.random() < noMistakesRate: false;
    function typingLoop() {
        const rnd = Math.random() * avgTypingSpeed;
        const signRnd = Math.random() > 0.5 ? rnd : -rnd;
        setTimeout(async () => {
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
                if (!noMistake && Math.random() < (deathMode ? errRate / 2 : errRate)) {
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
            } else {
                finished = true;
            }
        }, avgTypingSpeed * (deathMode ? 1.1 : 1) + signRnd);
    }

    function statusLoop() {
        let prevFinished = false;
        setInterval(async () => {
            if (raceStarted !== window.raceStarted) {
                console.log("raceStarted changed", window.raceStarted);
                raceStarted = window.raceStarted;

                if (!raceStarted) {
                    textIndex = 0;
                    text = "";
                } else {
                    typingLoop();
                }
            }
            
            if (quote !== window.room.race.quote.quote) {
                console.log("quote changed", window.room.race.quote.quote);
                quote = window.room.race.quote.quote;
            }

            if (deathMode !== window.deathMode) {
                console.log("death mode changed", window.deathMode);
                deathMode = window.deathMode;
            }

            if (isHost !== window.isHost) {
                console.log("isHost changed", window.isHost);
                isHost = window.isHost;
            }

            if (finished !== prevFinished) {
                console.log("finished changed", finished, "(", prevFinished, ")");
                prevFinished = finished;

                if (finished && isHost) {
                    finished = false;
                    prevFinished = false;
                    await delay(restartDelay * 1000);
                    newGameClick();
                    await delay(5000);
                    startGameClick();
                }
            }
        }, 100);
    }
    statusLoop();

    await delay(5000);
    if (isHost) {
        startGameClick();
    }
})();
`);
    });
})();
