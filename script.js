// script.js

const canvas = document.getElementById('pong');
const context = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

const paddleWidth = 10, paddleHeight = 100;
const player = {
    x: 0,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: 'white',
    score: 0
};
const computer = {
    x: canvas.width - paddleWidth,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: 'white',
    score: 0
};
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speed: 5,
    velocityX: 5,
    velocityY: 5,
    color: 'white'
};

let multiplayer = false;
let powerUpsEnabled = false;
let difficulty = 'medium';
let powerUps = [];
let highScores = JSON.parse(localStorage.getItem('high-scores')) || [0, 0];
let gameInterval;

const hitSound = new Audio('sounds/hit.wav');
const scoreSound = new Audio('sounds/score.wav');
const wallSound = new Audio('sounds/wall.wav');
const powerUpSound = new Audio('sounds/power-up.wav');

function drawRect(x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

function drawText(text, x, y, color) {
    context.fillStyle = color;
    context.font = '35px sans-serif';
    context.fillText(text, x, y);
}

function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(canvas.width / 2 - 1, i, 2, 10, 'white');
    }
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        drawCircle(powerUp.x, powerUp.y, powerUp.radius, powerUp.color);
    });
}

function updateScoreboard() {
    const scoreboard = document.querySelector('.scoreboard');
    if (!scoreboard) {
        const scoreboardDiv = document.createElement('div');
        scoreboardDiv.className = 'scoreboard';
        scoreboardDiv.innerHTML = `High Scores: Player - ${highScores[0]}, Computer - ${highScores[1]}`;
        document.body.appendChild(scoreboardDiv);
    } else {
        scoreboard.innerHTML = `High Scores: Player - ${highScores[0]}, Computer - ${highScores[1]}`;
    }
}

canvas.addEventListener('mousemove', movePaddle);

function movePaddle(evt) {
    let rect = canvas.getBoundingClientRect();
    player.y = evt.clientY - rect.top - player.height / 2;
}

function collision(b, p) {
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    return b.right > p.left && b.bottom > p.top && b.left < p.right && b.top < p.bottom;
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 5;
}

function generatePowerUp() {
    const powerUp = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 10,
        color: 'yellow'
    };
    powerUps.push(powerUp);
    setTimeout(() => {
        const index = powerUps.indexOf(powerUp);
        if (index !== -1) {
            powerUps.splice(index, 1);
        }
    }, 10000); // Power-up lasts for 10 seconds
}

function update() {
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    if (powerUpsEnabled && Math.random() < 0.01) {
        generatePowerUp();
    }

    if (!multiplayer) {
        if (difficulty === 'easy') {
            computer.y += (ball.y - (computer.y + computer.height / 2)) * 0.05;
        } else if (difficulty === 'medium') {
            computer.y += (ball.y - (computer.y + computer.height / 2)) * 0.1;
        } else if (difficulty === 'hard') {
            computer.y += (ball.y - (computer.y + computer.height / 2)) * 0.2;
        }
    }

    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.velocityY = -ball.velocityY;
        wallSound.play();
    }

    let playerOrComputer = (ball.x < canvas.width / 2) ? player : computer;

    if (collision(ball, playerOrComputer)) {
        hitSound.play();
        let collidePoint = ball.y - (playerOrComputer.y + playerOrComputer.height / 2);
        collidePoint = collidePoint / (playerOrComputer.height / 2);
        let angleRad = (Math.PI / 4) * collidePoint;
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        ball.speed += 0.5;
    }

    if (ball.x - ball.radius < 0) {
        computer.score++;
        scoreSound.play();
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        scoreSound.play();
        resetBall();
    }

    if (powerUpsEnabled) {
        powerUps.forEach((powerUp, index) => {
            if (collision(ball, powerUp)) {
                powerUpSound.play();
                ball.speed += 2;
                powerUps.splice(index, 1);
            }
        });
    }
}

function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawNet();
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(computer.x, computer.y, computer.width, computer.height, computer.color);
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
    drawPowerUps();
    drawText(player.score, canvas.width / 4, canvas.height / 5, 'white');
    drawText(computer.score, 3 * canvas.width / 4, canvas.height / 5, 'white');
    update();
}

function startGame() {
    if (!gameInterval) {
        gameInterval = setInterval(gameLoop, 1000 / 60); // 60 frames per second
    }
}

function stopGame() {
    clearInterval(gameInterval);
    gameInterval = null;
}

function toggleMultiplayer() {
    multiplayer = !multiplayer;
    const multiplayerButton = document.getElementById('multiplayer');
    multiplayerButton.textContent = `Multiplayer: ${multiplayer ? 'ON' : 'OFF'}`;
}

function togglePowerUps() {
    powerUpsEnabled = !powerUpsEnabled;
    const powerUpsButton = document.getElementById('power-ups');
    powerUpsButton.textContent = `Power-ups: ${powerUpsEnabled ? 'ON' : 'OFF'}`;
}

function setDifficulty(diff) {
    difficulty = diff;
}

document.getElementById('start').addEventListener('click', startGame);
document.getElementById('stop').addEventListener('click', stopGame);
document.getElementById('multiplayer').addEventListener('click', toggleMultiplayer);
document.getElementById('power-ups').addEventListener('click', togglePowerUps);
document.getElementById('easy').addEventListener('click', () => setDifficulty('easy'));
document.getElementById('medium').addEventListener('click', () => setDifficulty('medium'));
document.getElementById('hard').addEventListener('click', () => setDifficulty('hard'));

updateScoreboard();
