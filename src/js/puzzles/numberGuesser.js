/**
 * @author Honglue Zheng
 * @note echoing chimes sequencer puzzle
 */

function numberGuesser(targetDiv, scene) {
    // Initiate variables
    const isSolved = localStorage.getItem("nbGuesser");
    const puzzleContainerId = 'number-guesser-container';
    const gameTitle = 'DEVINER LE CODE';

    const masterNumber = Math.floor(Math.random() * (50 - 1)) + 1;  // Min: 1, Max: 50
    let tries = 0;
    let maxTries = 5;

    // Create style element
    const style = document.createElement('style');
    style.setAttribute('data-puzzle-style', 'true'); 

    // Style the puzzle container and its contents
    style.textContent = `
        #puzzleDiv {
            background-color: #1a1a1a;
            padding: 50px;
            border-radius: 3px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 255, 255, 0.05) inset;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 550px;
            min-height: 300;
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
        #indicator {
            margin-top: 20px;
            font-size: 1.2em;
            color: #996300;
            font-weight: bold;
            min-height: 1.2em;
            line-height: 1.2em;
        }
        #input {
            margin-top: 20px;
            width: 100%;
            height: 50px;
            font-size: 1.2em;
            border: 1px solid rgb(255, 207, 50);
            border-radius: 5px;
            background-color: #4a4a4a;
            color: white;
            text-align: center;
        }
        #puzzle-message {
            margin-top: 15px;
            font-size: 1.2em;
            color: #28a745;
            font-weight: bold;
            min-height: 1.2em;
            line-height: 1.2em;
        }
        #confirm-button {
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
        #confirm-button {
            background-color: #007bff;
            border-color: #0056b3;
        }
        #confirm-button:hover,  {
            transform: translateY(-2px);
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
    `;

    // Generate HTML structure ---------------------------------------------------

    // Apply stylesheet to the document
    document.head.appendChild(style);

    // Title
    const h1 = document.createElement('h1');
    h1.textContent = gameTitle;
    targetDiv.appendChild(h1);

    // Indicator text
    const indicator = document.createElement('div');
    indicator.id = 'indicator';
    indicator.textContent = 'Entrez votre nombre.';
    targetDiv.appendChild(indicator);

    // Input field
    const input = document.createElement('input');
    input.id = 'input';
    input.type = 'number';
    input.min = 1;
    input.max = 50;
    targetDiv.appendChild(input);

    // Message / warning 
    const messageDiv = document.createElement('div');
    messageDiv.id = 'puzzle-message';
    messageDiv.textContent = "Le code s'agit d'un nombre entre 1 et 50.";
    targetDiv.appendChild(messageDiv);

    // Confirm button
    const confirmButton = document.createElement('button');
    confirmButton.id = 'confirm-button';
    confirmButton.textContent = 'Confirmer';
    targetDiv.appendChild(confirmButton);
    confirmButton.addEventListener('click', submitGuess); // Submit guess event listener

    // Dev solve button
    const devSolveButton = document.createElement('button');
    devSolveButton.id = 'dev-solve-button';
    devSolveButton.textContent = 'Dev';
    targetDiv.appendChild(devSolveButton);
    devSolveButton.addEventListener('click', solvePuzzle);  // Solve puzzle

    const DOMelements = [h1, indicator, input, messageDiv, devSolveButton, confirmButton];

    scene.input.keyboard.enabled = false; // Prevent player from moving during puzzle

    // If puzzle has been solved, make player leave the puzzle
    if (isSolved == "true") {
        messageDiv.textContent = 'Le coffre s\'est déjà ouvert!';
        disableButton(confirmButton);
        setTimeout(() => {
            leaveGame();
            return;
        }, 3000);
    }

    // Function to leave the puzzle
    function leaveGame() {
        scene.player.isQuestActive = false;
        scene.input.keyboard.enabled = true;
        // Destroy all items
        document.getElementById('puzzleDiv').style.display = 'none';
        DOMelements.forEach(element => {
            element.remove();
        });
    }

    // Dev solver
    function solvePuzzle() {
        input.value = masterNumber;
        submitGuess();
        setTimeout(() => {
            leaveGame();
        }, 1000);
    }

    function submitGuess() {
        // Get guess
        const guess = parseInt(input.value);
        
        // Player guesses a number out of range
        if (guess < 1 || guess > 50) {
            messageDiv.style.color = `#dc3545`; // red
            messageDiv.textContent = 'Le code doit être compris entre 1 et 50.';
            input.value = '';
            tries++;
            return;
        }
        // Player guesses the correct number 
        if (guess == masterNumber) {
            messageDiv.textContent = 'Bravo! Vous avez trouvé le code!';
            messageDiv.style.color = `#28a745`; // green
            disableButton(confirmButton);
            // Player fixed puzzle
            setTimeout(() => {
                localStorage.setItem("nbGuesser", "true");
                leaveGame();
            }, 2000);
            return;
        // Number is too big
        } else if (guess > masterNumber) {
            messageDiv.textContent = 'Le code est plus petit.';
            messageDiv.style.color = `#dc3545`; // red
            input.value = '';
        // Number is too small
        } else {
            messageDiv.textContent = 'Le code est plus grand.';
            messageDiv.style.color = `#dc3545`; // red
            input.value = '';
        }

        // Increment tries
        tries++;

        // Player has reached the maximum number of tries, leave puzzle
        if (tries >= maxTries) {
            messageDiv.textContent = 'Vous avez atteint le nombre maximum de tentatives.';
            messageDiv.style.color = `#dc3545`; // red
            disableButton(confirmButton);
            setTimeout(() => {
                leaveGame();
            }, 2000);
            return;
        }
    }

    // Function to disable the submit hbutton
    function disableButton(button) {
        button.style.disabled = true;
        button.style.pointerEvents = 'none';
        button.style.backgroundColor = '#6a6a6a';
    }
};

export { numberGuesser }; 