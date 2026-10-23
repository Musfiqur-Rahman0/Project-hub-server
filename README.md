"# Project-hub-server

## Seed demo data

Configure `DATABASE_URL`, then run `npm run seed` from the `server` directory.
The seed is safe to run more than once and refuses to run when
`NODE_ENV=production`. It creates demo student, mentor, and admin accounts plus
sample submissions.

All demo accounts use `ProjectHub123!` by default. Set `SEED_PASSWORD` to use a
different password."
