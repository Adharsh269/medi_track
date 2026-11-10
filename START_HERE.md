# API-only version

The implementation is in `backend/`. Start with `backend/README.md`.
It contains 36 database endpoints: create, list, fetch and update for nine tables.
Your original frontend source is included as supplied; no frontend work is needed.

Extract separately first. Copy the updated backend into your working project,
keeping your original `.env` and Git history. Installed node_modules and private
.env are excluded. Run `npm ci` inside backend, configure DATABASE_URL and run
`npm run dev`. Import the Postman collection from backend/docs to test.

This simplified local exercise contains no login or permission checks. Your team
must integrate those before publishing it. It contains no scheduler, messaging
integration or ML logic.
