import os
import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.default import DefaultBotProperties

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = "https://fenix782993.github.io/money/"

# Добавляем увеличенный таймаут для запросов к Telegram
session = AiohttpSession(timeout=60.0)

bot = Bot(
    token=BOT_TOKEN, 
    session=session, 
    default=DefaultBotProperties(parse_mode="HTML")
)
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
    
    # Бесконечный цикл перезапуска на случай падения сети
    while True:
        try:
            await dp.start_polling(bot, skip_updates=True)
        except Exception as e:
            print(f"⚠️ Ошибка сети: {e}. Повторный запуск через 5 секунд...")
            await asyncio.sleep(5)

if __name__ == '__main__':
    asyncio.run(main())
