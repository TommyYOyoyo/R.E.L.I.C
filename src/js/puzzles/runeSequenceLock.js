import { fragmentFind } from "../player.js";

function runeSequenceLock(targetDiv, scene) {
    console.log("This puzzle runs!");

    // Initiate variables
    const puzzleContainerId = "rune-sequence-lock-container";
    const gameTitle = "FORCEZ LE CODE";

    let playerAttempt = [];
    let puzzleSolved = false; // This will be managed internally

    const numRunes = 12;
    const solutionSequence = [1, 3, 11, 5, 9];

    const runeSymbols = [
        "ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛄ", "ᚹ", "ᛈ", "ᛉ",
    ];

    // Create style element (needed even for cleanup if puzzle was previously loaded)
    const style = document.createElement("style");
    style.setAttribute("data-puzzle-style", "true");

    // We'll append the style later, but define it here for consistent cleanup
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
            font-family: inherit;
        }
        #reset-button:hover:not(:disabled) {
            background-color: #6a6a6a;
            transform: translateY(-2px);
        }
        #reset-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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
        #dev-solve-button:hover:not(:disabled) {
            background-color: #a00000;
        }

        #runes-display {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 15px;
            margin: 30px 0;
            width: 100%;
            max-width: 600px;
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

        .rune-button.flash {
            background-color: #ffd700;
            box-shadow: 0 0 25px #ffd700, 0 0 10px rgba(255,255,0,0.8) inset;
            transition: none;
        }

        #puzzle-message {
            margin-top: 15px;
            font-size: 1.2em;
            color: #ccc;
            font-weight: bold;
            min-height: 1.2em;
            line-height: 1.2em;
        }
    `;

    // --- leaveGame function (defined early so it's available) ---
    // This function will now be responsible for initial cleanup as well if the puzzle is already solved.
    function leaveGame() {
        console.log("Leaving rune sequence lock puzzle.");
        scene.player.isInteractActive = false;
        scene.player.isInteractOpen = false;
        scene.input.keyboard.enabled = true;

        // Use targetDiv directly since it's the main container passed in
        // Ensure it's hidden and its children are removed
        targetDiv.style.display = "none";
        targetDiv.innerHTML = ''; // Clear all children from targetDiv

        // Remove the dynamically added style tag if it was added
        if (style && style.parentNode) {
            style.remove();
        }
    }


    // --- Early Exit if Already Solved (check localStorage at the very beginning) ---
    // This block runs *before* creating any DOM elements for the puzzle itself.
    const isSolved = localStorage.getItem("runeSequenceLock");
    if (isSolved === "true") {
        console.log("Rune Sequence Lock already solved. Cleaning up and exiting.");
        // Crucially, reset interaction flags immediately
        scene.player.isInteractActive = false;
        scene.player.isInteractOpen = false;
        scene.input.keyboard.enabled = true; // Ensure keyboard is enabled

        // Call leaveGame immediately to clean up any residual elements
        // if this function was called in a context where targetDiv was previously active.
        leaveGame(); 

        return; // Exit the function immediately if solved
    }

    // If not solved, append the style and create DOM elements
    document.head.appendChild(style);

    // --- DOM Element Creation ---
    // Ensure the targetDiv has the ID 'puzzleDiv' or adjust the CSS selector accordingly
    targetDiv.id = "puzzleDiv"; // Assign the ID here for consistency with CSS
    targetDiv.style.display = 'flex'; // Ensure it's visible if it wasn't

    const h1 = document.createElement("h1");
    h1.textContent = gameTitle;
    targetDiv.appendChild(h1);

    const puzzleContainer = document.createElement("div");
    puzzleContainer.id = puzzleContainerId;
    targetDiv.appendChild(puzzleContainer);

    const runesDisplay = document.createElement("div");
    runesDisplay.id = "runes-display";
    puzzleContainer.appendChild(runesDisplay);

    for (let i = 0; i < numRunes; i++) {
        const runeButton = document.createElement("div");
        runeButton.classList.add("rune-button");
        runeButton.dataset.index = i;
        runeButton.textContent = runeSymbols[i % runeSymbols.length];
        runeButton.addEventListener("click", () => handleRuneClick(i));
        runesDisplay.appendChild(runeButton);
    }

    const messageDiv = document.createElement("div");
    messageDiv.id = "puzzle-message";
    targetDiv.appendChild(messageDiv);

    const resetButton = document.createElement("button");
    resetButton.id = "reset-button";
    resetButton.textContent = "Reset Lock";
    targetDiv.appendChild(resetButton);
    resetButton.addEventListener("click", resetPuzzle);

    const devSolveButton = document.createElement("button");
    devSolveButton.id = "dev-solve-button";
    devSolveButton.textContent = "Dev Solve";
    targetDiv.appendChild(devSolveButton);
    devSolveButton.addEventListener("click", solvePuzzle);

    // No need for DOMelements array anymore as leaveGame clears targetDiv.innerHTML
    // and explicitly removes the style.

    // --- Puzzle Logic Functions ---

    function handleRuneClick(clickedIndex) {
        if (puzzleSolved) return;

        const expectedRune = solutionSequence[playerAttempt.length];

        if (clickedIndex === expectedRune) {
            const runeButton = document.querySelector(
                `#${puzzleContainerId} .rune-button[data-index="${clickedIndex}"]`,
            );
            runeButton.classList.add("flash");

            playerAttempt.push(clickedIndex);

            messageDiv.textContent = "Correct rune set!";
            messageDiv.style.color = "#28a745";

            if (playerAttempt.length === solutionSequence.length) {
                // Puzzle Solved!
                messageDiv.textContent = "The Rune Lock opens!";
                messageDiv.style.color = "#ffd700";
                disableRunes();
                resetButton.disabled = false;
                devSolveButton.disabled = true;
                puzzleSolved = true;
                localStorage.setItem("runeSequenceLock", "true"); // *** Set localStorage IMMEDIATELY ***

                fragmentFind(scene, true); // Trigger fragment find animation
                scene.input.keyboard.enabled = true; // Re-enable keyboard input for the scene

                setTimeout(() => {
                    leaveGame(); // Call leaveGame after the delay
                }, 2000);
            }
        } else {
            // Incorrect click - Reset the player's attempt
            messageDiv.textContent = "Incorrect rune. Sequence reset.";
            messageDiv.style.color = "#dc3545";
            playerAttempt = [];
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
            }, 500);
        }
    }

    function resetPuzzle() {
        playerAttempt = []; // Reset player attempt here too
        puzzleSolved = false;
        messageDiv.textContent = "Enter the sequence...";
        messageDiv.style.color = "#ccc";
        resetButton.disabled = false;
        devSolveButton.disabled = false;

        Array.from(
            document.querySelectorAll(`#${puzzleContainerId} .rune-button`),
        ).forEach((rune) => {
            rune.classList.remove("flash");
        });
        enableRunes();
    }

    function enableRunes() {
        Array.from(
            document.querySelectorAll(`#${puzzleContainerId} .rune-button`),
        ).forEach((rune) => {
            rune.classList.remove("disabled");
            rune.style.pointerEvents = "auto";
        });
    }

    function disableRunes() {
        Array.from(
            document.querySelectorAll(`#${puzzleContainerId} .rune-button`),
        ).forEach((rune) => {
            rune.classList.add("disabled");
            rune.style.pointerEvents = "none";
        });
    }

    async function solvePuzzle() {
        if (puzzleSolved) return;

        messageDiv.textContent = "Solving the Rune Lock...";
        messageDiv.style.color = "#ffc107";
        disableRunes();
        resetButton.disabled = true;
        devSolveButton.disabled = true;

        for (let i = 0; i < solutionSequence.length; i++) {
            const runeIndex = solutionSequence[i];
            const runeButton = document.querySelector(
                `#${puzzleContainerId} .rune-button[data-index="${runeIndex}"]`,
            );

            runeButton.classList.add("flash");
            messageDiv.textContent = `Solving: Setting Rune ${i + 1}/${solutionSequence.length}`;

            await new Promise((resolve) => setTimeout(resolve, 300));
        }

        playerAttempt = [...solutionSequence];
        puzzleSolved = true;
        localStorage.setItem("runeSequenceLock", "true"); // *** Set localStorage IMMEDIATELY ***

        messageDiv.textContent = "Rune Lock Solved by Dev!";
        messageDiv.style.color = "#28a745";
        resetButton.disabled = false;
        devSolveButton.disabled = true;

        // Also call leaveGame after a delay for dev solve
        fragmentFind(scene, true); // Trigger fragment find animation
        scene.input.keyboard.enabled = true; // Re-enable keyboard input for the scene

        setTimeout(() => {
            leaveGame();
        }, 2000);
    }

    // Initial puzzle setup
    resetPuzzle();
}

export { runeSequenceLock };