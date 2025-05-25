/**
 * @author Honglue Zheng
 * @note echoing chimes sequencer puzzle
 */

function echoing_chimes_puzzle(targetDiv, scene) {
    // Initiate variables
    const isSolved = localStorage.getItem("sequencer");
    const puzzleContainerId = 'chimes-puzzle-container';
    const gameTitle = 'RUNES RÉSONANTES';
    const numChimes = 12;
    const sequenceLength = Math.floor(Math.random() * (8 - 4)) + 4;  // Min: 4, Max: 8
    const roundLength = Math.floor(Math.random() * (4 - 2)) + 2;  // Min: 2, Max: 4
    const flashDuration = 400;
    const sequenceDelay = 700;

    const runeSymbols = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ'];
    let masterSequence = [];
    let playerSequence = [];
    let roundActive = false;
    let currentRound = 1;

    // Create style element
    const style = document.createElement('style');
    style.setAttribute('data-puzzle-style', 'true'); 

    // Style the puzzle container and its contents
    style.textContent = `
        #puzzleDiv {
            background-color: #1a1a1a;
            padding: 25px;
            border-radius: 3px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 255, 255, 0.05) inset;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 550px;
            min-height: 625px;
            position: relative;
        }
        #puzzleDiv * {
            font-family: minecraft;
        }
        h1 {
            color: #e0b040;
            margin-bottom: 20px;
            font-size: 2.2em;
            text-shadow: 0 0 5px rgba(255, 255, 0, 0.3);
        }
        #start-button, #reset-button {
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
        #start-button:hover, #reset-button:hover {
            transform: translateY(-2px);
        }
        #start-button {
            background-color: #007bff;
            border-color: #0056b3;
        }
        #start-button:hover {
            background-color: #0056b3;
        }
        #dev-solve-button {
            position: absolute;
            bottom: 10px;
            right: 5%;
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
        #dev-solve-button:hover {
            background-color: #a00000;
        }
        #chimes-display {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 15px;
            margin: 30px 0;
            width: 100%;
            max-width: 500px;
        }
        .chime-button {
            width: 100px;
            height: 100px;
            background-color: #3d3d3d;
            color: #e0b040;
            border: 2px solid #555;
            border-radius: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 3em;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
        }
        .chime-button:hover:not(.disabled) {
            background-color: #4a4a4a;
            box-shadow: 0 0 15px rgba(255, 255, 0, 0.5);
        }
        .chime-button.disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }
        .chime-button.flash {
            background-color: #ffd700;
            box-shadow: 0 0 25px #ffd700, 0 0 10px rgba(255,255,0,0.8) inset;
            transition: background-color 0.05s ease-in-out, box-shadow 0.05s ease-in-out;
        }
        #puzzle-message {
            margin-top: 15px;
            font-size: 1.2em;
            color: #28a745;
            font-weight: bold;
            min-height: 1.2em;
            line-height: 1.2em;
        }
    `;

    // Generate HTML structure ---------------------------------------------------

    // Apply stylesheet to the document
    document.head.appendChild(style);

    // Title
    const h1 = document.createElement('h1');
    h1.textContent = gameTitle;
    targetDiv.appendChild(h1);

    // Puzzles container
    const puzzleContainer = document.createElement('div');
    puzzleContainer.id = puzzleContainerId;
    targetDiv.appendChild(puzzleContainer);

    // Chimes display
    const chimesDisplay = document.createElement('div');
    chimesDisplay.id = 'chimes-display';
    puzzleContainer.appendChild(chimesDisplay);

    // Create chime buttons choices
    for (let i = 0; i < numChimes; i++) {
        const chimeButton = document.createElement('div');
        chimeButton.classList.add('chime-button'); // Add to chime-button class
        chimeButton.dataset.index = i;             // Add index to chime-button data
        chimeButton.textContent = runeSymbols[i % runeSymbols.length];
        chimeButton.addEventListener('click', () => handleChimeClick(i));   // Add click event listener
        chimesDisplay.appendChild(chimeButton);
    }

    // Message / warning 
    const messageDiv = document.createElement('div');
    messageDiv.id = 'puzzle-message';
    targetDiv.appendChild(messageDiv);

    // Start sequence button 
    const startButton = document.createElement('button');
    startButton.id = 'start-button';
    startButton.textContent = 'Débuter le rituel';
    targetDiv.appendChild(startButton);
    startButton.addEventListener('click', startGame); // Start event listener

    // Reset button
    const resetButton = document.createElement('button');
    resetButton.id = 'reset-button';
    resetButton.textContent = 'Recommencer';
    targetDiv.appendChild(resetButton);
    resetButton.addEventListener('click', resetGame); // Reset event listener

    // Dev solve button
    const devSolveButton = document.createElement('button');
    devSolveButton.id = 'dev-solve-button';
    devSolveButton.textContent = 'Dev';
    targetDiv.appendChild(devSolveButton);
    devSolveButton.addEventListener('click', solvePuzzle);  // Solve puzzle

    const DOMelements = [h1, puzzleContainer, messageDiv, startButton, resetButton, devSolveButton];

    // If puzzle has been solved, make player leave the puzzle
    if (isSolved == "true") {
        messageDiv.textContent = 'Le coffre s\'est déjà ouvert!';
        disableButtons();
        disableChimes();
        // Reenable keyboard input
        scene.input.keyboard.enabled = true;
        setTimeout(() => {
            leaveGame();
        }, 3000);
    } else {
        resetGame();
    }

    // Core sequence system ---------------------------------------------------
    // Generate master sequence
    function generateSequence() {
        masterSequence = [];
        for (let i = 0; i < sequenceLength; i++) {
            masterSequence.push(Math.floor(Math.random() * numChimes)); // Generate random chime index
        }
    }

    // Play sequence to player. Async to enable awaiting flash effects delay
    async function playSequence() {
        roundActive = true;
        disableChimes();
        messageDiv.textContent = 'En observation des échos anciens...';
        startButton.disabled = true;

        // Play sequence
        for (let i = 0; i < masterSequence.length; i++) {
            const chimeIndex = masterSequence[i];
            // Get chime button element
            const chimeButton = document.querySelector(`#${puzzleContainerId} .chime-button[data-index="${chimeIndex}"]`);

            // Flash the chime button
            chimeButton.classList.add('flash');
            await new Promise(resolve => setTimeout(resolve, flashDuration)); // wait for flashDuration ms
            chimeButton.classList.remove('flash');
            await new Promise(resolve => setTimeout(resolve, sequenceDelay - flashDuration)); // wait for sequenceDelay - flashDuration ms
        }
        messageDiv.textContent = 'Ton tour. Recréez les échoes.';
        enableChimes(); // Enable user interaction with the chime buttons
        playerSequence = []; // Create user sequence
        roundActive = false;
    }

    function handleChimeClick(index) {
        // Prevent clicking during the sequence demo
        if (roundActive) return;

        // Flash the chime button
        const chimeButton = document.querySelector(`#${puzzleContainerId} .chime-button[data-index="${index}"]`);
        chimeButton.classList.add('flash');
        setTimeout(() => {
            chimeButton.classList.remove('flash');
        }, 300);

        // Add the chime index to the player sequence
        playerSequence.push(index);
        checkPlayerInput(index); // Check player input
    }

    // Check if player input is correct
    function checkPlayerInput(i) {
        // Compare player input with master sequence
        for (let i = 0; i < playerSequence.length; i++) {
            // Incorrect chime
            if (playerSequence[i] !== masterSequence[i]) {
                messageDiv.textContent = 'Séquence incorrect. Les échoes s\'évanouissent...';
                messageDiv.style.color = '#dc3545'; // Red
                disableChimes();
                disableButtons();
                // Reset game
                setTimeout(() => {
                    resetGame();
                }, 2000);
                return;
            }
        }

        // Player reaches the end of the sequence
        if (playerSequence.length === masterSequence.length) {
            messageDiv.textContent = 'Séquence correspondante! Un tremblement subtil...';
            messageDiv.style.color = '#28a745'; // Green
            disableChimes();
            currentRound++; // Increment round

            disableButtons(); // Disable start&reset buttons + dev button

            if (currentRound > roundLength) { // Check if player has reached the required round
                // Unlock fragment
                messageDiv.textContent = 'Les runes résonnent! Le coffre s\'ouvre!';
                messageDiv.style.color = '#28a745';
                startButton.disabled = true;
                localStorage.setItem('sequencer', "true"); // Set sequencer solved to true
                // Reenable keyboard input
                scene.input.keyboard.enabled = true;
                // Leave game
                setTimeout(() => {
                    leaveGame();
                }, 2000);
                return;
            }

            // Pass to next round
            setTimeout(() => {
                enableButtons(); // Reenable start&reset buttons
                messageDiv.textContent = 'Prochain tour...';
            }, 2000);
        }
    }

    // Init game
    function startGame() {
        generateSequence();
        playSequence();
    }

    // Reset game
    function resetGame() {
        // Clear sequences
        masterSequence = [];
        playerSequence = [];
        roundActive = false;
        currentRound = 1;
        // Reset messages
        messageDiv.textContent = 'En attente des échos anciens...';
        messageDiv.style.color = '#ccc';
        startButton.textContent = 'Débuter le rituel';
        startButton.disabled = false;
        enableButtons();
        enableChimes(); // Reenable buttons to clear flash classes
        Array.from(document.querySelectorAll(`#${puzzleContainerId} .chime-button`)).forEach(chime => {
            chime.classList.remove('flash'); // Remove all flash
        });
        disableChimes(); // Disable buttons
    }

    // Enable user interaction with the chime buttons
    function enableChimes() {
        Array.from(document.querySelectorAll(`#${puzzleContainerId} .chime-button`)).forEach(chime => {
            chime.classList.remove('disabled');
            chime.style.pointerEvents = 'auto';
        });
    }

    // Prevent player from clicking the chimes buttons
    function disableChimes() {
        Array.from(document.querySelectorAll(`#${puzzleContainerId} .chime-button`)).forEach(chime => {
            chime.classList.add('disabled');
            chime.style.pointerEvents = 'none';
        });
    }

    // Disable start/reset buttons
    function disableButtons() {
       startButton.disabled = true;
       startButton.style.pointerEvents = 'none';
       startButton.style.backgroundColor = '#6a6a6a';
       resetButton.disabled = true;
       resetButton.style.pointerEvents = 'none';
       resetButton.style.backgroundColor = '#6a6a6a';
       devSolveButton.disabled = true;
       devSolveButton.style.pointerEvents = 'none';
       devSolveButton.style.backgroundColor = '#6a6a6a';
    }

    // Reenable start/reset buttons
    function enableButtons() {
        startButton.disabled = false;
        startButton.style.pointerEvents = 'auto';
        startButton.style.backgroundColor = '#007bff';
        resetButton.disabled = false;
        resetButton.style.pointerEvents = 'auto';
        resetButton.style.backgroundColor = '#4a4a4a';
        devSolveButton.disabled = false;
        devSolveButton.style.pointerEvents = 'auto';
        devSolveButton.style.backgroundColor = '#007bff';
    }

    // Dev solve puzzle
    async function solvePuzzle() {
        disableButtons();

        // Generate new sequence
        masterSequence = [];
        for (let i = 0; i < numChimes; i++) {
            masterSequence.push(i);
        }
        if (masterSequence.length > sequenceLength) {
            masterSequence = masterSequence.slice(0, sequenceLength);
        }

        messageDiv.textContent = 'Résolution des runes...';
        messageDiv.style.color = '#ffc107';

        // Await for sequence to finish playing to prevent parallel execution
        await playSequence();
        playerSequence = [...masterSequence]; // Copy master sequence to player sequence
        setTimeout(() => {
            checkPlayerInput();
        }, (masterSequence.length * sequenceDelay) + 500);
    }
    
    function leaveGame() {
        scene.player.isQuestActive = false;
        scene.player.isQuestOpen = false;
        // Destroy all items
        document.getElementById('puzzleDiv').style.display = 'none';
        DOMelements.forEach(element => {
            element.remove();
        });
    }
};

export { echoing_chimes_puzzle }; 