// =======================================================
// FENIX COMBAT v2 - CORE ENGINE
// =======================================================

// Telegram WebApp init
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// =========================
// GAME STATE
// =========================
let game = JSON.parse(localStorage.getItem("fenix_game_v2")) || {
    coins: 0,
    energy: 3000,
    maxEnergy: 3000,
    tapPower: 1,
    pph: 0, // coins per hour
    level: 1,
    xp: 0,
    cards: {},
    friends: [],
    tasks: {},
    skin: "default",
    admin: false,
    lastSave: Date.now()
};

// =========================
// SAVE SYSTEM
// =========================
function saveGame() {
    game.lastSave = Date.now();
    localStorage.setItem("fenix_game_v2", JSON.stringify(game));
}

// autosave every 5 sec
setInterval(saveGame, 5000);

// =========================
// ELEMENTS
// =========================
const elCoins = document.getElementById("coins");
const elBalance = document.getElementById("balance");
const elEnergy = document.getElementById("energy");
const elMaxEnergy = document.getElementById("maxEnergy");
const elTapPower = document.getElementById("tapPower");
const elIncome = document.getElementById("income");
const elPphMine = document.getElementById("pph");
const tapButton = document.getElementById("tapButton");

// =========================
// LEVEL SYSTEM
// =========================
function calcLevel() {
    let lvl = Math.floor(Math.sqrt(game.coins / 1000)) + 1;
    if (lvl > 600) lvl = 600;
    game.level = lvl;
    return lvl;
}

// =========================
// UPDATE UI
// =========================
function updateUI() {
    calcLevel();

    const formattedCoins = Math.floor(game.coins).toLocaleString();
    if (elCoins) elCoins.innerText = formattedCoins;
    if (elBalance) elBalance.innerText = formattedCoins;
    if (elEnergy) elEnergy.innerText = Math.floor(game.energy);
    if (elMaxEnergy) elMaxEnergy.innerText = game.maxEnergy;
    if (elTapPower) elTapPower.innerText = game.tapPower;
    
    const formattedPph = Math.floor(game.pph);
    if (elIncome) elIncome.innerText = formattedPph;
    if (elPphMine) elPphMine.innerText = formattedPph;

    // Энергетический бар
    const energyFill = document.getElementById("energyFill");
    if (energyFill) {
        const pct = (game.energy / game.maxEnergy) * 100;
        energyFill.style.width = pct + "%";
    }

    // Evolution Avatar
    const avatar = document.getElementById("avatar");
    const phoenix = document.getElementById("phoenixImage");
    const topAvatar = document.getElementById("topAvatar");
    const profilePhoenix = document.getElementById("profilePhoenix");

    let stage = 1;
    if (game.level > 50) stage = 2;
    if (game.level > 150) stage = 3;
    if (game.level > 300) stage = 4;
    if (game.level > 500) stage = 5;

    const imgSrc = `assets/phoenix/level${stage}.png`;
    if (avatar) avatar.src = imgSrc;
    if (phoenix) phoenix.src = imgSrc;
    if (topAvatar) topAvatar.src = imgSrc;
    if (profilePhoenix) profilePhoenix.src = imgSrc;

    const lvlEl = document.getElementById("level");
    if (lvlEl) lvlEl.innerText = game.level;
    
    const profLvlEl = document.getElementById("profileLevel");
    if (profLvlEl) profLvlEl.innerText = "LVL " + game.level;
}

// =========================
// TAP SYSTEM
// =========================
function addCoins(amount, x = null, y = null) {
    if (game.energy < amount) return;

    game.coins += amount;
    game.xp += amount;
    game.energy -= amount;

    if (game.energy < 0) game.energy = 0;

    if (x !== null && y !== null) {
        createFloat(amount, x, y);
    }
    updateUI();
}

function createFloat(value, x, y) {
    const div = document.createElement("div");
    div.className = "float";
    div.innerText = "+" + value;
    div.style.left = x + "px";
    div.style.top = y + "px";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 800);
}

if (tapButton) {
    tapButton.addEventListener("click", (e) => {
        if (game.energy <= 0) return;
        const rect = tapButton.getBoundingClientRect();
        const x = e.clientX || (rect.left + rect.width / 2);
        const y = e.clientY || (rect.top + rect.height / 2);
        addCoins(game.tapPower, x, y);
    });
}

// Energy Regen
setInterval(() => {
    if (game.energy < game.maxEnergy) {
        game.energy += 2;
        if (game.energy > game.maxEnergy) game.energy = game.maxEnergy;
        updateUI();
    }
}, 1000);

// Passive Income
setInterval(() => {
    if (game.pph > 0) {
        game.coins += game.pph / 3600;
        updateUI();
    }
}, 1000);

// =======================================================
// PART 2: MINE SYSTEM & CARDS
// =======================================================
const CARD_TYPES = [
    { id: "mkt", name: "Market Node", base: 50, pph: 5 },
    { id: "tech", name: "Tech Server", base: 200, pph: 20 },
    { id: "legal", name: "Legal Node", base: 500, pph: 60 },
    { id: "pr", name: "PR Network", base: 1200, pph: 150 },
    { id: "elite", name: "Elite System", base: 5000, pph: 600 }
];

function generateCards() {
    let cards = [];
    for (let i = 0; i < 300; i++) {
        CARD_TYPES.forEach(type => {
            cards.push({
                id: type.id + "_" + i,
                name: type.name + " #" + i,
                price: Math.floor(type.base * (1 + i * 0.15)),
                pph: Math.floor(type.pph * (1 + i * 0.12)),
                levelReq: Math.floor(i / 10),
                type: type.id
            });
        });
    }
    return cards;
}
const CARDS = generateCards();

function renderMine() {
    const container = document.getElementById("cardsContainer");
    if (!container) return;
    container.innerHTML = "";

    CARDS.slice(0, 30).forEach(card => {
        let locked = game.level < card.levelReq;
        let canBuy = game.coins >= card.price && !locked;

        let div = document.createElement("div");
        div.className = "game-card";
        if (locked) div.classList.add("locked");

        div.innerHTML = `
            <div class="card-level">LVL ${card.levelReq}</div>
            <div class="card-icon">⛏</div>
            <div class="card-title">${card.name}</div>
            <div class="card-profit">+${card.pph} / hour</div>
            <div class="card-price">${card.price.toLocaleString()} COIN</div>
            <button class="buy-btn" ${!canBuy ? "disabled" : ""}>
                ${locked ? "LOCKED" : "BUY"}
            </button>
        `;

        if (!locked && canBuy) {
            div.querySelector("button").addEventListener("click", () => buyCard(card));
        }
        container.appendChild(div);
    });
}

function buyCard(card) {
    if (game.coins < card.price || game.level < card.levelReq) return;

    game.coins -= card.price;
    game.cards[card.id] = (game.cards[card.id] || 0) + 1;
    game.pph += card.pph;

    saveGame();
    updateUI();
    renderMine();
}

// Daily Combo
const DAILY_COMBO = ["mkt_1", "tech_2", "legal_3"];
function checkCombo() {
    let done = DAILY_COMBO.every(id => game.cards[id] > 0);
    if (done && !game.comboClaimed) {
        game.comboClaimed = true;
        game.coins += 5000000;
        showToast("🔥 DAILY COMBO COMPLETED +5M COINS");
        saveGame();
        updateUI();
    }
}
setInterval(checkCombo, 5000);

function showToast(text) {
    let t = document.createElement("div");
    t.className = "toast";
    t.innerText = text;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 100);
    setTimeout(() => {
        t.classList.remove("show");
        setTimeout(() => t.remove(), 300);
    }, 2500);
}

// =======================================================
// PART 3: EARN SYSTEM
// =======================================================
const DAILY_REWARD_AMOUNT = 5000;
const MORSE_REWARD = 25000;
const MORSE_CODE = "... --- ..."; // SOS

function initDailyReward() {
    const today = new Date().toDateString();
    const lastClaim = localStorage.getItem("dailyRewardDate");
    const claimBtn = document.getElementById("claimReward");
    const rewardDays = document.getElementById("rewardDays");

    if (rewardDays) rewardDays.innerText = `Доступно: +${DAILY_REWARD_AMOUNT} COINS`;

    if (claimBtn) {
        if (lastClaim === today) {
            claimBtn.innerText = "Получено";
            claimBtn.disabled = true;
        } else {
            claimBtn.innerText = "Получить";
            claimBtn.disabled = false;
            claimBtn.onclick = () => {
                game.coins += DAILY_REWARD_AMOUNT;
                localStorage.setItem("dailyRewardDate", today);
                saveGame();
                updateUI();
                initDailyReward();
                showToast("🎁 Награда получена!");
            };
        }
    }
}

const DAILY_TASKS = [
    { id: "t1", text: "Подпишись на @qfenixqa", reward: 10000 },
    { id: "t2", text: "Открой игру 3 раза", reward: 8000 },
    { id: "t3", text: "Сделай 500 тапов", reward: 15000 }
];
let taskProgress = JSON.parse(localStorage.getItem("taskProgress") || "{}");

function initTasks() {
    const container = document.getElementById("tasksContainer");
    if (!container) return;
    container.innerHTML = "";

    DAILY_TASKS.forEach(task => {
        const done = taskProgress[task.id];
        const div = document.createElement("div");
        div.className = `task ${done ? "done" : ""}`;
        div.innerHTML = `
            <div class="task-title">${task.text}</div>
            <div class="task-reward">+${task.reward}</div>
            <button class="task-btn ${done ? 'done' : ''}" ${done ? "disabled" : ""}>
                ${done ? "✅" : "Выполнить"}
            </button>
        `;
        if (!done) {
            div.querySelector("button").onclick = () => claimTask(task.id, task.reward);
        }
        container.appendChild(div);
    });
}

function claimTask(id, reward) {
    if (taskProgress[id]) return;
    game.coins += reward;
    taskProgress[id] = true;
    localStorage.setItem("taskProgress", JSON.stringify(taskProgress));
    saveGame();
    updateUI();
    initTasks();
    showToast("✅ Задание выполнено!");
}

function initMorse() {
    const checkBtn = document.getElementById("checkMorse");
    if (checkBtn) {
        checkBtn.onclick = () => {
            const input = document.getElementById("morseInput").value.trim();
            if (input === MORSE_CODE) {
                game.coins += MORSE_REWARD;
                saveGame();
                updateUI();
                showToast("🎉 Код верный! +25k");
            } else {
                showToast("❌ Неверный код");
            }
        };
    }
}

function initEarn() {
    initDailyReward();
    initTasks();
    initMorse();
}

// =======================================================
// PART 4: FRIENDS
// =======================================================
const REF_BONUS = 20000;
function getRefLink() { return `https://t.me/qfenixqa?start=${game.userId || "guest"}`; }

function initFriends() {
    const linkInput = document.getElementById("refLink");
    const container = document.getElementById("friendsContainer");
    const countEl = document.getElementById("friendsCount");

    if (linkInput) linkInput.value = getRefLink();
    if (countEl) countEl.innerText = (game.friends || []).length;

    if (container) {
        if (!game.friends || game.friends.length === 0) {
            container.innerHTML = `<div class="empty" style="color:#8f96a8;text-align:center;padding:10px;">Нет приглашённых друзей</div>`;
        } else {
            container.innerHTML = game.friends.map(f => `
                <div class="task">
                    <div>👤 ${f.name}</div>
                    <div style="color:var(--gold);font-weight:900;">+${f.reward}</div>
                </div>
            `).join("");
        }
    }

    const copyBtn = document.getElementById("copyRef");
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(getRefLink());
            showToast("🔗 Ссылка скопирована");
        };
    }
}

// =======================================================
// PART 5: PVP Arena
// =======================================================
function initPvP() {
    const btn = document.getElementById("startPvPBtn");
    if (btn) {
        btn.onclick = () => {
            const betInput = document.getElementById("pvpBetInput");
            const bet = parseInt(betInput?.value || "0");
            const status = document.getElementById("enemyName");

            if (bet < 1000) { showToast("Минимальная ставка: 1000"); return; }
            if (game.coins < bet) { showToast("Недостаточно монет"); return; }

            game.coins -= bet;
            updateUI();
            if (status) status.innerText = "⏳ Ищем соперника...";

            setTimeout(() => {
                const win = Math.random() >= 0.4; // 60% шанс победы
                if (win) {
                    game.coins += bet * 2;
                    if (status) status.innerText = `🏆 Победа! +${bet * 2}`;
                } else {
                    if (status) status.innerText = "❌ Поражение!";
                }
                saveGame();
                updateUI();
            }, 2000);
        };
    }
}

// =======================================================
// NAVIGATION SYSTEM
// =======================================================
document.querySelectorAll('[data-screen]').forEach(btn => {
    btn.addEventListener('click', () => {
        const screenName = btn.getAttribute('data-screen');

        // Кнопки меню
        document.querySelectorAll('[data-screen]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Переключение экранов
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const targetScreen = document.getElementById(`screen-${screenName}`);
        if (targetScreen) targetScreen.classList.add('active');

        // Ленивая инициализация
        if (screenName === 'mine') renderMine();
        if (screenName === 'earn') initEarn();
        if (screenName === 'friends') initFriends();
        if (screenName === 'pvp') initPvP();
    });
});

// Глобальный старт приложения
window.addEventListener('DOMContentLoaded', () => {
    // Убираем лоадер
    const loader = document.getElementById("loader");
    if (loader) setTimeout(() => loader.style.display = "none", 600);

    // Подписка (заглушка для проверки)
    const checkSub = document.getElementById("checkSub");
    if (checkSub) {
        checkSub.onclick = () => {
            const subScreen = document.getElementById("subscribeScreen");
            if (subScreen) subScreen.style.display = "none";
        };
    }

    updateUI();
});