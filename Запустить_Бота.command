#!/bin/bash
# =============================================================================
# Лаунчер Telegram-бота расписания КБК (Калининградский бизнес-колледж)
# Режим: работа с выключенным экраном и закрытой крышкой (Anti-Sleep)
# =============================================================================

# Переход в папку проекта
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Добавляем стандартные пути Homebrew и Node в PATH
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

clear
echo "================================================================"
echo "    КБК • Telegram-бот расписания (@SugiSai_bot)"
echo "================================================================"
echo ""

# 1. Проверка наличия Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Ошибка: Node.js не найден."
    echo "Установите Node.js (https://nodejs.org) или выполните 'brew install node'."
    echo ""
    read -p "Нажмите Enter для выхода..."
    exit 1
fi

NODE_VER=$(node -v)
echo "✅ Node.js: $NODE_VER"

# 2. Проверка файла .env
if [ ! -f ".env" ]; then
    echo "⚠️ Файл .env не найден. Создаем из .env.example..."
    cp .env.example .env 2>/dev/null || touch .env
fi

# 3. Проверка и освобождение порта 3000 при необходимости
OLD_PID=$(lsof -ti :3000 2>/dev/null)
if [ -n "$OLD_PID" ]; then
    echo "ℹ️ Порт 3000 занят процессом PID $OLD_PID. Перезапускаем..."
    kill -9 $OLD_PID 2>/dev/null
    sleep 1
fi

# 4. Настройка режима сна при закрытой крышке (Clamshell / Anti-Sleep)
RESTORE_SLEEP=0

cleanup() {
    echo ""
    echo "🛑 Остановка бота..."
    if [ "$RESTORE_SLEEP" -eq 1 ]; then
        echo "🔄 Восстановление стандартного режима сна macOS..."
        sudo pmset -a disablesleep 0 >/dev/null 2>&1
    fi
    # Завершаем дочерние процессы
    kill $(jobs -p) 2>/dev/null
    echo "✅ Бот остановлен. До свидания!"
    exit 0
}

trap cleanup EXIT INT TERM

echo ""
echo "----------------------------------------------------------------"
echo " РЕЖИМ РАБОТЫ: ЗАКРЫТАЯ КРЫШКА И ВЫКЛЮЧЕННЫЙ ЭКРАН"
echo "----------------------------------------------------------------"
echo "Чтобы бот не засыпал при закрытии крышки MacBook, macOS требует"
echo "разрешение на отключение режима сна (disablesleep = 1)."
echo ""
read -p "Включить работу при закрытой крышке? (y/n, по умолчанию y): " ENABLE_CLAMSHELL
ENABLE_CLAMSHELL=${ENABLE_CLAMSHELL:-y}

if [[ "$ENABLE_CLAMSHELL" =~ ^[YyДд]$ ]]; then
    echo "Запрос прав администратора для отключения сна крышки..."
    if sudo pmset -a disablesleep 1; then
        RESTORE_SLEEP=1
        echo "✅ Режим работы с закрытой крышкой ВКЛЮЧЕН."
        echo "   (При остановке бота стандартный режим сна восстановится автоматически)"
    else
        echo "⚠️ Не удалось применить sudo pmset. Будет использоваться стандартный caffeinate."
    fi
else
    echo "ℹ️ Пропущено. Бот будет работать с выключенным экраном, но при закрытии крышки может уснуть."
fi

echo ""
echo "================================================================"
echo " 🚀 Запуск сервера и Telegram-бота..."
echo "    • Веб-интерфейс: http://localhost:3000"
echo "    • Telegram: @SugiSai_bot"
echo "    • Экран может гаснуть, крышку можно закрывать."
echo "    • Рекомендуется подключить MacBook к зарядному устройству."
echo "    • Для остановки нажмите Ctrl + C"
echo "================================================================"
echo ""

# Запуск через caffeinate:
# -s: предотвращает системный сон на питании
# -i: предотвращает сон по таймеру бездействия
# -m: предотвращает засыпание диска
caffeinate -s -i -m npx tsx server.ts
