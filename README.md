"# Project-hub-server

## Seed demo data

Configure `DATABASE_URL`, then run `npm run seed` from the `server` directory.
The seed is safe to run more than once and refuses to run when
`NODE_ENV=production`. It creates demo student, mentor, and admin accounts plus
sample submissions.

All demo accounts use `ProjectHub123!` by default. Set `SEED_PASSWORD` to use a
different password."

## Run API workflow tests

The integration tests use PostgreSQL and remove the test users and submissions
they create. Configure `DATABASE_URL_TEST` to point to a dedicated test
database, distinct from `DATABASE_URL`, and apply migrations to it before
running:

```powershell
$env:DATABASE_URL_TEST = "postgresql://user:password@localhost:5432/project_hub_test"
$env:DATABASE_URL = $env:DATABASE_URL_TEST
npx prisma migrate deploy
npm test
```

For Git Bash, use:

```bash
export DATABASE_URL_TEST="postgresql://user:password@localhost:5432/project_hub_test"
DATABASE_URL="$DATABASE_URL_TEST" npx prisma migrate deploy
npm test
```

The test runner refuses to start in production, without `DATABASE_URL_TEST`, or
when the test URL matches `DATABASE_URL`. Never point the test URL at
production.
