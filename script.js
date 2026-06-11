// Game state
const gameState = {
    currentLevel: 1,
    completedLevels: new Set(),
    starsPerLevel: {},
    maxLevels: 3,
    commandsUsed: 0,
    maxCommands: 10, // Stubbed limit
    starsEarned: 0,
    levelData: {}
};

// Load saved progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('kidsCodingGameProgress');
    if (saved) {
        const parsed = JSON.parse(saved);
        gameState.completedLevels = new Set(parsed.completedLevels || []);
        gameState.starsPerLevel = parsed.starsPerLevel || {};
    }
}

// Save progress to localStorage
function saveProgress() {
    const toSave = {
        completedLevels: Array.from(gameState.completedLevels),
        starsPerLevel: gameState.starsPerLevel
    };
    localStorage.setItem('kidsCodingGameProgress', JSON.stringify(toSave));
}

// Initialize level data (stubbed)
function initLevelData() {
    for (let i = 1; i <= gameState.maxLevels; i++) {
        gameState.levelData[i] = {
            id: i,
            name: `Level ${i}`,
            gridSize: 5,
            robotStart: { x: 0, y: 0 },
            goal: { x: 4, y: 4 },
            obstacles: [
                // Example obstacles for level 1
                { x: 2, y: 2 },
                { x: 3, y: 2 }
            ],
            stars: [0, 1, 2], // Stars based on commands used: 0 stars if > maxCommands, 1 star if <= maxCommands*0.75, 2 stars if <= maxCommands*0.5
            hint: `Try to reach the green goal while avoiding the black obstacles. Use the arrow buttons or type commands like "move_up".`
        };
    }
}

// DOM elements
const screens = {
    worldMap: document.getElementById('world-map'),
    level: document.getElementById('level-screen'),
    result: document.getElementById('result-screen')
};

const levelButtonsContainer = document.getElementById('level-buttons');
const levelNumberDisplay = document.getElementById('level-number');
const gameBoard = document.getElementById('game-board');
const commandInput = document.getElementById('command-input');
const executeBtn = document.getElementById('execute-commands');
const hintBtn = document.getElementById('hint-btn');
const resetBtn = document.getElementById('reset-btn');
const backBtn = document.getElementById('back-to-map');
const resultStarsDisplay = document.getElementById('result-stars');
const retryBtn = document.getElementById('retry-level');
const nextBtn = document.getElementById('next-level');

// Current level state
let currentLevelState = {
    robot: { x: 0, y: 0 },
    grid: [],
    starsCollected: 0,
    isCompleted: false,
    commands: []
};

// Initialize the game
function initGame() {
    loadProgress();
    initLevelData();
    renderLevelButtons();
    setupEventListeners();
}

// Render level selection buttons
function renderLevelButtons() {
    levelButtonsContainer.innerHTML = '';
    for (let i = 1; i <= gameState.maxLevels; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.textContent = i;
        btn.dataset.level = i;

        if (gameState.completedLevels.has(i)) {
            btn.classList.add('completed');
        } else if (i > 1 && !gameState.completedLevels.has(i - 1)) {
            btn.classList.add('locked');
            btn.title = 'Complete previous levels to unlock';
            btn.disabled = true;
        }

        btn.addEventListener('click', () => startLevel(i));
        levelButtonsContainer.appendChild(btn);
    }
}

// Start a level
function startLevel(levelNum) {
    gameState.currentLevel = levelNum;
    currentLevelState = JSON.parse(JSON.stringify(gameState.levelData[levelNum]));
    currentLevelState.robot = { x: 0, y: 0 }; // Reset robot position
    currentLevelState.starsCollected = 0;
    currentLevelState.isCompleted = false;
    currentLevelState.commands = [];
    currentLevelState.commandsUsed = 0;

    // Update UI
    levelNumberDisplay.textContent = levelNum;
    switchScreen('level');
    renderBoard();
    updateStarsDisplay();
}

// Switch between screens
function switchScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Render the game board
function renderBoard() {
    const size = currentLevelState.gridSize;
    gameBoard.innerHTML = '';

    // Create grid
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            // Check for robot
            if (currentLevelState.robot.x === x && currentLevelState.robot.y === y) {
                cell.classList.add('robot');
            }

            // Check for goal
            if (currentLevelState.goal.x === x && currentLevelState.goal.y === y) {
                cell.classList.add('goal');
            }

            // Check for obstacles
            const obstacle = currentLevelState.obstacles.find(obs => obs.x === x && obs.y === y);
            if (obstacle) {
                cell.classList.add('obstacle');
            }

            gameBoard.appendChild(cell);
        }
    }
}

// Update stars display in level screen
function updateStarsDisplay() {
    // For now, just show max possible stars
    const maxStars = currentLevelState.stars ? currentLevelState.stars.length - 1 : 2;
    document.getElementById('stars-earned').textContent = `${gameState.starsEarned}/${maxStars}`;
}

// Execute commands
function executeCommands() {
    const cmdString = commandInput.value.trim();
    if (!cmdString) return;

    const commands = cmdString.split(',').map(cmd => cmd.trim().toLowerCase());
    currentLevelState.commands = commands;
    currentLevelState.commandsUsed = commands.length;

    // Process each command
    for (const cmd of commands) {
        if (currentLevelState.isCompleted) break;
        processCommand(cmd);
        renderBoard();
        if (currentLevelState.isCompleted) break;
    }

    commandInput.value = '';

    // Check for completion
    if (currentLevelState.isCompleted) {
        levelComplete();
    } else if (currentLevelState.commandsUsed >= gameState.maxCommands) {
        // Stub: handle command limit reached
        alert('Command limit reached! Try again.');
    }
}

// Process a single command
function processCommand(cmd) {
    const { robot } = currentLevelState;

    switch (cmd) {
        case 'move_up':
            if (robot.y > 0 && !isObstacle(robot.x, robot.y - 1)) robot.y--;
            break;
        case 'move_down':
            if (robot.y < currentLevelState.gridSize - 1 && !isObstacle(robot.x, robot.y + 1)) robot.y++;
            break;
        case 'move_left':
            if (robot.x > 0 && !isObstacle(robot.x - 1, robot.y)) robot.x--;
            break;
        case 'move_right':
            if (robot.x < currentLevelState.gridSize - 1 && !isObstacle(robot.x + 1, robot.y)) robot.x++;
            break;
        default:
            console.log(`Unknown command: ${cmd}`);
    }

    // Check if robot reached goal
    if (robot.x === currentLevelState.goal.x && robot.y === currentLevelState.goal.y) {
        currentLevelState.isCompleted = true;
        collectStars();
    }
}

// Check if there's an obstacle at position
function isObstacle(x, y) {
    return currentLevelState.obstacles.some(obs => obs.x === x && obs.y === y);
}

// Calculate stars earned based on commands used
function collectStars() {
    const levelStars = currentLevelState.stars;
    if (!levelStars) return 0;

    const maxAllowed = gameState.maxCommands;
    const used = currentLevelState.commandsUsed;

    // Simple star calculation: 2 stars if used <= 50% of max, 1 star if <= 75%, 0 stars otherwise
    if (used <= maxAllowed * 0.5) {
        gameState.starsEarned = 2;
    } else if (used <= maxAllowed * 0.75) {
        gameState.starsEarned = 1;
    } else {
        gameState.starsEarned = 0;
    }

    return gameState.starsEarned;
}

// Level complete handler
function levelComplete() {
    const level = gameState.currentLevel;
    gameState.completedLevels.add(level);
    gameState.starsPerLevel[level] = gameState.starsEarned;
    saveProgress();

    // Show result screen
    resultStarsDisplay.textContent = gameState.starsEarned;
    switchScreen('result');
}

// Show hint
function showHint() {
    const hint = currentLevelState.hint || "Try to reach the green goal!";
    alert(hint);
}

// Reset level
function resetLevel() {
    startLevel(gameState.currentLevel);
}

// Event listeners
function setupEventListeners() {
    executeBtn.addEventListener('click', executeCommands);

    // Command buttons
    document.querySelectorAll('.cmd-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cmd = btn.dataset.cmd;
            commandInput.value += (commandInput.value ? ',' : '') + cmd;
            commandInput.focus();
        });
    });

    hintBtn.addEventListener('click', showHint);
    resetBtn.addEventListener('click', resetLevel);
    backBtn.addEventListener('click', () => switchScreen('worldMap'));

    retryBtn.addEventListener('click', () => startLevel(gameState.currentLevel));
    nextBtn.addEventListener('click', () => {
        const nextLevel = gameState.currentLevel + 1;
        if (nextLevel <= gameState.maxLevels) {
            startLevel(nextLevel);
        } else {
            alert('No more levels! Restarting from level 1...');
            startLevel(1);
        }
    });

    // Allow Enter key to execute commands
    commandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeCommands();
        }
    });
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', initGame);