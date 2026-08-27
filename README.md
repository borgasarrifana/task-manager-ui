# Task Manager

A full-stack task management application built with ASP.NET Core, React, and PostgreSQL — demonstrating a layered backend architecture, JWT authentication with role-based authorization, and a relational data model, deployed end-to-end across three platforms.

## Live Demo

- **Frontend:** https://task-manager-ui-ruby.vercel.app
- **API (Swagger):** https://task-manager-api-1-iusg.onrender.com/swagger

> Note: the API is hosted on Render's free tier, which spins down after inactivity. The first request after idle time may take 30-60 seconds to respond while it wakes up.

## Overview

This project models Users, Projects, and Tasks: every user owns their own Projects, each Project can contain many Tasks, and an Admin role can manage the system across all users. It was built as a hands-on learning project to practice core backend patterns expected in professional ASP.NET Core development: clean separation of concerns, secure authentication and authorization, proper REST API design, defensive server-side business rules, and a real production deployment.

## Tech Stack

- **ASP.NET Core (.NET 10)** — Controller-based Web API
- **Entity Framework Core** — ORM, code-first migrations
- **PostgreSQL** (hosted on Supabase) — relational database
- **JWT Bearer Authentication** — token-based auth with role claims
- **BCrypt.Net** — secure password hashing
- **React + Vite + Tailwind CSS** — frontend, custom HUD-styled design system
- **Swagger / OpenAPI** — interactive API documentation
- **Deployed on:** Render (API, Frankfurt region), Vercel (frontend), Supabase (database)

## Architecture

```
Controllers/  → HTTP layer: routing, status codes, request/response shaping
Services/     → Business logic layer: the "how" behind each operation
Data/         → EF Core DbContext: the data access layer
Models/       → Database entities
DTOs/         → Data Transfer Objects: define exactly what the API accepts/returns
Middleware/   → Cross-cutting concerns (global exception handling)
```

Controllers never talk to the database directly — they call services, which encapsulate all business logic and are the only layer that touches the DbContext. This keeps HTTP concerns fully decoupled from data logic.

Where an operation can fail for more than one reason (e.g. updating a task that doesn't exist vs. updating a task in a completed, locked project), services return a typed result (`TaskOperationResult`) rather than a bare `bool`, so controllers can map each outcome to the correct HTTP status instead of collapsing every failure into a single response.

## Features

### Authentication & Authorization
- JWT authentication with registration and login
- Passwords hashed with BCrypt — never stored in plain text
- Role-based access control (`Admin` / `Member`), embedded in the JWT as a claim
- Resource-level ownership enforcement: a `Member` can only see and modify their own Projects and Tasks; an `Admin` bypasses ownership checks and can manage everything
- Admin-only user management: list all users, edit usernames, promote/demote roles, and delete accounts (cascades to that user's Projects and Tasks)
- Safeguards against self-lockout: an Admin can't demote or delete their own account

### Projects & Tasks
- Full CRUD on Projects and Tasks, with nested REST routes reflecting real ownership (`/api/projects/{id}/tasks`)
- Task priority levels (Low/Medium/High) and optional due dates, with overdue tasks flagged in the UI
- Sorting and filtering on the task list
- Delete confirmation flows that show the real impact first (e.g. "this project has 6 tasks — deleting it removes them too")
- **Project completion workflow:** marking a project Complete cascades every task inside it to done and locks the project (no adding, editing, or deleting tasks) until it's explicitly reopened. This is enforced server-side, not just hidden in the UI — the API rejects task mutations on a completed project regardless of what the client sends.

### API Design
- DTOs on every endpoint — internal database models are never exposed directly
- Input validation via data annotations, returning structured 400 errors
- Global exception handling middleware — unhandled errors return a clean, generic response instead of leaking stack traces
- All endpoints require a valid Bearer token except registration and login

### Frontend
- Custom HUD-styled design system (dark/light theme, auto-detected from OS preference with a manual override, persisted across sessions)
- Collapsible sidebar with tree-style navigation, hover tooltips, and role-aware menu items (the Users admin panel only appears for Admins)
- Custom date picker component
- Fully consumes the live API: auth, project/task management, admin user management, and the completion workflow described above

## API Endpoints

| Method | Endpoint                           | Description                                                     | Auth Required |
|--------|------------------------------------|-----------------------------------------------------------------|:-------------:|
| POST   | `/api/auth/register`               | Register a new user (always created as Member)                  |      No       |
| POST   | `/api/auth/login`                  | Log in, returns a JWT and the user's role                       |      No       |
| GET    | `/api/projects`                    | List projects (own projects for Member; all for Admin)          |      Yes      |
| POST   | `/api/projects`                    | Create a project                                                |      Yes      |
| DELETE | `/api/projects/{id}`               | Delete a project                                                |      Yes      |
| PUT    | `/api/projects/{id}/complete`      | Mark a project complete (cascades tasks to done, locks editing) |      Yes      |
| PUT    | `/api/projects/{id}/reopen`        | Reopen a completed project                                      |      Yes      |
| GET    | `/api/projects/{projectId}/tasks`  | List tasks under a project                                      |      Yes      |
| POST   | `/api/projects/{projectId}/tasks`  | Create a task under a project (blocked if project is completed) |      Yes      |
| GET    | `/api/tasks/{id}`                  | Get a single task by id                                         |      Yes      |
| PUT    | `/api/tasks/{id}`                  | Update a task (blocked if its project is completed)             |      Yes      |
| DELETE | `/api/tasks/{id}`                  | Delete a task (blocked if its project is completed)             |      Yes      |
| GET    | `/api/users`                       | List all users                                                  |   Admin only  |
| GET    | `/api/users/{id}/projects`         | List a specific user's projects                                 |   Admin only  |
| PUT    | `/api/users/{id}`                  | Edit a user's username                                          |   Admin only  |
| PUT    | `/api/users/{id}/role`             | Promote or demote a user's role                                 |   Admin only  |
| DELETE | `/api/users/{id}`                  | Delete a user (cascades their projects/tasks)                   |   Admin only  |

## Running Locally

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (for the frontend)
- A PostgreSQL database (e.g. a free [Supabase](https://supabase.com) project)

### Backend Setup

1. Clone the API repository:
   ```
   git clone https://github.com/borgasarrifana/task-manager-api.git
   cd task-manager-api/TaskManager.Api
   ```

2. Copy the example config and fill in your own values:
   ```
   cp appsettings.Example.json appsettings.json
   ```
   Edit `appsettings.json` with your database connection string and a randomly generated JWT signing key (at least 32 characters).

3. Apply database migrations:
   ```
   dotnet ef database update
   ```

4. Run the API:
   ```
   dotnet run
   ```

5. Open Swagger UI at `http://localhost:PORT/swagger` (check your terminal for the exact port).

6. New accounts register as `Member` by default. To test Admin-only features, promote a user's role directly in your database (`Role = 1` on the `Users` table), then use that account's token to promote others through `PUT /api/users/{id}/role`.

### Frontend Setup

1. Clone the UI repository and install dependencies:
   ```
   git clone https://github.com/borgasarrifana/task-manager-ui.git
   cd task-manager-ui
   npm install
   ```

2. Update `src/api.js` with your local API URL (`http://localhost:PORT/api`).

3. Run the dev server:
   ```
   npm run dev
   ```

## Deployment Notes

Deploying this project surfaced several real-world issues worth documenting:

- **Geographic latency matters.** The API and database must be deployed in the same (or nearby) region. Hosting the API in Ohio while the database pooler was in Ireland caused query times of 12-30+ seconds; moving the API to Render's Frankfurt region brought this down to milliseconds.
- **Supabase's direct connection (port 5432, IPv6) doesn't work on Render** — Render's network can't route outbound IPv6, causing "Network unreachable" errors. The fix is to use Supabase's **connection pooler** instead.
- **Pooler mode matters for EF Core.** Supabase's pooler offers both "Transaction" mode (port 6543) and "Session" mode (port 5432, using the same pooler host). Transaction mode caused `INSERT` commands to hang and time out with EF Core, likely due to prepared-statement handling; switching to Session mode resolved it immediately.
- **Reverse proxy HTTPS detection**: `UseForwardedHeaders` middleware is required so the app correctly recognizes HTTPS requests forwarded by Render's proxy — without it, generated URLs default to `http://`, causing mixed-content errors in the browser.
- **JWTs are stale on role changes.** Since a user's role is baked into their token at login, promoting/demoting a user (or changing project ownership visibility) doesn't take effect for that user until they log out and back in to get a fresh token. This is expected JWT behavior, not a bug — but worth knowing when testing role changes.
- **Cascading deletes are handled in application code, not database constraints.** Deleting a user explicitly removes their projects and tasks in the service layer before removing the user record, rather than relying on `ON DELETE CASCADE` at the database level — this keeps the behavior correct regardless of how the migration configured foreign keys.

## What I'd Add Next

- Unit and integration tests for the service layer (xUnit + Moq, `WebApplicationFactory` for endpoint tests)
- Refresh tokens, since access tokens currently expire after 2 hours with no renewal flow
- Rate limiting on the auth endpoints
- Task assignment and comments for multi-user collaboration within a project
- Background job / email notifications for upcoming due dates

## What This Project Demonstrates

- Designing a layered architecture with clear separation between HTTP handling, business logic, and data access
- Modeling relational data with EF Core, including foreign keys, navigation properties, and cascading relationships managed at the application layer
- Implementing secure authentication and role-based authorization from scratch (password hashing, JWT issuing/validation, role claims, resource-level ownership checks)
- Enforcing business rules server-side rather than trusting the client (e.g. a completed project's tasks are genuinely locked via the API, not just visually hidden)
- Defensive API design: DTOs to control data exposure, input validation, typed result objects for nuanced failure handling, and centralized error handling
- Building a working, polished frontend that consumes the API end-to-end, including role-aware UI and optimistic state updates
- Diagnosing and resolving real production deployment issues across multiple cloud platforms (Render, Vercel, Supabase) — including networking, connection pooling, reverse proxy configuration, and JWT staleness