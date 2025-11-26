const gameBoard = document.getElementById("gameBoard");
const movesEl = document.getElementById("moves");
const matchesEl = document.getElementById("matches");
const timeEl = document.getElementById("time");
const highScoreEl = document.getElementById("highScore");
const congrats = document.getElementById("congrats");

// Leaderboard
const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardList = document.getElementById("leaderboardList");
const playerNameInput = document.getElementById("playerName");

// Theme chooser
const themeChooser = document.getElementById("themeChooser");
const startBtn = document.getElementById("startBtn");

// Confetti
const confettiCanvas = document.getElementById("confettiCanvas");
const ctx = confettiCanvas.getContext("2d");
let confettiParticles = [];

let cards = [];
let flippedCards = [];
let moves = 0;
let matches = 0;
let timer = null;
let time = 0;
let currentTheme = "fruits";

// Themes (13 icons for 25 cards → one extra filler)
const themes = {
  fruits: ["🍎","🍌","🍒","🍇","🍉","🍍","🥝","🍑","🍓","🥥","🍋","🍊","🍐"],
  animals: ["🐶","🐱","🐼","🦁","🐸","🐵","🐷","🐨","🐰","🦊","🦉","🐢","🐮"],
  flowers: ["🌸","🌹","🌻","🌼","🌷","🌺","💐","🌾","🌱","🍀","🌲","🌵","🌿"]
};

// Shuffle
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Setup Game (5x5)
function setupGame() {
  gameBoard.innerHTML = "";
  moves = 0; matches = 0; time = 0;
  movesEl.textContent = 0; matchesEl.textContent = 0; timeEl.textContent = "0s";
  clearInterval(timer);
  timer = setInterval(() => {
    time++;
    timeEl.textContent = time + "s";
  }, 1000);

  const icons = themes[currentTheme].slice(0, 12); // 12 pairs = 24 cards
  const cardSet = shuffle([...icons, ...icons, "⭐"]); // add single star to make 25
  cards = cardSet;
  
  cards.forEach(icon => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-back">❓</div>
        <div class="card-front">${icon}</div>
      </div>
    `;
    card.addEventListener("click", () => flipCard(card, icon));
    gameBoard.appendChild(card);
  });
}

// Flip logic
function flipCard(card, icon) {
  if (card.classList.contains("flipped") || flippedCards.length === 2) return;
  card.classList.add("flipped");
  flippedCards.push({ card, icon });

  if (flippedCards.length === 2) {
    moves++;
    movesEl.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [c1, c2] = flippedCards;
  if (c1.icon === c2.icon) {
    matches++;
    matchesEl.textContent = matches;
    flippedCards = [];
    if (matches === 12) { // 12 pairs only
      gameWon();
    }
  } else {
    setTimeout(() => {
      c1.card.classList.remove("flipped");
      c2.card.classList.remove("flipped");
      flippedCards = [];
    }, 1000);
  }
}

// Win
function gameWon() {
  clearInterval(timer);
  congrats.classList.remove("hidden");
  setTimeout(() => congrats.classList.add("hidden"), 4000);
  launchConfetti();

  const score = Math.max(1, Math.floor(10000 / (moves * (time || 1))));
  updateHighScore(score);
  updateLeaderboard(score);
}

// High Score
function updateHighScore(score) {
  const prev = localStorage.getItem("highScore") || 0;
  if (score > prev) {
    localStorage.setItem("highScore", score);
  }
  highScoreEl.textContent = localStorage.getItem("highScore");
}

// Leaderboard
function updateLeaderboard(score) {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  leaderboard.push({ name: "Anonymous", score });
  leaderboard.sort((a,b) => b.score - a.score);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard.slice(0,5)));
}

function renderLeaderboard() {
  leaderboardList.innerHTML = "";
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  leaderboard.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name}: ${entry.score}`;
    leaderboardList.appendChild(li);
  });
}

// Confetti 🎉 all over page
function launchConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiParticles = Array.from({length: 200}, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height - confettiCanvas.height,
    r: Math.random() * 6 + 4,
    d: Math.random() * 100,
    color: `hsl(${Math.random()*360}, 100%, 50%)`
  }));
  requestAnimationFrame(updateConfetti);
  setTimeout(() => { confettiParticles = []; ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height); }, 5000);
}

function updateConfetti() {
  ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.r, p.r);
    p.y += Math.cos(p.d) + 2 + p.r/2;
    p.x += Math.sin(p.d);
  });
  if (confettiParticles.length) requestAnimationFrame(updateConfetti);
}

// Buttons
document.getElementById("resetBtn").addEventListener("click", setupGame);
document.getElementById("leaderboardBtn").addEventListener("click", () => {
  renderLeaderboard();
  leaderboardModal.style.display = "flex";
});
document.getElementById("closeLeaderboard").addEventListener("click", () => {
  leaderboardModal.style.display = "none";
});
document.getElementById("saveScoreBtn").addEventListener("click", () => {
  const name = playerNameInput.value.trim() || "Player";
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  if (leaderboard.length > 0) {
    leaderboard[0].name = name;
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  }
  renderLeaderboard();
});

// Start button
startBtn.addEventListener("click", () => {
  currentTheme = themeChooser.value;
  setupGame();
});

// Init
updateHighScore(0);
