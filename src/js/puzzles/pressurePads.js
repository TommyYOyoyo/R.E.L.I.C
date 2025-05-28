import { fragmentFind } from "../player.js";

function pressurePads(targetDiv, scene) {
    console.log("This puzzle runs!");

    const puzzleContainerId = "pressure-pads-container";
    const gameTitle = "ACTIVEZ LES BOUTONS";

    let puzzleSolved = false;
    const boardSize = 4;
    let plates = [];

    const style = document.createElement("style");
    style.setAttribute("data-puzzle-style", "true");
    const plateSize = 80;
    const plateGap = 10;
    const puzzleGridTotalSize = `${boardSize * plateSize + (boardSize - 1) * plateGap}px`;
    const appMinHeight = `calc(
      25px +
      50px +
      ${puzzleGridTotalSize} +
      40px +
      60px +
      60px +
      25px
  )`;

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
          min-width: ${puzzleGridTotalSize};
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
          grid-template-columns: repeat(${boardSize}, ${plateSize}px);
          grid-template-rows: repeat(${boardSize}, ${plateSize}px);
          gap: 5px;
          padding: 5px;
          width: ${puzzleGridTotalSize};
          height: ${puzzleGridTotalSize};
          border: 2px solid #444;
          background-color: #2a2a2a;
          border-radius: 8px;
          margin-bottom: 20px;
      }
      .pressure-plate {
          width: ${plateSize}px;
          height: ${plateSize}px;
          background-color: #3d3d3d;
          border: 1px solid #555;
          border-radius: 5px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 3em;
          color: #888;
          cursor: pointer;
          transition: background-color 0.2s, box-shadow 0.2s, color 0.2s;
          box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
      }
      .pressure-plate.active {
          background-color: #ffd700;
          color: #1a1a1a;
          box-shadow: 0 0 15px #ffd700, 0 0 8px #ffd700 inset;
      }
      .pressure-plate:hover {
          transform: scale(1.02);
      }
      .pressure-plate:hover.active {
          box-shadow: 0 0 20px #ffd700, 0 0 10px #ffd700 inset;
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

    function leaveGame() {
        console.log("Leaving pressure pads puzzle.");
        scene.player.isInteractActive = false;
        scene.player.isInteractOpen = false;
        scene.input.keyboard.enabled = true;

        targetDiv.style.display = "none";
        targetDiv.innerHTML = "";

        if (style && style.parentNode) {
            style.remove();
        }
    }

    const isSolved = localStorage.getItem("pressurePads");
    if (isSolved === "true") {
        console.log(
            "Pressure pads puzzle already solved. Cleaning up and exiting.",
        );
        scene.player.isInteractActive = false;
        scene.player.isInteractOpen = false;
        scene.input.keyboard.enabled = true;

        leaveGame();

        return;
    }

    document.head.appendChild(style);

    targetDiv.id = "puzzleDiv";
    targetDiv.style.display = "flex";

    const h1 = document.createElement("h1");
    h1.textContent = gameTitle;
    targetDiv.appendChild(h1);

    const puzzleContainer = document.createElement("div");
    puzzleContainer.id = puzzleContainerId;
    targetDiv.appendChild(puzzleContainer);

    for (let i = 0; i < boardSize * boardSize; i++) {
        const plate = document.createElement("div");
        plate.classList.add("pressure-plate");
        plate.dataset.index = i;
        plate.addEventListener("click", () => togglePlate(i));
        puzzleContainer.appendChild(plate);
    }

    const messageDiv = document.createElement("div");
    messageDiv.id = "puzzle-message";
    targetDiv.appendChild(messageDiv);

    const resetButton = document.createElement("button");
    resetButton.id = "reset-button";
    resetButton.textContent = "Reset Runes";
    targetDiv.appendChild(resetButton);
    resetButton.addEventListener("click", initializePuzzleLogic);

    const devSolveButton = document.createElement("button");
    devSolveButton.id = "dev-solve-button";
    devSolveButton.textContent = "Dev Solve";
    targetDiv.appendChild(devSolveButton);
    devSolveButton.addEventListener("click", solvePuzzle);

    function initializePuzzleLogic() {
        messageDiv.textContent = "";
        plates = Array(boardSize * boardSize).fill(false);

        for (let i = 0; i < Math.floor(Math.random() * 8) + 5; i++) {
            const randomPlateIndex = Math.floor(Math.random() * plates.length);
            applyToggleEffect(randomPlateIndex, true);
        }
        renderPuzzle();
    }

    function renderPuzzle() {
        const plateElements = document.querySelectorAll(
            `#${puzzleContainerId} .pressure-plate`,
        );
        plates.forEach((isActive, index) => {
            if (isActive) {
                plateElements[index].classList.add("active");
            } else {
                plateElements[index].classList.remove("active");
            }
        });
        checkWin();
    }

    function togglePlate(index) {
        applyToggleEffect(index);
        renderPuzzle();
    }

    function applyToggleEffect(index) {
        plates[index] = !plates[index];

        const row = Math.floor(index / boardSize);
        const col = index % boardSize;

        if (row > 0) plates[index - boardSize] = !plates[index - boardSize];
        if (row < boardSize - 1)
            plates[index + boardSize] = !plates[index + boardSize];
        if (col > 0) plates[index - 1] = !plates[index - 1];
        if (col < boardSize - 1) plates[index + 1] = !plates[index + 1];
    }

    function checkWin() {
        const allActive = plates.every((plate) => plate === true);

        if (allActive) {
            messageDiv.textContent =
                "The runes are fully activated! The ancient magic unleashes!";
            messageDiv.style.color = "#28a745";
            document
                .querySelectorAll(`#${puzzleContainerId} .pressure-plate`)
                .forEach((p) => (p.style.pointerEvents = "none"));

            puzzleSolved = true;
            localStorage.setItem("pressurePads", "true");

            fragmentFind(scene, true);

            scene.input.keyboard.enabled = true;

            setTimeout(() => {
                leaveGame();
            }, 2000);
        } else {
            messageDiv.textContent = "The runes await their full power...";
            messageDiv.style.color = "#ccc";
            document
                .querySelectorAll(`#${puzzleContainerId} .pressure-plate`)
                .forEach((p) => (p.style.pointerEvents = "auto"));
        }
    }

    function solvePuzzle() {
        plates = Array(boardSize * boardSize).fill(true);
        renderPuzzle();
    }

    initializePuzzleLogic();
}

export { pressurePads };
