(async function() {
    const difficultyMap = {
        easy: {
            avgTypingSpeed: window.playerSpeed || 30,
            errRate: 0.1,
            noMistakesRate: 0.1,
            restartDelay: 5
        },
        medium: {
            avgTypingSpeed: window.playerSpeed || 50,
            errRate: 0.05,
            noMistakesRate: 0.4,
            restartDelay: 10
        },
        hard: {
            avgTypingSpeed: window.playerSpeed || 80,
            errRate: 0.01,
            noMistakesRate: 0.75,
            restartDelay: 15
        }
    };
    const difficulties = Object.values(difficultyMap);
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const { avgTypingSpeed, errRate, restartDelay } = difficulty;

    let isHost = false;
    let raceStarted = null;
    let quote = "";
    let deathMode = false;
    let textIndex = 0;
    let text = "";

    function strikeDelay(wpm) {
        return (1 / ((wpm * 5) / 60)) * 1000;
    }

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
        }, strikeDelay(avgTypingSpeed) * (deathMode ? 1.1 : 1));
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