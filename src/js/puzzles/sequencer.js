/**
 * @author 
 */

echoing_chimes_puzzle = function(targetDiv) {
    const puzzleContainerId = 'chimes-puzzle-container';
    const gameTitle = 'Resonating Runes';
    const numChimes = 5;
    const sequenceLength = 4;
    const flashDuration = 400;
    const sequenceDelay = 700;

    const runeSymbols = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ'];
    let masterSequence = [];
    let playerSequence = [];
    let roundActive = false;
    let currentRound = 1;

    const style = document.createElement('style');
    style.setAttribute('data-puzzle-style', 'true');
    const appMinHeight = `calc(
        25px +
        50px +
        200px +
        40px +
        60px +
        60px +
        60px +
        25px
    )`;

    style.textContent = `
        #app {
            background-color: #1a1a1a;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 255, 255, 0.05) inset;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 550px;
            min-height: ${appMinHeight};
            position: relative;
        }
        #app h1 {
            color: #e0b040;
            margin-bottom: 20px;
            font-size: 2.2em;
            text-shadow: 0 0 5px rgba(255, 255, 0, 0.3);
        }
        #app #start-button, #app #reset-button {
            padding: 15px 30px;
            font-size: 1.2em;
            background-color: #4a4a4a;
            color: #e0e0e0;
            border: 2px solid #666;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.1s;
            margin-top: 20px;
        }
        #app #start-button:hover, #app #reset-button:hover {
            background-color: #6a6a6a;
            transform: translateY(-2px);
        }
        #app #start-button {
            background-color: #007bff;
            border-color: #0056b3;
        }
        #app #start-button:hover {
            background-color: #0056b3;
        }
        #app #dev-solve-button {
            position: absolute;
            bottom: 10px;
            right: 10px;
            padding: 8px 15px;
            font-size: 0.9em;
            background-color: #8b0000;
            color: white;
            border: 2px solid #550000;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s;
            z-index: 10;
        }
        #app #dev-solve-button:hover {
            background-color: #a00000;
        }
        #app #chimes-display {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 15px;
            margin: 30px 0;
            width: 100%;
            max-width: 500px;
        }
        #app .chime-button {
            width: 100px;
            height: 100px;
            background-color: #3d3d3d;
            color: #e0b040;
            border: 2px solid #555;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 3em;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
        }
        #app .chime-button:hover:not(.disabled) {
            background-color: #4a4a4a;
            box-shadow: 0 0 15px rgba(255, 255, 0, 0.5);
        }
        #app .chime-button.disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }
        #app .chime-button.flash {
            background-color: #ffd700;
            box-shadow: 0 0 25px #ffd700, 0 0 10px rgba(255,255,0,0.8) inset;
            transition: background-color 0.05s ease-in-out, box-shadow 0.05s ease-in-out;
        }
        #app #puzzle-message {
            margin-top: 15px;
            font-size: 1.2em;
            color: #28a745;
            font-weight: bold;
            min-height: 1.2em;
            line-height: 1.2em;
        }
    `;
    document.head.appendChild(style);

    const h1 = document.createElement('h1');
    h1.textContent = gameTitle;
    targetDiv.appendChild(h1);

    const puzzleContainer = document.createElement('div');
    puzzleContainer.id = puzzleContainerId;
    targetDiv.appendChild(puzzleContainer);

    const chimesDisplay = document.createElement('div');
    chimesDisplay.id = 'chimes-display';
    puzzleContainer.appendChild(chimesDisplay);

    for (let i = 0; i < numChimes; i++) {
        const chimeButton = document.createElement('div');
        chimeButton.classList.add('chime-button');
        chimeButton.dataset.index = i;
        chimeButton.textContent = runeSymbols[i % runeSymbols.length];
        chimeButton.addEventListener('click', () => handleChimeClick(i));
        chimesDisplay.appendChild(chimeButton);
    }

    const messageDiv = document.createElement('div');
    messageDiv.id = 'puzzle-message';
    targetDiv.appendChild(messageDiv);

    const startButton = document.createElement('button');
    startButton.id = 'start-button';
    startButton.textContent = 'Begin Ritual';
    targetDiv.appendChild(startButton);
    startButton.addEventListener('click', startGame);

    const resetButton = document.createElement('button');
    resetButton.id = 'reset-button';
    resetButton.textContent = 'Reset Runes';
    targetDiv.appendChild(resetButton);
    resetButton.addEventListener('click', resetGame);

    const devSolveButton = document.createElement('button');
    devSolveButton.id = 'dev-solve-button';
    devSolveButton.textContent = 'Dev Solve';
    targetDiv.appendChild(devSolveButton);
    devSolveButton.addEventListener('click', solvePuzzle);

    function generateSequence() {
        masterSequence = [];
        for (let i = 0; i < sequenceLength; i++) {
            masterSequence.push(Math.floor(Math.random() * numChimes));
        }
    }

    async function playSequence() {
        roundActive = true;
        disableChimes();
        messageDiv.textContent = 'Observe the ancient echoes...';
        startButton.disabled = true;

        for (let i = 0; i < masterSequence.length; i++) {
            const chimeIndex = masterSequence[i];
            const chimeButton = document.querySelector(`#${puzzleContainerId} .chime-button[data-index="${chimeIndex}"]`);

            chimeButton.classList.add('flash');
            await new Promise(resolve => setTimeout(resolve, flashDuration));
            chimeButton.classList.remove('flash');
            await new Promise(resolve => setTimeout(resolve, sequenceDelay - flashDuration));
        }
        messageDiv.textContent = 'Your turn. Recreate the echoes.';
        enableChimes();
        playerSequence = [];
        roundActive = false;
    }

    function handleChimeClick(index) {
        if (roundActive) return;

        const chimeButton = document.querySelector(`#${puzzleContainerId} .chime-button[data-index="${index}"]`);
        chimeButton.classList.add('flash');
        setTimeout(() => {
            chimeButton.classList.remove('flash');
        }, 100);

        playerSequence.push(index);
        checkPlayerInput();
    }

    function checkPlayerInput() {
        for (let i = 0; i < playerSequence.length; i++) {
            if (playerSequence[i] !== masterSequence[i]) {
                messageDiv.textContent = 'Incorrect sequence. The echoes fade...';
                messageDiv.style.color = '#dc3545';
                disableChimes();
                startButton.disabled = false;
                return;
            }
        }

        if (playerSequence.length === masterSequence.length) {
            messageDiv.textContent = 'Sequence matched! A subtle tremor...';
            messageDiv.style.color = '#28a745';
            disableChimes();
            setTimeout(() => {
                currentRound++;
                if (currentRound > sequenceLength) {
                    messageDiv.textContent = 'The Runes resonate! The gate opens!';
                    messageDiv.style.color = '#28a745';
                    startButton.disabled = true;
                }
            }, 1000);
        }
    }

    function startGame() {
        resetGame();
        generateSequence();
        playSequence();
    }

    function resetGame() {
        masterSequence = [];
        playerSequence = [];
        roundActive = false;
        currentRound = 1;
        messageDiv.textContent = 'Awaiting the ancient echoes...';
        messageDiv.style.color = '#ccc';
        startButton.textContent = 'Begin Ritual';
        startButton.disabled = false;
        enableChimes();
        Array.from(document.querySelectorAll(`#${puzzleContainerId} .chime-button`)).forEach(chime => {
            chime.classList.remove('flash');
        });
        disableChimes();
    }

    function enableChimes() {
        Array.from(document.querySelectorAll(`#${puzzleContainerId} .chime-button`)).forEach(chime => {
            chime.classList.remove('disabled');
            chime.style.pointerEvents = 'auto';
        });
    }

    function disableChimes() {
        Array.from(document.querySelectorAll(`#${puzzleContainerId} .chime-button`)).forEach(chime => {
            chime.classList.add('disabled');
            chime.style.pointerEvents = 'none';
        });
    }

    async function solvePuzzle() {
        masterSequence = [];
        for (let i = 0; i < numChimes; i++) {
            masterSequence.push(i);
        }
        if (masterSequence.length > sequenceLength) {
            masterSequence = masterSequence.slice(0, sequenceLength);
        }

        messageDiv.textContent = 'Solving the Runes...';
        messageDiv.style.color = '#ffc107';

        await playSequence();
        playerSequence = [...masterSequence];
        setTimeout(() => {
            checkPlayerInput();
        }, (masterSequence.length * sequenceDelay) + 500);
    }

    resetGame();
};