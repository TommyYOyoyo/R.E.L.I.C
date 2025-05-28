import { fragmentFind } from "../player.js";

function sudoku(targetDiv, scene) {
  console.log("This puzzle runs!");

  const puzzleContainerId = "tapestry-puzzle-container";
  const gameTitle = "COMPLÉTEZ LA MOSAÏQUE";
  const boardSize = 4;

  const patterns = ["ᚠ", "ᚢ", "ᚦ", "ᚨ"];

  let patternGrid = [];
  let solutionGrid = [];
  let initialClues = [];

  // Create style element (needed even for cleanup if puzzle was previously loaded)
  const style = document.createElement("style");
  style.setAttribute("data-puzzle-style", "true");

  const cellSize = 80;
  const cellGap = 5;

  // Calculate the internal grid's dimensions (only considering cells and gaps)
  // This will be the exact size of the background image for the grid
  const gridContentWidth = boardSize * cellSize + (boardSize - 1) * cellGap;
  const gridContentHeight = boardSize * cellSize + (boardSize - 1) * cellGap;

  const puzzlePadding = 25; // #puzzleDiv's padding (used for the overall puzzle window)

  // Calculate the total size of #puzzleDiv including its padding, and the grid within
  const totalPuzzleWidth = gridContentWidth + (puzzlePadding * 2);

  // Approximate total height for #puzzleDiv including all elements and their margins/paddings
  const appMinHeight = `calc(
      ${puzzlePadding}px + /* Top padding of #puzzleDiv */
      20px + /* h1 margin-bottom */
      ${gridContentHeight}px + /* Actual grid height (cells + gaps) */
      20px + /* margin-bottom of grid container */
      15px + /* margin-top of messageDiv */
      1.2em + /* min-height/line-height of messageDiv */
      20px + /* margin-top of reset-button */
      60px + /* approximate height of button */
      ${puzzlePadding}px /* Bottom padding of #puzzleDiv */
  )`;

  const appMinWidth = `${totalPuzzleWidth}px`; // Minimal width for #puzzleDiv to contain grid and its own padding

  style.textContent = `
      #puzzleDiv {
          background-color: #1a1a1a;
          padding: ${puzzlePadding}px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 255, 255, 0.05) inset;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center; /* Centers items horizontally */
          justify-content: center; /* Centers items vertically (if space allows) */
          min-width: ${appMinWidth};
          min-height: ${appMinHeight};
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
      #reset-button:hover {
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
          width: ${gridContentWidth}px; /* Explicitly set to content width */
          height: ${gridContentHeight}px; /* Explicitly set to content height */
          background-color: #2a2a2a; /* Fallback background color */
          /* Assuming your image path is correct, add it here */
          /* EXAMPLE: background-image: url('../path/to/your/grid_background.png'); */
          /* EXAMPLE: background-size: cover; */ /* Or 'contain' or specific dimensions */
          /* EXAMPLE: background-position: center; */
          /* EXAMPLE: background-repeat: no-repeat; */
          border-radius: 8px;
          margin-bottom: 20px;
          /* If you had a border or padding here before, ensure it's removed or accounted for */
          /* e.g., border: none; padding: 0; */
      }
      .tapestry-cell {
          width: ${cellSize}px;
          height: ${cellSize}px;
          background-color: #3d3d3d;
          border: 1px solid #555; /* Keep cell borders for visual separation */
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

  // --- leaveGame function (defined early so it's available for early exit) ---
  function leaveGame() {
    console.log("Leaving sudoku puzzle.");
    scene.player.isInteractActive = false;
    scene.player.isInteractOpen = false;
    scene.input.keyboard.enabled = true;

    targetDiv.style.display = "none";
    targetDiv.innerHTML = ""; // Clear all children from targetDiv

    if (style && style.parentNode) {
      style.remove();
    }
  }

  // --- Early Exit if Already Solved (check localStorage at the very beginning) ---
  const isSolved = localStorage.getItem("sudoku");
  if (isSolved === "true") {
    console.log("Sudoku already solved. Cleaning up and exiting.");
    scene.player.isInteractActive = false;
    scene.player.isInteractOpen = false;
    scene.input.keyboard.enabled = true;

    leaveGame();

    return; // Exit the function immediately if solved
  }

  // If not solved, append the style and create DOM elements
  document.head.appendChild(style);

  targetDiv.id = "puzzleDiv";
  targetDiv.style.display = 'flex'; // Ensure it's visible if it wasn't

  const h1 = document.createElement("h1");
  h1.textContent = gameTitle;
  targetDiv.appendChild(h1);

  const puzzleContainer = document.createElement("div");
  puzzleContainer.id = puzzleContainerId;
  targetDiv.appendChild(puzzleContainer);

  const messageDiv = document.createElement("div");
  messageDiv.id = "puzzle-message";
  targetDiv.appendChild(messageDiv);

  const resetButton = document.createElement("button");
  resetButton.id = "reset-button";
  resetButton.textContent = "New Tapestry";
  targetDiv.appendChild(resetButton);
  resetButton.addEventListener("click", initializePuzzleLogic);

  const devSolveButton = document.createElement("button");
  devSolveButton.id = "dev-solve-button";
  devSolveButton.textContent = "Dev Solve";
  targetDiv.appendChild(devSolveButton);
  devSolveButton.addEventListener("click", solvePuzzle);


  function initializePuzzleLogic() {
    puzzleContainer.innerHTML = "";
    messageDiv.textContent = "";
    patternGrid = Array(boardSize * boardSize).fill(-1);
    solutionGrid = [];
    initialClues = [];

    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const patternIndex = (r + c) % patterns.length;
        solutionGrid.push(patternIndex);
      }
    }

    const numClues = Math.floor(
      boardSize * boardSize * (0.25 + Math.random() * 0.1),
    );
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
    currentPuzzleContainer.innerHTML = "";

    patternGrid.forEach((patternIndex, index) => {
      const cell = document.createElement("div");
      cell.classList.add("tapestry-cell");
      cell.dataset.index = index;

      if (initialClues.includes(index)) {
        cell.classList.add("clue");
        cell.textContent = patterns[patternIndex];
        cell.style.pointerEvents = "none";
        cell.style.cursor = "default";
      } else {
        cell.classList.add("blank");
        if (patternIndex !== -1) {
          cell.textContent = patterns[patternIndex];
          cell.classList.add("player-activated");
        } else {
          cell.textContent = "";
          cell.classList.remove("player-activated");
        }
        cell.addEventListener("click", () => cyclePattern(index));
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
    const nextPatternIndex =
      currentPatternIndex === -1
        ? 0
        : (currentPatternIndex + 1) % patterns.length;

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
      messageDiv.textContent =
        "The tapestry is complete! A hidden passage appears!";
      messageDiv.style.color = "#28a745";
      disableInteraction();

      const wasAlreadySolved = localStorage.getItem("sudoku") === "true";
      if (!wasAlreadySolved) {
        localStorage.setItem("sudoku", "true");
        fragmentFind(scene, true);
        console.log("Sudoku puzzle solved! Fragment awarded.");
      } else {
        console.log("Sudoku puzzle already solved. No new fragment awarded.");
        messageDiv.textContent = "The tapestry is already complete!";
      }

      scene.input.keyboard.enabled = true;

      setTimeout(() => {
        leaveGame();
      }, 2000);
    } else {
      messageDiv.textContent = "Weave the pattern correctly...";
      messageDiv.style.color = "#ccc";
      enableInteraction();
    }
  }

  function disableInteraction() {
    document
      .querySelectorAll(`#${puzzleContainerId} .tapestry-cell.blank`)
      .forEach((cell) => {
        cell.style.pointerEvents = "none";
        cell.style.opacity = "0.8";
      });
  }

  function enableInteraction() {
    if (localStorage.getItem("sudoku") !== "true") {
      document
        .querySelectorAll(`#${puzzleContainerId} .tapestry-cell.blank`)
        .forEach((cell) => {
          cell.style.pointerEvents = "auto";
          cell.style.opacity = "1";
        });
    }
  }

  function solvePuzzle() {
    patternGrid = [...solutionGrid];
    renderPuzzle();
  }

  initializePuzzleLogic();
}

export { sudoku };