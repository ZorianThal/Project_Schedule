#!/bin/bash
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:./node_modules/.bin:$PATH"

clear
echo "================================================================"
echo "    Деплой Telegram Proxy на Vercel"
echo "================================================================"
echo ""
echo "Сейчас запустится деплой на Vercel."
echo "Если вы запускаете первый раз, Vercel предложит войти через браузер."
echo "Нажмите Enter для продолжения..."
read

./node_modules/.bin/vercel --prod

echo ""
echo "================================================================"
echo "Скопируйте строку 'Production: https://...vercel.app'"
echo "и пропишите эту ссылку в .env в поле TELEGRAM_API_BASE"
echo "================================================================"
read -p "Нажмите Enter для завершения..."
