// --- ИГРОВАЯ БАЗА ДАННЫХ КАРТОЧЕК ---
const INITIAL_CARDS = [
    { id: "btc_farm", name: "Bitcoin Farm", baseCost: 35000, basePPH: 2430, category: "market", level: 0 },
    { id: "eth_node", name: "Ethereum Node", baseCost: 28000, basePPH: 1890, category: "market", level: 0 },
    { id: "sol_hub", name: "Solana Hub", baseCost: 22000, basePPH: 1450, category: "market", level: 0 },
    { id: "legal_dept", name: "Legal Dept.", baseCost: 18000, basePPH: 1200, category: "legal", level: 0 },
    { id: "marketing", name: "Marketing", baseCost: 15000, basePPH: 980, category: "team", level: 0 },
    { id: "security", name: "Security Team", baseCost: 12000, basePPH: 850, category: "team", level: 0 }
];

// --- ТЕКУЩЕЕЕ ЕЖЕДНЕВНОЕ КОМБО (Задано статически для теста) ---
const DAILY_COMBO_IDS = ["btc_farm", "marketing", "legal_dept"];

// --- СОСТОЯНИЕ ИГРЫ (Загрузка или дефолт) ---
let player = JSON.parse(localStorage.getItem("fenix_player_save")) || {
    balance: 5432129, // Стартовый баланс как на скрине
    pph: 125430,
    level: 123,
    energy: 2780,
    maxEnergy: 3000,
    tapPower: 125,
    totalTaps: 12430987,
    cards: {},
    claimedCombo: false,
    currentComboAnswers: []
};

// Заполнение пустых карточек при первом запуске
INITIAL_CARDS.forEach(c => {
    if (!player.cards[c.id]) player.cards[c.id] = 0;
});

// --- СИСТЕМА ОБНОВЛЕНИЯ ИНТЕРФЕЙСА ---
function updateUI() {
    // Округление для красивого вывода целочисленных монет
    const displayBalance = Math.floor(player.balance).toLocaleString();
    
    document.getElementById("top-balance").innerText = displayBalance;
    document.getElementById("main-balance").innerText = displayBalance;
    document.getElementById("main-pph").innerText = player.pph.toLocaleString();
    document.getElementById("mine-pph-display").innerText = player.pph.toLocaleString();
    document.getElementById("game-level").innerText = player.level;
    document.getElementById("main-tap-power").innerText = player.tapPower;
    document.getElementById("current-energy").innerText = Math.floor(player.energy);
    document.getElementById("max-energy").innerText = player.maxEnergy;
    
    // Профиль
    document.getElementById("prof-taps").innerText = player.totalTaps;
    document.getElementById("prof-lvl").innerText = player.level;

    // Шкала энергии
    const energyPct = (player.energy / player.maxEnergy) * 100;
    document.getElementById("energyFill").style.width = `${energyPct}%`;
    
    saveGame();
}

function saveGame() {
    localStorage.setItem("fenix_player_save", JSON.stringify(player));
}

// --- ТАП МЕХАНИКА ---
document.getElementById("tapButton").addEventListener("click", (e) => {
    if (player.energy >= player.tapPower) {
        player.energy -= player.tapPower;
        player.balance += player.tapPower;
        player.totalTaps++;
        
        // Всплывающий текст коинов +125
        createFloatingText(e.clientX, e.clientY, `+${player.tapPower}`);
        updateUI();
    }
});

function createFloatingText(x, y, text) {
    const el = document.createElement("div");
    el.className = "floating-coin";
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// --- ПАССИВНЫЙ ДОХОД И РЕГЕНЕРАЦИЯ ЭНЕРГИИ ---
setInterval(() => {
    // Доход в секунду = доход в час / 3600
    player.balance += (player.pph / 3600);
    
    // Регенерация энергии +3 в сек
    if (player.energy < player.maxEnergy) {
        player.energy = Math.min(player.maxEnergy, player.energy + 3);
    }
    updateUI();
}, 1000);

// --- СИСТЕМА МАГАЗИНА (МАЙНИНГ) ---
function renderCards(filterCategory = "all") {
    const container = document.getElementById("cardsContainer");
    container.innerHTML = "";

    INITIAL_CARDS.forEach(cardData => {
        if (filterCategory !== "all" && cardData.category !== filterCategory) return;

        const currentLvl = player.cards[cardData.id] || 0;
        // Прогрессивный расчет цены и доходности в зависимости от лвл карточки
        const currentCost = Math.floor(cardData.baseCost * Math.pow(1.5, currentLvl));
        const currentPPHGain = Math.floor(cardData.basePPH * Math.pow(1.2, currentLvl));

        const cardEl = document.createElement("div");
        cardEl.className = "mineCard";
        cardEl.innerHTML = `
            <div class="cardTitle">⚙️ ${cardData.name}</div>
            <div class="cardInfo">Lvl ${currentLvl} | +${currentPPHGain}/ч</div>
            <button class="buyCardBtn" ${player.balance < currentCost ? 'disabled' : ''}>
                🪙 ${currentCost.toLocaleString()}
            </button>
        `;

        // Клик покупки
        cardEl.querySelector("button").addEventListener("click", () => {
            if (player.balance >= currentCost) {
                player.balance -= currentCost;
                player.cards[cardData.id]++;
                player.pph += currentPPHGain;
                
                checkCombo(cardData.id);
                renderCards(filterCategory);
                updateUI();
            }
        });

        container.appendChild(cardEl);
    });
}

// --- ПРОВЕРКА DAILY COMBO ---
function checkCombo(cardId) {
    if (player.claimedCombo) return;
    
    if (DAILY_COMBO_IDS.includes(cardId) && !player.currentComboAnswers.includes(cardId)) {
        player.currentComboAnswers.push(cardId);
        
        // Отрендерить плашки на экране
        const slots = document.getElementById("mine-combo-slots").children;
        const index = player.currentComboAnswers.length - 1;
        if(slots[index]) {
            slots[index].innerText = "✅";
            slots[index].style.background = "#4caf50";
        }

        // Если собрал все 3 уникальные нужные карточки
        if (player.currentComboAnswers.length === 3) {
            player.balance += 5000000;
            player.claimedCombo = true;
            document.getElementById("screen-combo-details").classList.add("active");
        }
    }
}

// Переключение табов категорий карточек
document.querySelectorAll(".mineTab").forEach(tab => {
    tab.addEventListener("click", (e) => {
        document.querySelectorAll(".mineTab").forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        renderCards(e.target.getAttribute("data-category"));
    });
});

// --- НАВИГАЦИЯ МЕЖДУ ЭКРАНАМИ ---
document.querySelectorAll(".navBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const button = e.currentTarget;
        document.querySelectorAll(".navBtn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

        button.classList.add("active");
        const screenId = `screen-${button.getAttribute("data-screen")}`;
        document.getElementById(screenId).classList.add("active");

        if(button.getAttribute("data-screen") === "mine") {
            renderCards();
        }
    });
});

// --- ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ И АДМИНКА ---
document.getElementById("open-admin").addEventListener("click", () => {
    document.getElementById("screen-admin").classList.add("active");
});
document.getElementById("adm-close").addEventListener("click", () => {
    document.getElementById("screen-admin").classList.remove("active");
});
document.getElementById("adm-give-money").addEventListener("click", () => {
    player.balance += 1000000;
    updateUI();
});
document.getElementById("adm-reset").addEventListener("click", () => {
    localStorage.removeItem("fenix_player_save");
    location.reload();
});

function claimTask(reward, btn) {
    player.balance += reward;
    btn.disabled = true;
    btn.innerText = "CLAIMED";
    updateUI();
}

// ПВП Логика заглушка
document.getElementById("pvp-search-btn").addEventListener("click", () => {
    const log = document.getElementById("pvp-log");
    log.innerText = "Поиск соперника...";
    setTimeout(() => {
        const win = Math.random() > 0.4;
        if(win) {
            player.balance += 50000;
            log.innerHTML = "<span style='color:#4caf50'>Победа! Вы выиграли 50,000 коинов!</span>";
        } else {
            log.innerHTML = "<span style='color:#f44336'>Поражение! Попробуйте еще раз.</span>";
        }
        updateUI();
    }, 1500);
});

// --- СТАРТ ИГРЫ ---
window.onload = () => {
    setTimeout(() => {
        document.getElementById("loader").style.display = "none";
    }, 600);
    updateUI();
};