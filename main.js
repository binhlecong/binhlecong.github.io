const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const GFORCE = 1;

// management
let score;
let highScore;
let bird;
let gravity;
let isRunning;
let isPlayingAudio;
let obstacles = [];
let bonuses = [];
let backgrounds = [];
let keys = {};

// display
var birdImg = new Image();
var bonusImg = new Image();
var backgroundImg = new Image();
var pipe_lower_Img = new Image();
var pipe_upper_Img = new Image();

birdImg.src = 'img/bird.png';
bonusImg.src = 'img/bonus.png';
backgroundImg.src = 'img/bg.png';
pipe_lower_Img.src = 'img/pipeSouth.png';
pipe_upper_Img.src = 'img/pipeNorth.png';

// audio
var die = new Audio();
var scoreSound = new Audio();
var bonusSound = new Audio();

die.src = 'sound/die.wav';
scoreSound.src = 'sound/score.wav';
bonusSound.src = 'sound/bonus.wav';

// event handlers
document.addEventListener('keydown', function(evt) {
    keys[evt.code] = true;
    if (isPlayingAudio == false) {
        bird._dy = 0;
        bird.flyUp();
        if (isRunning == false) // **respawning
        {
            isRunning = true;
            bird._y = canvas.height / 4;
        }
    }
});

document.addEventListener('keyup', function(evt) {
    keys[evt.code] = false;
});

// Object definitions
class Text {
    constructor(t, x, y, a, c, s) {
        this._t = t;
        this._x = x;
        this._y = y;
        this._a = a;
        this._c = c;
        this._s = s;
    }

    draw() {
        ctx.beginPath();
        ctx.textAlign = this._a;
        ctx.font = this._s + 'px Allerta Stencil';
        ctx.textAlign = this._a;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(this._t, this._x, this._y);
        ctx.fillStyle = this._c;
        ctx.fillText(this._t, this._x, this._y);
        ctx.closePath();
    }
}

class Bird {
    constructor(x, y, w, h) {
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;

        this._dy = 0;
        this._jumpForce = 15;
        this._isCrashed = false;
    }

    draw() {
        ctx.drawImage(birdImg, this._x, this._y, this._w, this._h)
    }

    animate() {
        this._y += this._dy;
        this._dy += gravity;

        this.draw();
    }

    flyUp() {
        this._dy = -this._jumpForce; 
    }
}

class Bonus {
    constructor(x, y, w, h, value) {
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;

        this._dx = -10;
        this._score = value;
        this._taken = false;
        this._timer = 0;
    }

    draw() {
        let scrX = Math.floor(this._timer / 3) * 121 + 1;
        ctx.drawImage(bonusImg, scrX, 271, 120, 120, this._x, this._y, this._w, this._h);
    }

    update() {
        this._x += this._dx; 
        this._timer++;
        this._timer = this._timer > 17 ? 0 : this._timer;
        if (this._taken == false) this.draw();
    }
}

class Chimmey {
    constructor(x, y, w, h) {
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;

        this._upperX = this._x;
        this._upperY = 0;
        this._upperW = this._w;
        this._upperH = this._y;

        this._lowerX = this._x;
        this._lowerY = this._y + this._h;
        this._lowerW = this._w;
        this._lowerH = canvas.height - this._y - this._h;

        this._dx = -10;
        this._score = 2;
    }

    draw() {
        ctx.drawImage(pipe_upper_Img, this._x, 0, this._w, this._y);
        ctx.drawImage(pipe_lower_Img, this._x, this._y + this._h, this._w, canvas.height - this._y - this._h);
    }

    update() {
        this._x += this._dx; 
        this._lowerX += this._dx;
        this._upperX += this._dx;
        this.draw();
    }
}

class Background {
    constructor(x) {
        this._x = x;
        this._y = 0;
        this._w = canvas.width / 2;
        this._h = canvas.height;
        this._dx = -5;
    }

    draw() {
        ctx.drawImage(backgroundImg, this._x, this._y, this._w, this._h);
    }

    update() {
        this._x += this._dx; 
        this.draw();
    }
}

// Auxilary functions
function randInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function spawnObs() {
    let gapY = randInRange(100, canvas.height - 300);
    let obs = new Chimmey(canvas.width, gapY, 100, 240);
    obstacles.push(obs);
}

function spawnBonus() {
    let y = randInRange(200, canvas.height - 350);
    let deltaX = randInRange(200, 300); 
    let bns = new Bonus(canvas.width + deltaX, y, 50, 50, 10);
    bonuses.push(bns);
}

// Main loop
function init() {
    canvas.width = window.innerWidth - 9;
    canvas.height = window.innerHeight - 12;
    ctx.font = '20px sans-serif';

    isRunning = false;
    isPlayingAudio = false;
    gravity = GFORCE;
    score = 0;
    highScore = 0;

    bird = new Bird(canvas.width / 3, canvas.height / 4, 51, 39);
    backgrounds.push(new Background(0));
    backgrounds.push(new Background(canvas.width / 2));
    backgrounds.push(new Background(canvas.width));
    scoreText = new Text("Score: " + score, 125, 50, "center", "gray", "20");
    highScoreText = new Text("Highscore: " + highScore, 600, 50, "center", 'yellow', "30");
    replayText = new Text("Press any key to play", canvas.width / 2, canvas.height / 2, "center", "white", "80");

    requestAnimationFrame(update);
}

const initialSpawnTimer = 60;
var spawnTimer = 60;
function update() {
    requestAnimationFrame(update);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // obstacles generator
    spawnTimer--;
    if (spawnTimer <= 0 && isRunning) {
        spawnObs();
        let isBonusSpawn = randInRange(1, 2); 
        if (isBonusSpawn < 2) {
            spawnBonus();
        }
        spawnTimer = 60;
    }

    // Render background
    for (let i = 0; i < backgrounds.length; i++) {
        let bg = backgrounds[i];
        if (bg._x + bg._w < 0) {
            bg._x = canvas.width;
        }
        bg.update();
    };

    // collision detection
    for (let i = 0; i < bonuses.length; i++) {
        let b = bonuses[i];
        
        if (b._x + b._w < 0) {
            bonuses.splice(i, 1);
        } else {
            b.update();
        }

        if (
            bird._x < b._x + b._w &&
            bird._x + bird._w > b._x &&
            bird._y < b._y + b._h &&
            bird._y + bird._h > b._y
        ) {
            bonusSound.play();
            score += b._score;
            b._score = 0;
            b._taken = true;
        }
    }

    for (let i = 0; i < obstacles.length; i++) {
        let o = obstacles[i];

        if (o._x + o._w < 0) {
            obstacles.splice(i, 1);
        } else {
            o.update();
        }

        if (
            bird._x < o._x + o._w &&
            bird._x + bird._w > o._x &&
            bird._y < o._y + o._h &&
            bird._y + bird._h > o._y
        ) {
            scoreSound.play();
            score += o._score;
            o._score = 0;
        }

        if (
            bird._x < o._lowerX + o._lowerW &&
            bird._x + bird._w > o._lowerX &&
            bird._y < o._lowerY + o._lowerH &&
            bird._y + bird._h > o._lowerY ||
            bird._x < o._upperX + o._upperW &&
            bird._x + bird._w > o._upperX &&
            bird._y < o._upperY + o._upperH &&
            bird._y + bird._h > o._upperY ||
            bird._y >= canvas.height - bird._h ||
            bird._y <= 1
        ) {
            isPlayingAudio = true;
            
            die.play();
            obstacles = [];
            bonuses = [];
            score = 0;
            spawnTimer = initialSpawnTimer;
            isRunning = false;
        }
    }

    // canvas renderer
    if (bird._dy <= canvas.height) {
        bird.animate();
    }
    
    if (!isRunning) {
        highScoreText.draw();
        scoreText.draw();
        if (die.paused) 
        {
            isPlayingAudio = false;
            replayText.draw();
        }
    } else {
        scoreText._t = "Score: " + score;
        scoreText.draw();

        highScore = Math.max(highScore, score);
        highScoreText._t = "Highscore: " + highScore;
        highScoreText.draw();
    }
}

init();