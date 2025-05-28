import { fragmentFind } from "../player.js";

function slidingTiles(targetDiv, scene) {
  console.log("This puzzle runs!");

  // Initiate variables
  const puzzleContainerId = "puzzle-container"; // Consistent ID for the grid container
  const gameTitle = "RÉARRANGEZ LES LIVRES";

  let playerAttempt = [];
  let puzzleSolved = false; // Internal flag for the current puzzle session

  const boardSize = 3; // Defines the N x N grid size (e.g., 3 for a 3x3 grid)
  let tiles = [];
  let emptyTileIndex;

  /**
   * Converts a given number to its Roman numeral representation.
   * Special handling for 0 to return an empty string for the empty tile.
   * @param {number} num - The number to convert (1-9 for this puzzle).
   * @returns {string} The Roman numeral string, or an empty string if num is 0.
   */
  function convertToRoman(num) {
    if (num === 0) return "";
    const romanNumerals = {
      IX: 9,
      V: 5,
      IV: 4,
      I: 1,
    };
    let roman = "";
    for (let key in romanNumerals) {
      while (num >= romanNumerals[key]) {
        roman += key;
        num -= romanNumerals[key];
      }
    }
    return roman;
  }

  // Create a style element to dynamically inject CSS into the document head
  const style = document.createElement("style");
  style.setAttribute("data-puzzle-style", "true");

  // Define the padding value for the puzzle container
  const puzzleGridPadding = 5; // This is the padding inside the grid container

  // Define the border width for the puzzle container
  const puzzleGridBorderWidth = 2;

  // Calculate precise grid dimensions for the `width` and `height` properties
  // This value should represent the total external size of the puzzle container
  // including the tiles, gaps, its own padding, and its own border.
  // Example for 3x3: (3 * 100px_tile) + (2 * 5px_gap) + (2 * 5px_padding) + (2 * 2px_border)
  // = 300 + 10 + 10 + 4 = 324px
  const puzzleGridCalculatedDimension =
    boardSize * 100 +
    (boardSize - 1) * 5 +
    puzzleGridPadding * 2 +
    puzzleGridBorderWidth * 2;

  const puzzleGridWidth = `${puzzleGridCalculatedDimension}px`;
  const puzzleGridHeight = `${puzzleGridCalculatedDimension}px`;


  // Calculate the minimum height for the overall puzzle wrapper (`#puzzleDiv`)
  const appMinHeight = `calc(
      25px + /* padding-top of puzzleDiv */
      50px + /* h1 approx height */
      ${puzzleGridHeight} + /* puzzle grid height */
      40px + /* margin-bottom for grid */
      60px + /* reset button height approx */
      60px + /* dev solve button height approx */
      25px /* padding-bottom of puzzleDiv */
  )`;

  // CSS rules defined as a template literal string
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
    min-width: 350px;
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
    grid-template-columns: repeat(${boardSize}, 100px);
    grid-template-rows: repeat(${boardSize}, 100px);
    gap: 5px;
    padding: 5px;
    width: ${puzzleGridWidth};
    height: ${puzzleGridHeight};
    border: ${puzzleGridBorderWidth}px solid #444;
    border-radius: 8px;
    margin-bottom: 20px;
    box-sizing: border-box;
    justify-content: center; /* ADDED: Centers items horizontally within the grid */
    align-items: center; /* ADDED: Centers items vertically within the grid */
  }
  .puzzle-tile {
    width: 100px;
    height: 100px;
    background-color: #3d3d3d;
    color: #e0b040;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2.5em;
    font-weight: bold;
    cursor: pointer;
    border-radius: 5px;
    transition: transform 0.1s ease-in-out, background-color 0.1s ease-in-out;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
    border: 1px solid #555;
    font-family: 'Times New Roman', serif;
  }
  .puzzle-tile:hover {
    background-color: #4a4a4a;
    transform: scale(1.02);
  }
  .puzzle-tile.empty {
    background-color: #1a1a1a;
    cursor: default;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
    border: none;
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

  /**
   * Performs cleanup when the puzzle is exited or solved.
   * Hides the puzzle UI, clears its content, and restores player controls.
   */
  function leaveGame() {
    console.log("Leaving sliding tiles puzzle.");
    scene.player.isInteractActive = false;
    scene.player.isInteractOpen = false;
    scene.input.keyboard.enabled = true;

    targetDiv.style.display = "none"; // Hide the main puzzle container
    targetDiv.innerHTML = ""; // Clear its HTML content

    // Remove the dynamically added style tag from the document head to clean up
    if (style && style.parentNode) {
      style.remove();
    }
  }

  // --- FRAGMENT FARMING PREVENTION LOGIC ---
  // Check localStorage at the very beginning to see if the puzzle has been solved before.
  const initialIsSolvedCheck = localStorage.getItem("slidingTiles");
  if (initialIsSolvedCheck === "true") {
    console.log(
      "Sliding tiles puzzle already solved. Cleaning up and exiting.",
    );
    // If already solved, immediately perform cleanup and exit the function.
    // This prevents the puzzle UI from even being rendered or becoming interactive again.
    scene.player.isInteractActive = false;
    scene.player.isInteractOpen = false;
    scene.input.keyboard.enabled = true;
    targetDiv.style.display = "none";
    targetDiv.innerHTML = "";
    if (style && style.parentNode) {
      style.remove();
    }
    return; // Crucial: Halts execution of the rest of the function.
  }
  // --- END FRAGMENT FARMING PREVENTION LOGIC ---

  // Append the dynamically created style element to the document's <head>
  document.head.appendChild(style);

  // Set the ID for the main puzzle wrapper (targetDiv) and make it visible
  targetDiv.id = "puzzleDiv";
  targetDiv.style.display = "flex"; // Use flex to center its direct children (title, grid, buttons)

  // Create and append the game title element
  const h1 = document.createElement("h1");
  h1.textContent = gameTitle;
  targetDiv.appendChild(h1);

  // Create and append the div that will serve as the grid container for the tiles
  const puzzleContainer = document.createElement("div");
  puzzleContainer.id = puzzleContainerId; // Assign the consistent ID: "puzzle-container"
  targetDiv.appendChild(puzzleContainer);

  // Create and append the message display area
  const messageDiv = document.createElement("div");
  messageDiv.id = "puzzle-message";
  targetDiv.appendChild(messageDiv);

  // Create and append the "Reset Tablet" button
  const resetButton = document.createElement("button");
  resetButton.id = "reset-button";
  resetButton.textContent = "Reset Tablet";
  targetDiv.appendChild(resetButton);
  resetButton.addEventListener("click", initializePuzzleLogic); // Re-initialize on click

  // Create and append the "Dev Solve" button (for development/testing)
  const devSolveButton = document.createElement("button");
  devSolveButton.id = "dev-solve-button";
  devSolveButton.textContent = "Dev Solve";
  targetDiv.appendChild(devSolveButton);
  devSolveButton.addEventListener("click", solvePuzzle); // Instantly solve on click

  /**
   * Initializes or resets the puzzle to a new, solvable shuffled state.
   * Clears the board, shuffles tiles, and renders them.
   */
  function initializePuzzleLogic() {
    puzzleContainer.innerHTML = ""; // Clear existing tile elements from the DOM
    messageDiv.textContent = ""; // Clear any previous messages
    // Create an initial array of tiles: 1 to (boardSize*boardSize)-1, then 0 for the empty tile
    tiles = Array.from({ length: boardSize * boardSize }, (_, i) => i + 1);
    emptyTileIndex = tiles.length - 1; // Initially, the last tile is the empty one
    tiles[emptyTileIndex] = 0; // Set the value of the last tile to 0
    shuffleTiles(); // Randomize the tiles until a solvable configuration is found
    renderPuzzle(); // Draw the tiles on the screen in their new positions
  }

  /**
   * Shuffles the tiles array using the Fisher-Yates algorithm,
   * ensuring the resulting puzzle configuration is always solvable.
   */
  function shuffleTiles() {
    do {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; // Swap tiles
      }
      emptyTileIndex = tiles.indexOf(0); // Update the index of the empty tile after shuffling
    } while (!isSolvable(tiles.filter((t) => t !== 0))); // Re-shuffle if not solvable
  }

  /**
   * Checks if the current permutation of tiles (excluding the empty tile) is solvable.
   * For an N-puzzle, solvability depends on the number of inversions and the grid size.
   * For a 3x3 (N=3) grid, it's solvable if the number of inversions is even.
   * @param {number[]} arr - The array of tile values, excluding the empty (0) tile.
   * @returns {boolean} True if the puzzle is solvable, false otherwise.
   */
  function isSolvable(arr) {
    let inversions = 0;
    // An inversion is a pair of tiles (A, B) where A appears before B but A > B
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) {
          inversions++;
        }
      }
    }
    return inversions % 2 === 0; // The puzzle is solvable if the total number of inversions is even
  }

  /**
   * Renders (or re-renders) the current state of the tiles onto the puzzle board.
   * This function creates or updates the DOM elements for each tile.
   */
  function renderPuzzle() {
    const currentPuzzleContainer = document.getElementById(puzzleContainerId);
    currentPuzzleContainer.innerHTML = ""; // Clear all existing tile elements before re-rendering

    tiles.forEach((tileValue, index) => {
      const tile = document.createElement("div");
      tile.classList.add("puzzle-tile"); // Apply base styling

      if (tileValue === 0) {
        tile.classList.add("empty"); // Apply specific styling for the empty tile
        tile.dataset.value = 0; // Store data attribute for value
      } else {
        tile.textContent = convertToRoman(tileValue); // Set Roman numeral text for non-empty tiles
        tile.dataset.value = tileValue; // Store numerical value
        tile.addEventListener("click", () => moveTile(index)); // Add click handler for movable tiles
      }
      currentPuzzleContainer.appendChild(tile); // Add the tile to the grid container
    });
  }

  /**
   * Handles the logic for moving a clicked tile.
   * A tile can only move if it's directly adjacent (horizontal or vertical) to the empty space.
   * @param {number} clickedIndex - The array index of the tile that was clicked.
   */
  function moveTile(clickedIndex) {
    // Calculate row and column coordinates for the clicked tile
    const clickedRow = Math.floor(clickedIndex / boardSize);
    const clickedCol = clickedIndex % boardSize;
    // Calculate row and column coordinates for the empty tile
    const emptyRow = Math.floor(emptyTileIndex / boardSize);
    const emptyCol = emptyTileIndex % boardSize;

    // Determine if the clicked tile is adjacent to the empty tile
    // It's adjacent if it's one step up/down (same column, row difference of 1)
    // OR one step left/right (same row, column difference of 1)
    const isAdjacent =
      (Math.abs(clickedRow - emptyRow) === 1 && clickedCol === emptyCol) || // Vertical move
      (Math.abs(clickedCol - emptyCol) === 1 && clickedRow === emptyRow); // Horizontal move

    if (isAdjacent) {
      // Perform the swap in the internal 'tiles' array
      [tiles[clickedIndex], tiles[emptyTileIndex]] = [
        tiles[emptyTileIndex],
        tiles[clickedIndex],
      ];
      emptyTileIndex = clickedIndex; // Update the record of the empty tile's new position
      renderPuzzle(); // Re-render the puzzle to reflect the tile swap
      checkWin(); // After each move, check if the puzzle has been solved
    }
  }

  /**
   * Checks if the current arrangement of tiles matches the solved state.
   * If solved, it triggers win-related actions, including granting a fragment.
   */
  function checkWin() {
    // Define the target solved state: tiles ordered 1 through (N*N)-1, followed by 0 (empty)
    const solvedTiles = Array.from(
      { length: boardSize * boardSize - 1 },
      (_, i) => i + 1,
    );
    solvedTiles.push(0); // Append the empty tile at the end of the solved sequence

    // Compare the current 'tiles' array with the 'solvedTiles' array
    const isSolvedNow = tiles.every(
      (tile, index) => tile === solvedTiles[index],
    );

    if (isSolvedNow) {
      messageDiv.textContent =
        "Congratulations! The ancient tablet is restored!";

      // --- FRAGMENT FARMING PREVENTION (inside checkWin) ---
      // Only grant the fragment and update localStorage if the puzzle hasn't been marked as solved
      // in this session (`puzzleSolved` flag) AND globally (`localStorage`).
      // The initial check at the top handles subsequent openings. This prevents multiple awards in one session.
      if (!puzzleSolved) {
        puzzleSolved = true; // Mark as solved for the current puzzle session
        localStorage.setItem("slidingTiles", "true"); // Persist the solved state in the browser's local storage
        fragmentFind(scene, true); // Call the game's function to give the player a fragment
        console.log("Fragment awarded!");
      } else {
        console.log(
          "Puzzle solved again, but fragment already awarded in this session.",
        );
      }
      // --- END FRAGMENT FARMING PREVENTION ---

      scene.input.keyboard.enabled = true; // Re-enable player keyboard input (e.g., for movement)

      // Automatically exit the puzzle UI after a brief delay to allow the player to see the "solved" message
      setTimeout(() => {
        leaveGame();
      }, 2000); // 2 seconds
    } else {
      messageDiv.textContent = ""; // Clear the message if the puzzle is not yet solved
    }
  }

  /**
   * A debugging/development function to instantly set the puzzle to its solved state.
   * Useful for quickly testing win conditions or bypassing the puzzle.
   */
  function solvePuzzle() {
    // Set the tiles array directly to the solved order
    tiles = Array.from({ length: boardSize * boardSize - 1 }, (_, i) => i + 1);
    tiles.push(0); // Place the empty tile at the very end
    emptyTileIndex = tiles.length - 1; // Update the empty tile's index to the last position
    renderPuzzle(); // Re-render the puzzle with the solved state
    checkWin(); // Immediately check for win conditions (which will now be met)
  }

  // Initial call to set up the puzzle UI and logic when the slidingTiles function is first invoked
  initializePuzzleLogic();
}

// Export the slidingTiles function so it can be imported and used by other modules in your game
export { slidingTiles };
