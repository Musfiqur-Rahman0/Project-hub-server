# Project Hub API

Express API for authentication and project submissions. Unless stated
otherwise, successful API responses use this envelope:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

Errors use a consistent envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please enter valid input",
    "details": {
      "email": ["Enter a valid email address"]
    }
  }
}
```

Validation errors use HTTP `400`; authentication `401`; authorization `403`;
not found `404`; conflicts `409`; rate limits `429`; unexpected errors `500`.
Unexpected production errors do not include stack traces or internal details.

## Requirements and installation

- Node.js 20 or newer
- PostgreSQL (Supabase is supported)

From this directory:

```bash
npm install
```

Create a local `.env` file using the variables below. Never commit real
credentials or share database URLs.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection used by Prisma, migrations, and the API |
| `JWT_SECRET` | Yes for login/token operations | Secret used to sign and verify authentication tokens |
| `PORT` | No | HTTP port; defaults to `5000` |
| `NODE_ENV` | No | Runtime mode; defaults to `development` |
| `FRONTEND_URL` | No | Read into configuration; CORS currently uses Express defaults and does not yet use this value |
| `SEED_PASSWORD` | No | Overrides the demo password when seeding |
| `DATABASE_URL_TEST` | For integration tests | Dedicated test database; must not be production or the same database as `DATABASE_URL` |

Example `.env` (replace placeholders locally; do not commit actual secrets):

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

## Database, seed, and server

Apply committed migrations to the database named by `DATABASE_URL`:

```bash
npx prisma migrate deploy
```

Seed demo accounts and submissions (development only; refuses to run when
`NODE_ENV=production`):

```bash
npm run seed
```

The default demo password is `ProjectHub123!`, or set `SEED_PASSWORD` before
seeding. Keep seeded accounts out of production.

Start the API:

```bash
npm run dev
```

The API listens on `http://localhost:5000` by default. Production build/start:

```bash
npm run build
npm start
```

Health check: `GET /health` returns the plain-text response `Okey`.

## Authentication

API routes are mounted under `/api/v1`. Registration and login accept JSON.
Login returns an access token and refresh token in the response and sets
HTTP-only `access_token` and `refresh_token` cookies. Authenticated endpoints
accept the access token as:

```http
Authorization: Bearer <accessToken>
```

The access token expires after one day; the refresh token after seven days.
`GET /api/v1/auth/refresh` reads the refresh cookie (not a body token) and
issues new tokens. `GET /api/v1/auth/logout` clears the cookies.

Login is limited to 10 requests per 15-minute window per client IP. The current
server CORS setup uses Express defaults (`cors()`): it does not enable
credentialed cross-origin requests or apply `FRONTEND_URL`. Browser clients
using cookies across origins require an explicit trusted-origin/credentials
CORS configuration; do not assume that setting `FRONTEND_URL` enables it.
Bearer-token clients can send the authorization header.

## API reference

All request bodies below use `Content-Type: application/json`.

### Authentication

| Method and path | Auth | Description |
| --- | --- | --- |
| `POST /api/v1/auth/register` | No | Create a student account |
| `POST /api/v1/auth/login` | No; rate-limited | Sign in |
| `GET /api/v1/auth/refresh` | Refresh cookie | Refresh tokens |
| `GET /api/v1/auth/logout` | No | Clear auth cookies |
| `GET /api/v1/auth/me` | Access token/cookie | Return the signed-in user |

Register request:

```json
{
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "ExamplePass123"
}
```

`fullName` must contain at least 2 characters. Password must be at least 8
characters and include a lowercase letter, uppercase letter, and number.
Email must be valid. Registration returns HTTP `201`; duplicate email returns
`409 CONFLICT`.

Login request:

```json
{
  "email": "ada@example.com",
  "password": "ExamplePass123"
}
```

Successful authentication data contains a `user` object and the token fields.
Password hashes are not returned.

### Submissions

| Method and path | Auth / roles | Description |
| --- | --- | --- |
| `GET /api/v1/submission` | Access token | List submissions; students see their own, other roles currently see all |
| `POST /api/v1/submission` | Access token | Create a submission for the signed-in user |
| `GET /api/v1/submission/stats` | Access token | Counts for the signed-in student, or global counts for other roles |
| `PATCH /api/v1/submission/:id/review` | Mentor or admin | Approve/reject a submission with feedback |

Create submission request:

```json
{
  "projectName": "Portfolio app",
  "repoUrl": "https://github.com/ada/portfolio",
  "liveUrl": "https://portfolio.example.com",
  "description": "A detailed description of the project, its purpose, and its key features for reviewers."
}
```

Project name must be 3–120 characters. `repoUrl` must be a GitHub repository
URL; `liveUrl` must be an HTTP(S) URL. Description must be 50–1000 characters.
Successful creation returns HTTP `201`. A student cannot submit the same
repository twice; that returns `409 CONFLICT`.

List query parameters:

| Parameter | Default | Rules |
| --- | --- | --- |
| `page` | `1` | Integer from 1 to 1,000,000 |
| `pageSize` | `10` | Integer from 1 to 100 |
| `status` | none | `PENDING`, `APPROVED`, or `REJECTED` |

Examples:

```http
GET /api/v1/submission?page=2&pageSize=20
GET /api/v1/submission?status=REJECTED&page=1&pageSize=10
```

Filtering, pagination, and counting are performed in the database. Results are
sorted newest-first, with submission ID as a stable tie-breaker. The response
contains submissions in `data` and pagination metadata in `meta`:

```json
{
  "success": true,
  "message": "Successfully retrieved submission list",
  "data": [
    {
      "id": "submission-uuid",
      "projectName": "Portfolio app",
      "repositoryUrl": "https://github.com/ada/portfolio",
      "liveUrl": "https://portfolio.example.com",
      "description": "A detailed project description...",
      "status": "REJECTED",
      "studentId": "student-uuid",
      "reviewerId": "mentor-uuid",
      "feedback": "Please add tests for the main user flow.",
      "reviewedAt": "2026-10-23T12:00:00.000Z",
      "createdAt": "2026-10-22T12:00:00.000Z",
      "updatedAt": "2026-10-23T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Review request (mentor/admin only):

```http
PATCH /api/v1/submission/submission-uuid/review
```

```json
{
  "status": "APPROVED",
  "feedback": "The project meets the review criteria."
}
```

Only `APPROVED` and `REJECTED` are valid review statuses. Feedback is required
and limited to 2,000 characters. The saved submission includes its status,
feedback, reviewer ID, and review time. Unknown IDs return `404`.

Statistics response:

```json
{
  "success": true,
  "message": "Submission statistics retrieved successfully",
  "data": {
    "total": 8,
    "pending": 3,
    "approved": 4,
    "rejected": 1
  }
}
```

### Test route

`GET /api/v1/test` requires an access token and allows `STUDENT` or `ADMIN`.
It currently returns a simple test response and is intended as a route/middleware
check:

```json
{
  "success": true,
  "message": "Test completed",
  "data": null
}
```

## Tests

Run server type-check:

```bash
npm run typecheck
```

Workflow tests use a separate PostgreSQL database and delete the records they
create. Create an empty test database, set `DATABASE_URL_TEST` in the server
`.env`, and apply migrations to that test database before running the suite.
For Git Bash:

```bash
export DATABASE_URL_TEST="postgresql://USER:PASSWORD@TEST_HOST:5432/TEST_DATABASE?sslmode=require"
DATABASE_URL="$DATABASE_URL_TEST" npx prisma migrate deploy
npm test
```

For PowerShell:

```powershell
$env:DATABASE_URL_TEST = "postgresql://USER:PASSWORD@TEST_HOST:5432/TEST_DATABASE?sslmode=require"
$env:DATABASE_URL = $env:DATABASE_URL_TEST
npx prisma migrate deploy
Remove-Item Env:DATABASE_URL
npm test
```

Removing the temporary `DATABASE_URL` lets the test runner load the distinct
development value from `.env`; the test runner itself switches the API to
`DATABASE_URL_TEST`.

The test runner loads `DATABASE_URL_TEST` from the environment or `.env`, refuses
to run in production or without a valid test URL, and rejects a URL that points
at the same database as `DATABASE_URL`. Never use a production database for
tests.
