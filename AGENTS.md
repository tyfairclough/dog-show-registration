# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 14 (App Router) app: **Essex Therapy Dogs – Fun Dog Show Registration** (`dog-show-registration`). It serves both the public registration UI (`/`, `/register`) and an authenticated admin back-office (`/admin`). Data is stored in **MySQL/MariaDB** via Prisma 7 (MariaDB driver adapter). See `README.md` for the standard command list (`npm run dev|build|start|lint`, and Prisma helpers `db:push`/`db:migrate:deploy`/`db:studio`).

### Services

| Service | Port | Notes |
|---|---|---|
| Next.js dev server | 3000 | `npm run dev` |
| MariaDB | 3306 | Local DB `dog_show`, user `dogshow`/`dogshowpass` |

### Startup caveats (do this each fresh session — the update script only installs npm deps)

- **MariaDB is not auto-started.** Start it before running the app: `sudo mariadbd-safe --datadir=/var/lib/mysql &` (wait ~8s, verify with `sudo mariadb -e "SELECT VERSION();"`). The data dir and the `dog_show` schema persist in the VM snapshot.
- **`.env.local` holds local config** (git-ignored, persists in the snapshot): `DATABASE_URL` (points at `dog_show`), `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`. `prisma.config.ts` loads it, so any Prisma CLI command (and the `postinstall` `prisma generate`) needs it present — without `DATABASE_URL` those commands throw `Cannot resolve environment variable`.
- **`ADMIN_PASSWORD_HASH` must have every `$` escaped as `\$`** in `.env.local` (e.g. `"\$2b\$10\$..."`). Next.js runs dotenv-expand, which otherwise eats the bcrypt `$…` segments; the login route un-escapes `\$` back to `$`. Local admin login is `admin` / `dogshow26!` (`scripts/generate-password-hash.js` regenerates the hash for that password).
- **Env changes require a dev-server restart** — Next.js reads `.env.local` at process start, not via hot reload.

### Email is optional and NOT configured locally

Confirmation emails go through **Mailtrap** (external SaaS). Locally `MAILTRAP_API_TOKEN` / `MAILTRAP_SANDBOX_INBOX_ID` are unset, so submitting a registration shows the banner "Failed to send confirmation email due to email configuration." **This is expected — the registration (owner/dog/registration rows) is still saved.** To verify a submitted registration, check the admin portal's "Manage Registrations" tab or query the DB directly. To exercise real email, set `MAILTRAP_API_TOKEN` + `MAILTRAP_SANDBOX_INBOX_ID` + `EMAIL_FROM`.

### Other notes

- Apply/refresh schema with `npm run db:push` (no committed seed data; create show classes via the admin portal or `POST /api/classes`).
- `npm run db:studio` (Prisma Studio v7) may show a "Could not load schema metadata … a.sort is not a function" error — a known Studio-only issue; the app and CLI are unaffected.
- PDF generation endpoints use Puppeteer/Chromium (bundled by the `puppeteer` npm package); only needed for the PDF/print features.
