const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = {};
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let gameSpeed = 100;
let isGameRunning = false;
let isPaused = false;

const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

highScoreElement.textContent = highScore;

function initGame() {
    snake = [
        { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) },
        { x: Math.floor(tileCount / 2) - 1, y: Math.floor(tileCount / 2) },
        { x: Math.floor(tileCount / 2) - 2, y: Math.floor(tileCount / 2) }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreElement.textContent = score;
    generateFood();
}

function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    food = newFood;
}

function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#252540';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    const gradient = ctx.createRadialGradient(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        0,
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2
    );
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#ee5a5a');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    snake.forEach((segment, index) => {
        const isHead = index === 0;
        const brightness = 1 - (index * 0.03);
        
        const snakeGradient = ctx.createLinearGradient(
            segment.x * gridSize,
            segment.y * gridSize,
            segment.x * gridSize + gridSize,
            segment.y * gridSize + gridSize
        );
        
        if (isHead) {
            snakeGradient.addColorStop(0, '#4ade80');
            snakeGradient.addColorStop(1, '#22c55e');
        } else {
            snakeGradient.addColorStop(0, `rgba(74, 222, 128, ${brightness})`);
            snakeGradient.addColorStop(1, `rgba(34, 197, 94, ${brightness})`);
        }
        
        ctx.fillStyle = snakeGradient;
        ctx.beginPath();
        ctx.roundRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2,
            isHead ? 6 : 4
        );
        ctx.fill();

        if (isHead) {
            ctx.fillStyle = '#fff';
            const eyeSize = 3;
            const eyeOffset = 5;
            
            let eye1X, eye1Y, eye2X, eye2Y;
            
            if (direction.x === 1) {
                eye1X = segment.x * gridSize + gridSize - eyeOffset;
                eye1Y = segment.y * gridSize + eyeOffset;
                eye2X = segment.x * gridSize + gridSize - eyeOffset;
                eye2Y = segment.y * gridSize + gridSize - eyeOffset;
            } else if (direction.x === -1) {
                eye1X = segment.x * gridSize + eyeOffset;
                eye1Y = segment.y * gridSize + eyeOffset;
                eye2X = segment.x * gridSize + eyeOffset;
                eye2Y = segment.y * gridSize + gridSize - eyeOffset;
            } else if (direction.y === -1) {
                eye1X = segment.x * gridSize + eyeOffset;
                eye1Y = segment.y * gridSize + eyeOffset;
                eye2X = segment.x * gridSize + gridSize - eyeOffset;
                eye2Y = segment.y * gridSize + eyeOffset;
            } else {
                eye1X = segment.x * gridSize + eyeOffset;
                eye1Y = segment.y * gridSize + gridSize - eyeOffset;
                eye2X = segment.x * gridSize + gridSize - eyeOffset;
                eye2Y = segment.y * gridSize + gridSize - eyeOffset;
            }
            
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

function update() {
    if (!isGameRunning || isPaused) return;

    direction = { ...nextDirection };

    const newHead = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    if (newHead.x < 0 || newHead.x >= tileCount || newHead.y < 0 || newHead.y >= tileCount) {
        gameOver();
        return;
    }

    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        gameOver();
        return;
    }

    snake.unshift(newHead);

    if (newHead.x === food.x && newHead.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        generateFood();
        
        if (gameSpeed > 50) {
            gameSpeed -= 2;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, gameSpeed);
        }
    } else {
        snake.pop();
    }
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    gameLoop = null;
    
    draw();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '18px Segoe UI, sans-serif';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);
    ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 45);
    
    startBtn.textContent = 'Play Again';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

function gameStep() {
    update();
    draw();
}

function startGame() {
    initGame();
    isGameRunning = true;
    isPaused = false;
    gameSpeed = 100;
    startBtn.textContent = 'Restart';
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pause';
    gameLoop = setInterval(gameStep, gameSpeed);
}

function togglePause() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    draw();
}

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase()) || e.key === ' ') {
        e.preventDefault();
    }
    
    if ((key === ' ' || key === 'space') && isGameRunning) {
        togglePause();
        return;
    }

    if ((key === 'arrowup' || key === 'w') && direction.y !== 1) {
        nextDirection = { x: 0, y: -1 };
    } else if ((key === 'arrowdown' || key === 's') && direction.y !== -1) {
        nextDirection = { x: 0, y: 1 };
    } else if ((key === 'arrowleft' || key === 'a') && direction.x !== 1) {
        nextDirection = { x: -1, y: 0 };
    } else if ((key === 'arrowright' || key === 'd') && direction.x !== -1) {
        nextDirection = { x: 1, y: 0 };
    }
}

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    if (!isGameRunning || isPaused) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0 && direction.x !== -1) {
                nextDirection = { x: 1, y: 0 };
            } else if (deltaX < 0 && direction.x !== 1) {
                nextDirection = { x: -1, y: 0 };
            }
        }
    } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0 && direction.y !== -1) {
                nextDirection = { x: 0, y: 1 };
            } else if (deltaY < 0 && direction.y !== 1) {
                nextDirection = { x: 0, y: -1 };
            }
        }
    }
}

document.addEventListener('keydown', handleKeyDown);
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchend', handleTouchEnd);

initGame();
draw();
