import os
import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.utils.keyboard import InlineKeyboardBuilder

# Токен берется из вкладки "Переменные" в Amvera
BOT_TOKEN = os.getenv("BOT_TOKEN")
# Твоя рабочая ссылка на кликер с GitHub!
WEBAPP_URL = "https://fenix782993.github.io/money/"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(F.text == "/start")
async def start_game(message: types.Message):
    kb = InlineKeyboardBuilder()
    kb.button(
        text="🔥 ИГРАТЬ В FENIX COMBAT", 
        web_app=types.WebAppInfo(url=WEBAPP_URL)
    )
    
    await message.answer(
        f"🦅 Привет, {message.from_user.first_name}! Добро пожаловать в Fenix Combat!\n\n"
        f"Тапай по Фениксу, зарабатывай FenixCoin (FXC) и качай пассивный доход!\n\n"
        f"Жми кнопку ниже 👇",
        reply_markup=kb.as_markup()
    )

async def main():
    print("🟢 Бот успешно запущен на сервере Amvera и готов к работе!")
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())