/**
 * @author Ray Lam
 * @note cool diary  
 */

function diary(targetDiv, scene) {
    //pages
    let currentPage = 0;
    const totalPages = 15;
    
    //texts
    const defaultEntries = [
        "Journal d'aventure: Avant ma mort, je laisse quelque chose à vous", 
        "Combat: Utilisez les touches directionnelles pour vous déplacer et l'espace pour attaquer.",
        "Quand coincer: Tuer tous les ennemies dans la zone",	
        "Collecter: Collecter les fragments pour forger les trois pierres OU trouver des pierres directement(en haut du barre de vie)",
        "Dans le prochain niveau: le Sentinel après utiliser son reflexion, est vulnerable pendant deux secondes.",
    ];
    
    const diaryEntries = [...defaultEntries]; //copy default entries

    //create style element
    const style = document.createElement('style');
    style.setAttribute('data-diary-style', 'true'); 
    //css
      style.textContent = `
        #diaryDiv {
            background-color: #f5e7c8;
            padding: 40px;
            border-radius: 2px;
            border: 12px solid #8B4513;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            text-align: left;
            display: flex;
            flex-direction: column;
            min-width: 500px;
            min-height: 400px;
            position: relative;
            font-family: 'Courier New', monospace;
            color: #3a3a3a;
            background-image: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, transparent 100%);
        }
        #diaryDiv * {
            font-family: 'Courier New', monospace;
        }
        #day {
            color: #5c3317;
            margin-bottom: 20px;
            font-size: 1.8em;
            font-weight: bold;
            border-bottom: 1px solid #8B4513;
            padding-bottom: 5px;
        }
        #diaryText {
            margin-top: 15px;
            font-size: 1.1em;
            min-height: 300px;
            line-height: 1.5;
            white-space: pre-wrap;
            background-color: rgba(255,255,255,0.3);
            padding: 15px;
            border-radius: 3px;
        }
        #diaryControls {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
        .diaryButton {
            background-color: #8B4513;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 3px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            transition: all 0.2s;
        }
        .diaryButton:hover {
            background-color: #A0522D;
            transform: translateY(-1px);
        }
        .diaryButton:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        #pageIndicator {
            align-self: center;
            color: #5c3317;
        }
    `;

    document.head.appendChild(style);

    //create diary container
    const diaryDiv = document.createElement('div');
    diaryDiv.id = 'diaryDiv';
    targetDiv.appendChild(diaryDiv);

    //day indicator
    const dayElement = document.createElement('div');
    dayElement.id = 'day';
    diaryDiv.appendChild(dayElement);

    //diary text
    const diaryText = document.createElement('div');
    diaryText.id = 'diaryText';
    diaryText.contentEditable = true;
    diaryText.spellcheck = false;
    diaryDiv.appendChild(diaryText);

    //create controls container
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'diaryControls';
    diaryDiv.appendChild(controlsDiv);

    //create previous page button
    const prevButton = document.createElement('button');
    prevButton.className = 'diaryButton';
    prevButton.id = 'prevPage-button';
    prevButton.textContent = 'Dernière page';	
    controlsDiv.appendChild(prevButton);

    //create page indicator
    const pageIndicator = document.createElement('span');
    pageIndicator.id = 'pageIndicator';
    controlsDiv.appendChild(pageIndicator);

    //create next page button
    const nextButton = document.createElement('button');
    nextButton.className = 'diaryButton';
    nextButton.id = 'nextPage-button';
    nextButton.textContent = 'Page suivante';
    controlsDiv.appendChild(nextButton);

    //create close diary button
    const closeButton = document.createElement('button');
    closeButton.className = 'diaryButton';
    closeButton.id = 'close-button';
    closeButton.textContent = 'Fermer le journal';
    closeButton.style.marginTop = '10px';
    closeButton.style.width = '100%';
    diaryDiv.appendChild(closeButton);


        const DOMelements = [
        style, 
        diaryDiv,
        dayElement,
        diaryText,
        controlsDiv,
        prevButton,
        pageIndicator,
        nextButton,
        closeButton
    ];

    //update diary 
    function updateDiary() {
        dayElement.textContent = `Jour ${currentPage + 1}`;
        diaryText.textContent = diaryEntries[currentPage];
        pageIndicator.textContent = `Page ${currentPage + 1}/${totalPages}`;
        
        prevButton.disabled = currentPage === 0;
        nextButton.disabled = currentPage === totalPages - 1;
    }

    //save text before changing pages
    function saveCurrentEntry() {
        diaryEntries[currentPage] = diaryText.textContent;
    }

    //function to leave the puzzle 
    function leaveGame() {
        scene.player.isQuestActive = false;
        scene.player.isQuestOpen = false;
        scene.input.keyboard.enabled = true;
        //destroy all items
        document.getElementById('puzzleDiv').style.display = 'none';
        DOMelements.forEach(element => {
            if (element && element.parentNode) {
                element.remove();
            }
        });
    }

    //close diary 
    function closeDiary() {
        saveCurrentEntry();
        scene.input.keyboard.enabled = true;
        //unglitches
        setTimeout(() => {
                leaveGame();
            }, 1000);
    }
    //change pages
    prevButton.addEventListener('click', () => {
        saveCurrentEntry();
        currentPage = Math.max(0, currentPage - 1);
        updateDiary();
    });

    nextButton.addEventListener('click', () => {
        saveCurrentEntry();
        currentPage = Math.min(totalPages - 1, currentPage + 1);
        updateDiary();
    });

    closeButton.addEventListener('click', closeDiary);

    //initialize diary  
    updateDiary();

    return {
        getEntries: () => diaryEntries,
        saveEntries: saveCurrentEntry,
        close: closeDiary
    };
}

export { diary };