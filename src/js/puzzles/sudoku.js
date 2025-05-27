function sudoku(targetDiv, scene) {
    const isSolved = localStorage.getItem("sudoku");
    const puzzleContainerId = "sudoku-puzzle-container";
    const gameTitle = "TERMINEZ LA MOSAÏQUE";
    const boardSize = 4;

    const patterns = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ'];

    let patternGrid = [];
    let solutionGrid = [];
    let initialClues = [];
dd
    isSolved = false;

    const style = document.createElement('style');
    style.setAttribute('data-puzzle-style', 'true');
    const cellSize = 80;
    const cellGap = 5;
    const puzzleGridTotalSize = `${boardSize * cellSize + (boardSize - 1) * cellGap}px`;

    style.textContent = `
        puzzeDiv {
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
            min-height: 300px;
            position: relative;
        }
        h1 {
            color: #e0b040;
            margin-bottom: 20px;
            font-size: 2.2em;
            text-shadow: 0 0 5px rgba(255, 255, 0, 0.3);
        }
        #reset-button {
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
        reset-button:hover {
            background-color: #6a6a6a;
            transform: translateY(-2px);
        }
        #dev-solve-button {
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
        #dev-solve-button:hover {
            background-color: #a00000;
        }
        #${puzzleContainerId} {
            display: grid;
            grid-template-columns: repeat(${boardSize}, ${cellSize}px);
            grid-template-rows: repeat(${boardSize}, ${cellSize}px);
            gap: ${cellGap}px;
            width: ${puzzleGridTotalSize};
            height: ${puzzleGridTotalSize};
            border: 2px solid #444;
            background-color: #2a2a2a;
            padding: 5px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .tapestry-cell {
            width: ${cellSize}px;
            height: ${cellSize}px;
            background-color: #3d3d3d;
            border: 1px solid #555;
            border-radius: 3px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 2.5em;
            cursor: pointer;
            transition: background-color 0.1s, transform 0.1s, box-shadow 0.2s, border-color 0.2s, color 0.2s;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
            font-family: 'Times New Roman', serif;
            color: #ccc;
        }
        .tapestry-cell.blank {
            background-color: #2b2b2b;
        }
        .tapestry-cell.clue {
            cursor: default;
            box-shadow: inset 0 0 8px rgba(255,215,0,0.5);
            border-color: #ffd700;
            color: #e0b040;
        }
        .tapestry-cell.player-activated {
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.4), 0 2px 5px rgba(0, 0, 0, 0.5);
            border-color: rgba(255, 215, 0, 0.6);
            color: #f0f0f0;
        }
        .tapestry-cell:not(.clue):hover {
            background-color: #4a4a4a;
            transform: scale(1.02);
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
    document.head.appendChild(style);

    const h1 = document.createElement('h1');
    h1.textContent = gameTitle;
    targetDiv.appendChild(h1);

    const puzzleContainer = document.createElement('div');
    puzzleContainer.id = puzzleContainerId;
    targetDiv.appendChild(puzzleContainer);

    const messageDiv = document.createElement('div');
    messageDiv.id = 'puzzle-message';
    targetDiv.appendChild(messageDiv);

    const resetButton = document.createElement('button');
    resetButton.id = 'reset-button';
    resetButton.textContent = 'New Tapestry';
    targetDiv.appendChild(resetButton);
    resetButton.addEventListener('click', initializePuzzleLogic);

    const devSolveButton = document.createElement('button');
    devSolveButton.id = 'dev-solve-button';
    devSolveButton.textContent = 'Dev Solve';
    targetDiv.appendChild(devSolveButton);
    devSolveButton.addEventListener('click', solvePuzzle);

    const DOMelements = [
        h1,
        puzzleContainer,
        messageDiv,
        resetButton,
        devSolveButton,
    ];

    if (isSolved === "true") {
        messageDiv.textContent = "Le coffre s'est déjà ouvert!";
        // IMPORTANT: The `disableButton` function expects a specific button element.
        // If you intend to disable the resetButton or another button here,
        // make sure it's the correct element. As `confirmButton` was not defined,
        // I've commented out the line. Replace `confirmButton` with `resetButton`
        // or the appropriate button if you want to disable something immediately.
        // disableButton(confirmButton);
        scene.input.keyboard.enabled = true; // Re-enable keyboard input for the scene
        setTimeout(() => {
            leaveGame(); // Automatically leave the puzzle after a delay
            return;
        }, 2000);
    }

    function leaveGame() {
        scene.player.isQuestActive = false;
        scene.player.isQuestOpen = false;
        scene.input.keyboard.enabled = true; // Re-enable main game keyboard input

        // Hide the main puzzle container and remove all dynamically created DOM elements
        // IMPORTANT: Ensure 'puzzleDiv' is the ID of the main container element
        // that holds everything generated by this function. If 'targetDiv'
        // is meant to be this main container, you might use targetDiv.style.display = 'none';
        // or ensure 'puzzleDiv' is consistently used for the parent container.
    document.getElementById('puzzleDiv').style.display = 'none';
        document.head.removeChild(style);
        DOMelements.forEach(element => {
            element.remove();
        });
    }

    function initializePuzzleLogic() {
        puzzleContainer.innerHTML = '';
        messageDiv.textContent = '';
        patternGrid = Array(boardSize * boardSize).fill(-1);
        solutionGrid = [];
        initialClues = [];

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const patternIndex = (r + c) % patterns.length;
                solutionGrid.push(patternIndex);
            }
        }

        const numClues = Math.floor(boardSize * boardSize * (0.25 + Math.random() * 0.1));
        let placedClues = 0;
        while (placedClues < numClues) {
            const randomIndex = Math.floor(Math.random() * (boardSize * boardSize));
            if (!initialClues.includes(randomIndex)) {
                initialClues.push(randomIndex);
                patternGrid[randomIndex] = solutionGrid[randomIndex];
                placedClues++;
            }
        }

        renderPuzzle();
    }

    function renderPuzzle() {
        const currentPuzzleContainer = document.getElementById(puzzleContainerId);
        currentPuzzleContainer.innerHTML = '';
        patternGrid.forEach((patternIndex, index) => {
            const cell = document.createElement('div');
            cell.classList.add('tapestry-cell');
            cell.dataset.index = index;

            if (initialClues.includes(index)) {
                cell.classList.add('clue');
                cell.textContent = patterns[patternIndex];
            } else {
                cell.classList.add('blank');
                if (patternIndex !== -1) {
                    cell.textContent = patterns[patternIndex];
                    cell.classList.add('player-activated');
                } else {
                    cell.textContent = '';
                    cell.classList.remove('player-activated');
                }
                cell.addEventListener('click', () => cyclePattern(index));
            }
            currentPuzzleContainer.appendChild(cell);
        });
        checkWin();
    }

    function cyclePattern(index) {
        if (initialClues.includes(index)) {
            return;
        }

        const currentPatternIndex = patternGrid[index];
        const nextPatternIndex = (currentPatternIndex === -1) ? 0 : (currentPatternIndex + 1) % patterns.length;

        patternGrid[index] = nextPatternIndex;
        renderPuzzle();
    }

    function checkWin() {
        let allCorrect = true;
        for (let i = 0; i < boardSize * boardSize; i++) {
            if (patternGrid[i] === -1 || patternGrid[i] !== solutionGrid[i]) {
                allCorrect = false;
                break;
            }
        }

        if (allCorrect) {
            messageDiv.textContent = 'The tapestry is complete! A hidden passage appears!';
            messageDiv.style.color = '#28a745';
            disableInteraction();
        } else {
            messageDiv.textContent = 'Weave the pattern correctly...';
            messageDiv.style.color = '#ccc';
            enableInteraction();
        }
    }

    function disableInteraction() {
        document.querySelectorAll(`#${puzzleContainerId} .tapestry-cell.blank`).forEach(cell => {
            cell.style.pointerEvents = 'none';
            cell.style.opacity = '0.8';
        });
    }

    function enableInteraction() {
        document.querySelectorAll(`#${puzzleContainerId} .tapestry-cell.blank`).forEach(cell => {
            cell.style.pointerEvents = 'auto';
            cell.style.opacity = '1';
        });
    }

    function solvePuzzle() {
        patternGrid = [...solutionGrid];
        renderPuzzle();
    }
    
    const puzzleDivElement = document.getElementById("puzzleDiv");
        if (puzzleDivElement) {
            puzzleDivElement.style.display = "none";
        }

        DOMelements.forEach((element) => {
            if (element && element.parentNode) {
                // Check if element exists and has a parent before removing
                element.remove();
            }
        });
        if (style && style.parentNode) {
            // Check if style element exists and has a parent
            style.remove(); // Remove the dynamically added style tag
        }
    
    initializePuzzleLogic();
}

export { sudoku };