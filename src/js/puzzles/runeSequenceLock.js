function runeSequenceLock(targetDiv, scene) {
    // --- Input Validation ---
    /*if (!(targetDiv instanceof HTMLElement)) {
        console.error("runeSequenceLock Error: targetDiv is not a valid HTMLElement. Please ensure you pass a DOM element to the function.", targetDiv);
        return; // Stop execution if targetDiv is not valid
    }*/

    // Initiate variables
    const isSolved = localStorage.getItem("runeSequenceLock");
    const puzzleContainerId = "rune-lock-puzzle-container";
    const gameTitle = "DEVINEZ LA COMBINAISON";

    const numRunes = 16; // Number of distinct runes to display
    const solutionSequence = [1, 3, 0, 4, 15, 8]; // The correct sequence of rune indexes
    // Rune symbols from the Elder Futhark runic alphabet
    const runeSymbols = [
        "ᚠ",
        "ᚢ",
        "ᚦ",
        "ᚨ",
        "ᚱ",
        "ᚲ",
        "ᚷ",
        "ᚹ",
        "ᚺ",
        "ᚾ",
        "ᛁ",
        "ᛃ",
        "ᛄ",
        "ᛇ",
        "ᛈ",
        "ᛉ",
    ];

    let playerAttempt = []; // Stores the sequence of runes clicked by the player
    let puzzleSolved = false; // Flag to track if the puzzle is solved

    // Create style element
    const style = document.createElement("style");
    style.setAttribute("data-puzzle-style", "true");

    // Style the puzzle container and its contents
    style.textContent = `
        #puzzleDiv {
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

        button { /* Target buttons inside #app-lock */
            padding: 15px 30px;
            font-size: 1.2em;
            background-color: #4a4a4a;
            color: #e0e0e0;
            border: 2px solid #666;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.1s;
            margin-top: 20px;
            font-family: inherit;
        }
        button:hover:not(:disabled) {
            background-color: #6a6a6a;
            transform: translateY(-2px);
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        #dev-solve-button-lock { /* Specific ID for this button */
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
        #dev-solve-button-lock:hover:not(:disabled) {
            background-color: #a00000;
        }

        #runes-display { /* Specific container for this puzzle's runes */
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 15px;
            margin: 30px 0;
            width: 100%;
            max-width: 600px; /* Adjust max width if many runes */
        }

        .rune-button {
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
            user-select: none;
        }
        .rune-button:hover:not(.disabled) {
            background-color: #4a4a4a;
            box-shadow: 0 0 15px rgba(255, 255, 0, 0.5);
        }
        .rune-button.disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        /* Persistent flash for correct clicks */
        .rune-button.flash {
            background-color: #ffd700;
            box-shadow: 0 0 25px #ffd700, 0 0 10px rgba(255,255,0,0.8) inset;
            transition: none; /* Make it snap on instantly */
        }

        #puzzle-message {
            margin-top: 15px;
            font-size: 1.2em;
            color: #ccc; /* Default neutral color */
            font-weight: bold;
            min-height: 1.2em;
            line-height: 1.2em;
        }
    `;

    // Apply stylesheet to the document
    document.head.appendChild(style);

    // Generate HTML structure ---------------------------------------------------

    // Title
    const h1 = document.createElement("h1");
    h1.textContent = gameTitle;
    targetDiv.appendChild(h1);

    // Puzzle container
    const puzzleContainer = document.createElement("div");
    puzzleContainer.id = puzzleContainerId;
    targetDiv.appendChild(puzzleContainer);

    // Rune display area
    const runesDisplay = document.createElement("div");
    runesDisplay.id = "runes-display";
    puzzleContainer.appendChild(runesDisplay);

    // Create rune buttons
    for (let i = 0; i < numRunes; i++) {
        const runeButton = document.createElement("div");
        runeButton.classList.add("rune-button");
        runeButton.dataset.index = i;
        runeButton.textContent = runeSymbols[i % runeSymbols.length];
        runeButton.addEventListener("click", () => handleRuneClick(i));
        runesDisplay.appendChild(runeButton);
    }

    // Message / warning
    const messageDiv = document.createElement("div");
    messageDiv.id = "puzzle-message";
    targetDiv.appendChild(messageDiv);

    // Reset button
    const resetButton = document.createElement("button");
    resetButton.id = "reset-button-lock";
    resetButton.textContent = "Reset Lock";
    targetDiv.appendChild(resetButton);
    resetButton.addEventListener("click", resetPuzzle);

    // Dev solve button
    const devSolveButton = document.createElement("button");
    devSolveButton.id = "dev-solve-button-lock";
    devSolveButton.textContent = "Dev Solve";
    targetDiv.appendChild(devSolveButton);
    devSolveButton.addEventListener("click", solvePuzzle);

    // Array to store all created DOM elements for easy cleanup
    const DOMelements = [
        h1,
        puzzleContainer,
        runesDisplay,
        messageDiv,
        resetButton,
        devSolveButton,
    ];

    // Check if the puzzle has been previously solved
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

    // --- Puzzle Logic Functions ------------------------------------------------

    /**
     * Handles the click event on a rune button.
     * @param {number} clickedIndex The index of the clicked rune.
     */
    function handleRuneClick(clickedIndex) {
        if (puzzleSolved) return; // Ignore clicks if puzzle is already solved

        const expectedRune = solutionSequence[playerAttempt.length];

        // Check if the clicked rune is the next expected rune in the sequence
        if (clickedIndex === expectedRune) {
            const runeButton = document.querySelector(
                `#${puzzleContainerId} .rune-button[data-index="${clickedIndex}"]`,
            );
            runeButton.classList.add("flash"); // Keep the rune lit

            playerAttempt.push(clickedIndex); // Add the clicked rune to the player's attempt

            messageDiv.textContent = "Correct rune set!";
            messageDiv.style.color = "#28a745"; // Green for success

            if (playerAttempt.length === solutionSequence.length) {
                // Puzzle Solved!
                messageDiv.textContent = "The Rune Lock opens!";
                messageDiv.style.color = "#ffd700"; // Golden for triumph
                disableRunes(); // Prevent further interaction with runes
                resetButton.disabled = false; // Enable reset button
                devSolveButton.disabled = true; // Disable dev solve button
                puzzleSolved = true;
                localStorage.setItem("runeSequenceLock", "true"); // Mark puzzle as solved in local storage
                // TODO: Add your puzzle completion logic here (e.g., trigger an event, unlock a door)
            }
        } else {
            // Incorrect click - Reset the player's attempt
            messageDiv.textContent = "Incorrect rune. Sequence reset.";
            messageDiv.style.color = "#dc3545"; // Red for error
            playerAttempt = []; // Clear player's attempt
            // Clear all lit runes after a short delay for visual feedback
            setTimeout(() => {
                Array.from(
                    document.querySelectorAll(
                        `#${puzzleContainerId} .rune-button`,
                    ),
                ).forEach((rune) => {
                    rune.classList.remove("flash");
                });
                messageDiv.textContent = "Enter the sequence...";
                messageDiv.style.color = "#ccc";
            }, 500); // Small delay before resetting appearance
        }
    }

    /**
     * Resets the puzzle to its initial state.
     */
    function resetPuzzle() {
        playerAttempt = [];
        puzzleSolved = false;
        messageDiv.textContent = "Enter the sequence...";
        messageDiv.style.color = "#ccc";
        resetButton.disabled = false;
        devSolveButton.disabled = false;

        // Remove the 'flash' class from all runes to dim them
        Array.from(
            document.querySelectorAll(`#${puzzleContainerId} .rune-button`),
        ).forEach((rune) => {
            rune.classList.remove("flash");
        });
        enableRunes(); // Ensure runes are clickable
    }

    /**
     * Enables all rune buttons for interaction.
     */
    function enableRunes() {
        Array.from(
            document.querySelectorAll(`#${puzzleContainerId} .rune-button`),
        ).forEach((rune) => {
            rune.classList.remove("disabled");
            rune.style.pointerEvents = "auto"; // Allow pointer events
        });
    }

    /**
     * Disables all rune buttons to prevent interaction.
     */
    function disableRunes() {
        Array.from(
            document.querySelectorAll(`#${puzzleContainerId} .rune-button`),
        ).forEach((rune) => {
            rune.classList.add("disabled");
            rune.style.pointerEvents = "none"; // Disallow pointer events
        });
    }

    /**
     * Developer function to automatically solve the puzzle.
     * Simulates clicking the correct sequence with a visual delay.
     */
    async function solvePuzzle() {
        if (puzzleSolved) return;

        messageDiv.textContent = "Solving the Rune Lock...";
        messageDiv.style.color = "#ffc107"; // Yellow for solving in progress
        disableRunes(); // Prevent player interference during auto-solve
        resetButton.disabled = true;
        devSolveButton.disabled = true;

        // Simulate clicks through the solution sequence
        for (let i = 0; i < solutionSequence.length; i++) {
            const runeIndex = solutionSequence[i];
            const runeButton = document.querySelector(
                `#${puzzleContainerId} .rune-button[data-index="${runeIndex}"]`,
            );

            // Apply flash to the current rune
            runeButton.classList.add("flash");
            messageDiv.textContent = `Solving: Setting Rune ${i + 1}/${solutionSequence.length}`;

            // Add a small delay for visual effect
            await new Promise((resolve) => setTimeout(resolve, 300));
        }

        playerAttempt = [...solutionSequence]; // Set player's attempt to the complete solution
        puzzleSolved = true;
        localStorage.setItem("runeSequenceLock", "true"); // Mark puzzle as solved in local storage
        messageDiv.textContent = "Rune Lock Solved by Dev!";
        messageDiv.style.color = "#28a745"; // Green for solved
        resetButton.disabled = false;
        devSolveButton.disabled = true;
    }

    /**
     * Handles the process of leaving the puzzle, cleaning up DOM elements and updating scene state.
     */
    function leaveGame() {
        scene.player.isQuestActive = false;
        scene.player.isQuestOpen = false;
        scene.input.keyboard.enabled = true; // Re-enable main game keyboard input

        // Hide the main puzzle container and remove all dynamically created DOM elements
        // IMPORTANT: Ensure 'puzzleDiv' is the ID of the main container element
        // that holds everything generated by this function. If 'targetDiv'
        // is meant to be this main container, you might use targetDiv.style.display = 'none';
        // or ensure 'puzzleDiv' is consistently used for the parent container.
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
    }

    // --- Initial Puzzle Setup ---
    resetPuzzle(); // Initialize the puzzle state when the function is called
}

export { runeSequenceLock };