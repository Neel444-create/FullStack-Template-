# Implementation Notes: Searchable Items

## Summary

This change adds case-insensitive server-side substring search to the existing Items page. Users can search across item titles and descriptions without changing the existing item CRUD contract.

## Request flow

1. A user types into the search field on `frontend/src/routes/_layout/items.tsx`.
2. The React page passes the search term to `ItemsService.readItems`. TanStack Query includes the normalized term in its query key, so a new term triggers a new request and cached terms remain distinct.
3. The generated client issues `GET /api/v1/items/?skip=0&limit=100&search=<term>` with the existing bearer token.
4. FastAPI resolves `CurrentUser` and `SessionDep`, then executes `read_items` in `backend/app/api/routes/items.py`.
5. The route applies the existing authorization scope first: regular users only see rows where `owner_id` matches their user ID; superusers retain the existing all-items visibility.
6. If a non-empty search term was supplied, an `ILIKE` predicate matches it against the title or description. The matching predicate is applied to both the count query and the row query, before ordering and pagination.
7. SQLModel executes both queries through the request's database session. The API responds with the existing `ItemsPublic` shape (`data` and filtered `count`), and the frontend renders the matching rows.

## Design decisions

- **Extend the existing list endpoint.** Keeping search as an optional query parameter is backwards-compatible with existing clients that only send `skip` and `limit`.
- **Filter in the database.** The API does not fetch all rows and filter them in Python; the database can apply the predicate before returning results.
- **Keep authorization in the query.** The owner constraint remains in the query for non-superusers and is also applied to the count. Search does not widen what a user can access.
- **Use case-insensitive substring matching.** This is intuitive for a small administrative/items UI and avoids requiring exact title matches.
- **Keep the response schema stable.** Search returns the existing `ItemsPublic` response, including the count of matching rows.
- **Avoid schema migrations.** Search uses the existing title and description columns, so no database model or migration change is needed.

## Test coverage added

- A unique title can be found when the search term uses a different letter case.
- A unique description can be found even when the title does not match.
- Both tests assert the filtered count and returned row, exercising the API contract rather than only the query helper.

## Local verification checklist

Run these commands from the repository root after installing the documented prerequisites.

```bash
# Start PostgreSQL and Mailpit
docker compose up -d db mailpit

# Prepare the backend (from backend/)
cd backend
uv sync
uv run bash scripts/prestart.sh

# Run the full backend test suite (from backend/)
uv run bash scripts/test.sh

# Start the API (from backend/)
uv run fastapi dev
```

In another terminal, run the frontend from the repository root:

```bash
bun install
bun run dev
```

Open `http://localhost:5173`, sign in with the local development account configured by the repository's environment settings, create a few items, then search by a title and by a description. Swagger documentation is available at `http://localhost:8000/docs`.

This environment could not clone the repository to run these commands directly, so execution results should be taken from a local run or the pull-request CI rather than inferred from the code change.
