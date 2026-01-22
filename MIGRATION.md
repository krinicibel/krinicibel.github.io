# Миграция на Vite (полная)

Кратко:
- Стратегия: pre-render partials (header/footer) + per-page entries (MPA).
- Деплой: GitHub Actions → GitHub Pages (официальный `upload-pages-artifact` + `deploy-pages`).

Основные команды (локально):
- Установить зависимости: `npm install`
- Запустить dev-сервер: `npm run dev` (разработка — Vite сервирует проект из корня и include-loader работает)
- Собрать production: `npm run build` (создаёт `dist/`)

Что сделано:
- Добавлен `vite` и скрипты в `package.json`.
- `scripts/inline-partials.js` — генерирует `tmp_site/` с inlined header/footer и per-page entry modules.
- `vite.config.mjs` (генерируется автоматически в `tmp_site`) — билд MPA через `rollupOptions.input`.
- `js/` — `menu.js` и `lightbox.js` конвертированы в ESM, добавлен `js/main.js` (общий модуль).
- `js/include.js` исправлен для корректной вставки module-скриптов (копирует атрибуты).
- Добавлен GitHub Actions workflow `.github/workflows/deploy.yml` для сборки и деплоя на Pages.

Замечания и рекомендации:
- Вариант A выбран правильно: pre-render даёт более предсказуемый HTML и меньший runtime‑код.
- При необходимости дальнейшей оптимизации — можно рефакторить отдельные страницы под свои entry-модули (на данный момент все entry импортируют `js/main.js`).

Если нужно, подготовлю PR с этими изменениями и/или дополнительную документацию/тесты (краткий пример проверки визуально в браузере).