# Проект kwent.me

Личный сайт-хаб для разрозненных инструментов.

## Сервер
- **IP:** `SERVER_IP` (см. GitHub Secrets)
- **ОС:** Ubuntu 24.04.1 LTS (Noble Numbat)
- **Domain:** [kwent.me](https://kwent.me)

## Архитектура
- **Nginx (Host):** Принимает HTTPS, раздает статику главной страницы и фронтенд приложений.
- **OAuth2 Proxy (Docker):** Обеспечивает авторизацию через Google.
- **Приложения (Docker):** Бэкенды и микросервисы (Fastify, Node.js).
- **База данных (Docker):** PostgreSQL 17.

## Авторизация
Доступ к путям `/me` и `/notes` ограничен через Google OAuth.
- Разрешенные email-адреса хранятся в `emails.txt`.
- Бэкенды получают email пользователя в заголовке `Cf-Access-Authenticated-User-Email`.

## Деплой (CI/CD)
Деплой автоматизирован через **GitHub Actions** и срабатывает **только при создании тега** (релиза).

---

## ⚠️ Важное ограничение для AI-ассистента
**Мне (Gemini) запрещено запускать серверы** (`npm run dev`, `docker compose up` и т.д.), так как это блокирует мою работу или приводит к ошибкам окружения.
Если для тестирования или работы нужен запущенный сервер — **я должен попросить тебя запустить его вручную**.

**ВАЖНО: НИКОГДА НЕ УДАЛЯТЬ ДАННЫЕ ЗАМЕТОК ПОЛЬЗОВАТЕЛЕЙ.** При миграциях базы данных или изменениях конфигурации всегда проверять, что существующие данные в `notes_postgres_data` сохранены и защищены от перезаписи.

---

## Как запускать

### 1. Локальная разработка (Dev)
Самый быстрый способ править код без Docker-прослоек.

**Frontend (Notes):**
```bash
cd notes/frontend
npm install
# Проси пользователя запустить: npm run dev
# Откроется на http://localhost:5173/notes/
```

**Backend (Notes):**
```bash
cd notes/backend
npm install
# Проси пользователя поднять БД и запустить: npm run dev
npm run dev
```
*Примечание: Локально бэкенд автоматически использует `alekseev.yeskela@gmail.com`, если запрос идет с localhost.*

### 2. Локальный тест "как на проде" (Integration)
Имитация работы Nginx, OAuth2 Proxy и всех контейнеров.

```bash
# 1. Собрать фронтенд
cd notes/frontend && npm run build && cd ../..

# 2. Проси пользователя запустить:
# docker compose -f docker-compose.local-test.yml up --build
```
*Доступно на http://localhost:8080*

### 3. Продакшен
Просто пуш в репозиторий:
```bash
git add .
git commit -m "Your changes"
git push origin master
```

---

## Локальное тестирование с заглушкой email
Если нужно поменять "фейкового" юзера для локальных тестов, это делается в `notes/backend/src/index.ts` в функции `getUserId`:

```typescript
if (!email && (req.headers.host?.includes('localhost') ...)) {
  email = 'alekseev.yeskela@gmail.com' // Поменяй здесь
}
```