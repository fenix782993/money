const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const tgUser = tg?.initDataUnsafe?.user || { id: 77777, first_name: "Fenix Player" };

function getSecureHash(data) {
    return btoa(encodeURIComponent(JSON.stringify(data)));
}

const PHOENIX_SKINS = [
    { minLvl: 1, maxLvl: 10, name: "Яйцо Феникса", icon: "🥚", mult: 1.0 },
    { minLvl: 11, maxLvl: 50, name: "Птенец", icon: "🐥", mult: 1.2 },
    { minLvl: 51, maxLvl: 150, name: "Молодой Феникс", icon: "🦅", mult: 1.5 },
    { minLvl: 151, maxLvl: 300, name: "Огненный Ястреб", icon: "🔥", mult: 2.0 },
    { minLvl: 301, maxLvl: 500, name: "Магический Лорд", icon: "👑", mult: 3.0 },
    { minLvl: 501, maxLvl: 600, name: "Бессмертный Феникс", icon: "🔱", mult: 5.0 }
];

// ЧИСТЫЙ СТАРТ: По умолчанию у всех игроков всё начинается с НУЛЯ (0)
let player = {
    id: tgUser.id,
    name: tgUser.first_name,
    balance: 0,
    pph: 0,
    level: 1,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 1,
    totalTaps: 0,
    cards: {},
    isBanned: false,
    usedPromos: []
};

// Хранилище промокодов на сессию (симуляция БД)
let globalPromos = JSON.parse(localStorage.getItem("fenix_global_promos")) || {
    "START2026": 50000,
    "WEBFENIX": 100000
};

// Загрузка локальных сохранений
const localSave = localStorage.getItem(`fenix_save_${player.id}`);
const localHash = localStorage.getItem(`fenix_hash_${player.id}`);
if (localSave && localHash) {
    if (getSecureHash(JSON.parse(localSave)) === localHash) {
        player = JSON.parse(localSave);
    }
}

function saveGame() {
    if(player.isBanned) return;
    localStorage.setItem(`fenix_save_${player.id}`, JSON.stringify(player));
    localStorage.setItem(`fenix_hash_${player.id}`, getSecureHash(player));
    localStorage.setItem("fenix_global_promos", JSON.stringify(globalPromos));
}

function getSkinByLevel(lvl) {
    return PHOENIX_SKINS.find(s => lvl >= s.minLvl && lvl <= s.maxLvl) || PHOENIX_SKINS[PHOENIX_SKINS.length - 1];
}

function updateUI() {
    if (player.isBanned) {
        document.body.innerHTML = "<div style='color:#f44336; text-align:center; padding-top:20%; font-size:24px; font-family:sans-serif;'>🚫 Ваш аккаунт заблокирован администратором!</div>";
        return;
    }

    const currentSkin = getSkinByLevel(player.level);
    
    document.getElementById("nickname").innerText = player.name;
    document.getElementById("game-level").innerText = player.level;
    document.getElementById("phoenix-title").innerText = currentSkin.name;
    document.getElementById("top-balance").innerText = Math.floor(player.balance).toLocaleString();
    document.getElementById("main-balance").innerText = Math.floor(player.balance).toLocaleString();
    document.getElementById("main-pph").innerText = player.pph.toLocaleString();
    document.getElementById("main-tap-power").innerText = Math.floor(player.tapPower * currentSkin.mult);
    document.getElementById("current-energy").innerText = Math.floor(player.energy);
    document.getElementById("max-energy").innerText = player.maxEnergy;
    document.getElementById("phoenixRender").innerText = currentSkin.icon;
    
    document.getElementById("prof-taps").innerText = player.totalTaps;
    document.getElementById("prof-lvl").innerText = player.level;
    document.getElementById("prof-mult").innerText = `x${currentSkin.mult}`;

    const energyPct = (player.energy / player.maxEnergy) * 100;
    document.getElementById("energyFill").style.width = `${energyPct}%`;
    
    saveGame();
}

// Тапы
document.getElementById("tapButton").addEventListener("click", () => {
    const currentSkin = getSkinByLevel(player.level);
    const finalTap = Math.floor(player.tapPower * currentSkin.mult);
    
    if (player.energy >= finalTap) {
        player.energy -= finalTap;
        player.balance += finalTap;
        player.totalTaps++;
        updateUI();
    }
});

// Доход в секунду
setInterval(() => {
    player.balance += (player.pph / 3600);
    if (player.energy < player.maxEnergy) {
        player.energy = Math.min(player.maxEnergy, player.energy + 2);
    }
    updateUI();
}, 1000);

// --- ВХОД В АДМИНКУ ПО СЕКРЕТНОМУ КЛЮЧУ ---
document.getElementById("open-admin-btn").addEventListener("click", () => {
    const key = document.getElementById("secret-key-input").value;
    if (key === "webFenix1221") {
        document.getElementById("screen-admin").classList.add("active");
        document.getElementById("secret-key-input").value = "";
    } else {
        alert("❌ Неверный секретный ключ доступа!");
    }
});
document.getElementById("adm-close").addEventListener("click", () => {
    document.getElementById("screen-admin").classList.remove("active");
});

// --- АКТИВАЦИЯ ПРОМОКОДОВ ИГРОКОМ ---
document.getElementById("user-promo-btn").addEventListener("click", () => {
    const code = document.getElementById("user-promo-input").value.trim().toUpperCase();
    if (!code) return;

    if (player.usedPromos.includes(code)) {
        alert("❌ Вы уже активировали этот промокод!");
        return;
    }

    if (globalPromos[code] !== undefined) {
        const reward = globalPromos[code];
        player.balance += reward;
        player.usedPromos.push(code);
        document.getElementById("user-promo-input").value = "";
        updateUI();
        alert(`🎁 Промокод успешно активирован! Начислено: +${reward.toLocaleString()} коинов!`);
    } else {
        alert("❌ Такого промокода не существует!");
    }
});

// --- РЕАЛИЗАЦИЯ 15 ФУНКЦИЙ АДМИН-ПАНЕЛИ ---
document.getElementById("adm-give-1m").addEventListener("click", () => { player.balance += 1000000; updateUI(); });
document.getElementById("adm-give-100m").addEventListener("click", () => { player.balance += 100000000; updateUI(); });
document.getElementById("adm-take-1m").addEventListener("click", () => { player.balance = Math.max(0, player.balance - 1000000); updateUI(); });
document.getElementById("adm-wipe-balance").addEventListener("click", () => { player.balance = 0; updateUI(); alert("Баланс обнулен!"); });

document.getElementById("adm-set-lvl").addEventListener("click", () => {
    const val = parseInt(document.getElementById("adm-lvl-input").value);
    if (!isNaN(val) && val >= 1 && val <= 600) {
        player.level = val; updateUI(); renderSkins();
    }
});
document.getElementById("adm-max-lvl").addEventListener("click", () => { player.level = 600; updateUI(); renderSkins(); alert("Установлен 600 уровень!"); });
document.getElementById("adm-add-10k-taps").addEventListener("click", () => { player.totalTaps += 10000; updateUI(); });
document.getElementById("adm-boost-tap-power").addEventListener("click", () => { player.tapPower *= 2; updateUI(); alert("Базовая сила тапа умножена на 2!"); });

document.getElementById("adm-create-promo").addEventListener("click", () => {
    const name = document.getElementById("adm-promo-name").value.trim().toUpperCase();
    const reward = parseInt(document.getElementById("adm-promo-reward").value);
    if(name && !isNaN(reward)) {
        globalPromos[name] = reward;
        saveGame();
        alert(`Промокод ${name} на сумму ${reward} создан!`);
        document.getElementById("adm-promo-name").value = "";
        document.getElementById("adm-promo-reward").value = "";
    }
});
document.getElementById("adm-clear-promos").addEventListener("click", () => { globalPromos = {}; saveGame(); alert("Все промокоды удалены!"); });

document.getElementById("adm-infinite-energy").addEventListener("click", () => { player.maxEnergy = 100000; player.energy = 100000; updateUI(); });
document.getElementById("adm-add-pph").addEventListener("click", () => { player.pph += 50000; updateUI(); });
document.getElementById("adm-mass-reward").addEventListener("click", () => { player.balance += 50000; updateUI(); alert("Всем отправлено по 50,000 коинов!"); });
document.getElementById("adm-toggle-ban").addEventListener("click", () => { player.isBanned = !player.isBanned; updateUI(); });

// 15-я критическая функция: Жесткий сброс всей базы данных
document.getElementById("adm-hard-reset").addEventListener("click", () => {
    if(confirm("Вы уверены, что хотите полностью стереть данные? Всё начнется с НУЛЯ.")) {
        localStorage.clear();
        location.reload();
    }
});

// Навигация между вкладками приложения
document.querySelectorAll(".navBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll(".navBtn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        e.currentTarget.classList.add("active");
        const target = `screen-${e.currentTarget.getAttribute("data-screen")}`;
        document.getElementById(target).classList.add("active");
        if(target === "screen-profile") renderSkins();
    });
});

function renderSkins() {
    const container = document.getElementById("skins-container");
    container.innerHTML = "";
    PHOENIX_SKINS.forEach((skin) => {
        const isUnlocked = player.level >= skin.minLvl;
        const card = document.createElement("div");
        card.className = `skinItem ${!isUnlocked ? 'locked' : ''}`;
        card.innerHTML = `
            <div style="font-size:32px;">${isUnlocked ? skin.icon : "🔒"}</div>
            <div style="font-size:11px; font-weight:bold; margin-top:5px;">${skin.name}</div>
            <div style="font-size:9px; color:var(--text-muted)">Lvl ${skin.minLvl}+</div>
        `;
        container.appendChild(card);
    });
}

window.onload = () => {
    setTimeout(() => document.getElementById("loader").style.display = "none", 600);
    updateUI();
};