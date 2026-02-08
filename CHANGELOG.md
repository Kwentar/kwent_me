# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-02-08
### Added
- **Infrastructure:**
    - Docker Compose for production and local testing.
    - Nginx reverse proxy with SSL support (via LetsEncrypt).
    - **OAuth2 Proxy** for Google Authentication protection.
    - GitHub Actions for CI/CD (build & deploy).
- **Apps:**
    - **Identity Service (`/me`)**: Microservice to verify user identity and debug headers.
    - **Notes App (`/notes`)**:
        - Frontend: React + Vite + TailwindCSS + TipTap (WYSIWYG & Markdown support).
        - Backend: Fastify + PostgreSQL.
        - Features: Create, edit, delete notes; real-time saving; syntax highlighting.
- **Security:**
    - Full site protection via Google OAuth2.
    - User email verification in backends.
    - SSH key-based deployment.

### Changed
- Migrated from Cloudflare Access to self-hosted OAuth2 Proxy for better performance in RU region.
- Configured Nginx to pass authenticated user headers (`Cf-Access-Authenticated-User-Email`) to downstream apps.
