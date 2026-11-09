@echo off
chcp 65001 >nul
title Telegram-бот расписания КБК (@SugiSai_bot)
cd /d "%~dp0"

echo ================================================================
echo     КБК • Telegram-бот расписания (@SugiSai_bot)
echo ================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не установлен! Установите Node.js с https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js найден.
echo [INFO] Запуск сервера и Telegram-бота...
echo        Веб-интерфейс: http://localhost:3000
echo        Telegram: @SugiSai_bot
echo.

npm run dev
pause
