# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-02-08
### Added
- **New App: Imedit (`/imedit`)**: 
    - Simple client-side screenshot editor.
    - Tools: Brush, Rectangle (with dynamic border size), Marker (Multiply), Crop (with YOLO and interactive modes).
    - Features: Undo (Cmd+Z), Select All (Cmd+A) to clear, Download (with custom prefix), Copy to Clipboard (Cmd+C).
    - Centering and zoom support.
- **Navigation:**
    - Global Header added to all apps for easy switching.
    - Updated Main Page with Imedit entry point.

### Fixed
- Improved crop UI visibility with dashed guides.
- Replaced annoying alerts with non-intrusive toast notifications.
- Fixed drawing persistence issues across tool/color switches.

## [0.1.0] - 2026-02-08
### Added
- **Infrastructure:**
    - Docker Compose for production and local testing.
    - Nginx reverse proxy with SSL support.
    - OAuth2 Proxy for Google Authentication.
    - GitHub Actions for CI/CD.
- **Apps:**
    - Identity Service (`/me`)
    - Notes App (`/notes`)