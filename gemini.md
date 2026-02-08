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
Деплой автоматизирован через **GitHub Actions**. Любой пуш в ветку `master` (или `main`) запускает:
1. Сборку фронтенда.
2. Сборку и пуш Docker-образов в GHCR.
3. Обновление файлов на сервере по SSH.
4. Перезапуск контейнеров и перезагрузку Nginx.

### Необходимые Secrets в GitHub:
- `HOST`: IP сервера.
- `USERNAME`: root.
- `SSH_KEY`: Приватный ключ для доступа.
- `POSTGRES_PASSWORD`: Пароль для БД.
- `GOOGLE_CLIENT_ID`: Из Google Cloud Console.
- `GOOGLE_CLIENT_SECRET`: Из Google Cloud Console.
- `OAUTH2_PROXY_COOKIE_SECRET`: Случайная строка для сессий.

---

## Как запускать

### 1. Локальная разработка (Dev)
Самый быстрый способ править код без Docker-прослоек.

**Frontend (Notes):**
```bash
cd notes/frontend
npm install
npm run dev
# Откроется на http://localhost:5173/notes/
```

**Backend (Notes):**
```bash
cd notes/backend
npm install
# Нужен запущенный локальный Postgres или через Docker
docker run --name notes-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=kwent_notes -p 5432:5432 -d postgres:17-alpine
npm run dev
```
*Примечание: Локально бэкенд автоматически использует `dev@kwent.me`, если запрос идет с localhost.*

### 2. Локальный тест "как на проде" (Integration)
Имитация работы Nginx, OAuth2 Proxy и всех контейнеров.

```bash
# 1. Собрать фронтенд
cd notes/frontend && npm run build && cd ../..

# 2. Запустить стек (без Google Auth, так как нужен HTTPS)
docker-compose -f docker-compose.local-test.yml up --build
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
