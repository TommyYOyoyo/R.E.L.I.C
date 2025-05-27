/**
 * @author Ray Lam
 * @note Interactive Diary with Pre-written Entries
 */

function diary(targetDiv, scene) {
    // Current page (0-14 for 15 pages)
    let currentPage = 0;
    const totalPages = 15;
    
    // Add your custom pre-written entries here
    const defaultEntries = [
        "Jour 1: Une météorite brisa la nuit...", 
        "Jour 2: Une étrange barrière est en train de former autour. Le peuple pense que c'est une miracle venu des cieux pour nous protéger.",	
        "Jour 3: Mes cheveux commencent à devenir blanchatre, mais la progression de ma recherche est bien plus importante que mon apparence.",
        "Jour 4: Mes cheveux commencent à tomber. Je ne me sens pas très bien.",
        "Jour 5: Mes muscles deviennent de plus en plus faibles.",
        "Jour 6: Je sors pour voir ma nièce, son bébé de 5 mois était devenu un enfant de 5 ans. Je ne sais pas quoi penser.", 
        "Jour 7: La barrière est en train de nous tuer",
        "Jour 8: Mon groupe de scientifiques commence a faire une recherche sur la météorite pour trouver une solution.",
        "Jour 9: Je ne peut plus sortir de mon lit, les jeunes scienfiques qui avait à peine 20 ans, doivent continuer la recherche sans moi",
        "Jour 10: Bonne nouvelle, on peut désactiver la barrière en reforgeant l'étrange minerai dans la météorite",
        "Jour 11: J'avais 40 ans, maintenant je suis 80.", 
        "Jour 12: L'ainé du village avait une des pières, mais il fut transformé en quelque chose d'autre suite à son décès.", 
        "Jour 13: Il est trop dangereux pour aller récupérer la pierre, nous sommes tous trop vieux",
        "Jour 14: C'est la fin pour moi, pour nous", 
        "Jour 15:" 
    ];
    
    const diaryEntries = [...defaultEntries]; // Copy default entries

    // Create style element
    const style = document.createElement('style');
    style.setAttribute('data-diary-style', 'true'); 

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

    // Create diary container
    const diaryDiv = document.createElement('div');
    diaryDiv.id = 'diaryDiv';
    targetDiv.appendChild(diaryDiv);

    // Day indicator
    const dayElement = document.createElement('div');
    dayElement.id = 'day';
    diaryDiv.appendChild(dayElement);

    // Diary text area (content editable for writing)
    const diaryText = document.createElement('div');
    diaryText.id = 'diaryText';
    diaryText.contentEditable = true;
    diaryText.spellcheck = false;
    diaryDiv.appendChild(diaryText);

    // Controls container
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'diaryControls';
    diaryDiv.appendChild(controlsDiv);

    // Previous page button
    const prevButton = document.createElement('button');
    prevButton.className = 'diaryButton';
    prevButton.id = 'prevPage-button';
    prevButton.textContent = 'Dernière page';	
    controlsDiv.appendChild(prevButton);

    // Page indicator
    const pageIndicator = document.createElement('span');
    pageIndicator.id = 'pageIndicator';
    controlsDiv.appendChild(pageIndicator);

    // Next page button
    const nextButton = document.createElement('button');
    nextButton.className = 'diaryButton';
    nextButton.id = 'nextPage-button';
    nextButton.textContent = 'Page suivante';
    controlsDiv.appendChild(nextButton);

    // Close diary button
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

    // Update diary display
    function updateDiary() {
        dayElement.textContent = `Jour ${currentPage + 1}`;
        diaryText.textContent = diaryEntries[currentPage];
        pageIndicator.textContent = `Page ${currentPage + 1}/${totalPages}`;
        
        prevButton.disabled = currentPage === 0;
        nextButton.disabled = currentPage === totalPages - 1;
    }

    // Save current text before changing pages
    function saveCurrentEntry() {
        diaryEntries[currentPage] = diaryText.textContent;
    }

    // Function to leave the puzzle (transferred from numberGuesser)
    function leaveGame() {
        scene.player.isQuestActive = false;
        scene.player.isQuestOpen = false;
        scene.input.keyboard.enabled = true;
        // Destroy all items
        document.getElementById('puzzleDiv').style.display = 'none';
        DOMelements.forEach(element => {
            if (element && element.parentNode) {
                element.remove();
            }
        });
    }

    // Close diary function with proper cleanup
    function closeDiary() {
        saveCurrentEntry();
        scene.input.keyboard.enabled = true;
        setTimeout(() => {
                leaveGame();
            }, 1000);
    }
    // Event listeners
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

    // Initialize diary
    updateDiary();

    return {
        getEntries: () => diaryEntries,
        saveEntries: saveCurrentEntry,
        close: closeDiary
    };
}

export { diary };