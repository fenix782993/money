// Проверка Telegram WebApp API
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();
const user = tg?.initDataUnsafe?.user || { id: 88888, first_name: "WebFenix" };

// Спецификация стадий эволюции Феникса (до 600 уровней)
const SKINS = [
    { min: 1, max: 10, name: "Яйцо Феникса", icon: "🥚", mult: 1.0 },
    { min: 11, max: 50, name: "Птенец", icon: "🐥", mult: 1.4 },
    { min: 51, max: 150, name: "Молодой Ястреб", icon: "🦅", mult: 2.0 },
    { min: 151, max: 350, name: "Огненный Феникс", icon: "🔥", mult: 3.5 },
    { min: 351, max: 600, name: "Бессмертный Лорд", icon: "👑", mult: 6.0 }
];

// Массив карточек майнинга
const CARDS = [
    { id: "farm", name: "Bitcoin Farm", cost: 1000, pph: 80, cat: "market" },
    { id: "node", name: "Solana Node", cost: 5000, pph: 450, cat: "market" },
    { id: "law", name: "Лицензия ЕС", cost: 8000, pph: 700, cat: "legal" },
    { id: "team", name: "Топ Разработчик", cost: 15000, pph: 1500, cat: "team" }
];

// Глобальные промокоды системы
let sysPromos = { "START2026": 25000, "WEBFENIX": 100000 };

// СБРОШЕННОЕ СОСТОЯНИЕ ИГРОКА (СТРОГО С НУЛЯ!)
let p = {
    balance: 0,
    pph: 0,
    level: 1,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 1,
    totalTaps: 0,
    cards: {},
    usedPromos: [],
    isBanned: false
};

// Загрузка сейвов из локальной памяти
const saved = localStorage.getItem(`fenix_v2_${user.id}`);
if (saved) {
    p = JSON.parse(saved);
}

function save() {
    if (p.isBanned) return;
    localStorage.setItem(`fenix_v2_${user.id}`, JSON.stringify(p));
}

function getCurrentSkin() {
    return SKINS.find(s => p.level >= s.min && p.level <= s.max) || SKINS[SKINS.length - 1];
}

// ОБНОВЛЕНИЕ ВСЕГО ИНТЕРФЕЙСА
function updateUI() {
    if (p.isBanned) {
        document.body.innerHTML = "<div style='color:red; text-align:center; padding-top:30vh; font-size:20px; font-weight:bold;'>🚫 Ваш аккаунт забанен!</div>";
        return;
    }

    const skin = getCurrentSkin();
    const finalTap = Math.floor(p.tapPower * skin.mult);

    document.getElementById("user-name").innerText = user.first_name;
    document.getElementById("coins").innerText = Math.floor(p.balance).toLocaleString();
    document.getElementById("main-balance").innerText = Math.floor(p.balance).toLocaleString();
    document.getElementById("lvl").innerText = p.level;
    document.getElementById("stage-title").innerText = skin.name;
    document.getElementById("pph").innerText = p.pph.toLocaleString();
    document.getElementById("mine-pph-display").innerText = p.pph.toLocaleString();
    document.getElementById("tap-power").innerText = finalTap;
    document.getElementById("stat-taps").innerText = p.totalTaps;
    document.getElementById("energy-val").innerText = Math.floor(p.energy);
    document.getElementById("energy-max").innerText = p.maxEnergy;
    document.getElementById("tapBtn").innerText = skin.icon;

    document.getElementById("energyFill").style.width = (p.energy / p.maxEnergy * 100) + "%";
    save();
}

// КЛИКЕР (ТАП)
document.getElementById("tapBtn").addEventListener("click", () => {
    const skin = getCurrentSkin();
    const finalTap = Math.floor(p.tapPower * skin.mult);

    if (p.energy >= finalTap) {
        p.energy -= finalTap;
        p.balance += finalTap;
        p.totalTaps++;
        updateUI();
    }
});

// ПАССИВНЫЙ ТИК И РЕГЕНЕРАЦИЯ ЭНЕРГИИ (Каждую секунду)
setInterval(() => {
    p.balance += (p.pph / 3600);
    if (p.energy < p.maxEnergy) {
        p.energy = Math.min(p.maxEnergy, p.energy + 3);
    }
    updateUI();
}, 1000);

// НАВИГАЦИЯ (ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК)
function switchTab(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

    document.getElementById(`screen-${screenId}`).classList.add("active");
    
    // Подсветка кнопки таббара
    const btn = Array.from(document.querySelectorAll(".nav-btn")).find(b => b.getAttribute("onclick").includes(screenId));
    if (btn) btn.classList.add("active");

    if (screenId === 'mine') renderCards();
    if (screenId === 'profile') renderSkins();
}

// РЕНДЕР КАРТОЧЕК МАГАЗИНА
function renderCards(filter = "all") {
    const grid = document.getElementById("cards-grid");
    grid.innerHTML = "";

    CARDS.forEach(c => {
        if (filter !== "all" && c.cat !== filter) return;
        const lvl = p.cards[c.id] || 0;
        const cost = Math.floor(c.cost * Math.pow(1.6, lvl));
        const pphGain = Math.floor(c.pph * Math.pow(1.3, lvl));

        const card = document.createElement("div");
        card.className = "mine-card";
        card.innerHTML = `
            <h4>${c.name}</h4>
            <p>Lvl ${lvl} | +${pphGain}/ч</p>
            <button class="buyCardBtn" ${p.balance < cost ? 'disabled' : ''}>🪙 ${cost.toLocaleString()}</button>
        `;

        card.querySelector("button").addEventListener("click", () => {
            if (p.balance >= cost) {
                p.balance -= cost;
                p.cards[c.id] = lvl + 1;
                p.pph += pphGain;
                renderCards(filter);
                updateUI();
            }
        });
        grid.appendChild(card);
    });
}
function filterCards(cat) {
    document.querySelectorAll(".tab-sub").forEach(b => b.classList.remove("active"));
    event.currentTarget.classList.add("active");
    renderCards(cat);
}

// ПРОМОКОДЫ ДЛЯ ЮЗЕРА
document.getElementById("activate-promo-btn").addEventListener("click", () => {
    const val = document.getElementById("promo-input").value.trim().toUpperCase();
    if (p.usedPromos.includes(val)) return alert("Уже активирован!");
    if (sysPromos[val]) {
        p.balance += sysPromos[val];
        p.usedPromos.push(val);
        document.getElementById("promo-input").value = "";
        updateUI();
        alert("Успешно! Деньги начислены.");
    } else {
        alert("Промокод не найден!");
    }
});

// ПРОВЕРКА СЕКРЕТНОГО КЛЮЧА АДМИНИСТРАТОРА
document.getElementById("check-secret-btn").addEventListener("click", () => {
    const input = document.getElementById("secret-input").value;
    if (input === "webFenix1221") {
        switchTab("admin");
        document.getElementById("secret-input").value = "";
    } else {
        alert("Неверный ключ разработчика!");
    }
});

// ГАРДЕРОБ СКИНОВ
function renderSkins() {
    const container = document.getElementById("skins-container");
    container.innerHTML = "";
    SKINS.forEach(s => {
        const opened = p.level >= s.min;
        const div = document.createElement("div");
        div.className = `skin-item ${!opened ? 'locked' : ''}`;
        div.innerHTML = `<div style="font-size:24px">${opened ? s.icon : '🔒'}</div><div style="font-size:10px">${s.name}</div>`;
        container.appendChild(div);
    });
}

// --- ЛОГИКА 15 ФУНКЦИЙ АДМИН-ПАНЕЛИ ---
function admAddCoins(amt) { p.balance = Math.max(0, p.balance + amt); updateUI(); }
function admClearCoins() { p.balance = 0; updateUI(); }
function admSetLvl(l) { p.level = l; updateUI(); renderSkins(); }
function admAddTaps(t) { p.totalTaps += t; updateUI(); }
function admDoubleTap() { p.tapPower *= 2; updateUI(); }
function admGodEnergy() { p.maxEnergy = 100000; p.energy = 100000; updateUI(); }
function admAddPPH(val) { p.pph += val; updateUI(); }
function admMassReward() { p.balance += 50000; updateUI(); alert("Массовый бонус отправлен!"); }
function admToggleBan() { p.isBanned = !p.isBanned; updateUI(); }
function admWipePromos() { sysPromos = {}; alert("Промокоды очищены."); }
function admCreatePromo() {
    const name = document.getElementById("adm-p-name").value.trim().toUpperCase();
    const gift = parseInt(document.getElementById("adm-p-gift").value);
    if(name && gift) { sysPromos[name] = gift; alert(`Создан промокод ${name}`); }
}
function admHardReset() {
    localStorage.clear();
    location.reload();
}

// СТАРТ
window.onload = () => {
    setTimeout(() => document.getElementById("loader").style.display = "none", 500);
    updateUI();
};