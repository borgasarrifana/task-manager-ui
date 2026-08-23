# Task Manager API

A full-stack task management application built with ASP.NET Core, React, and PostgreSQL — demonstrating a layered backend architecture, JWT authentication, and a relational data model, deployed end-to-end across three platforms.

## Live Demo

- **Frontend:** https://task-manager-ui-ruby.vercel.app
- **API (Swagger):** https://task-manager-api-1-iusg.onrender.com/swagger

> Note: the API is hosted on Render's free tier, which spins down after inactivity. The first request after idle time may take 30-60 seconds to respond while it wakes up.

## Overview

This project models Projects and Tasks, where each Project can contain many Tasks. It was built as a hands-on learning project to practice core backend patterns expected in professional ASP.NET Core development: clean separation of concerns, secure authentication, proper REST API design, and a real production deployment.

## Tech Stack

- **ASP.NET Core (.NET 10)** — Controller-based Web API
- **Entity Framework Core** — ORM, code-first migrations
- **PostgreSQL** (hosted on Supabase) — relational database
- **JWT Bearer Authentication** — token-based auth
- **BCrypt.Net** — secure password hashing
- **React + Vite + Tailwind CSS** — frontend
- **Swagger / OpenAPI** — interactive API documentation
- **Deployed on:** Render (API), Vercel (frontend), Supabase (database)

## Architecture

Controllers/ → HTTP layer: routing, status codes, request/response shaping
Services/ → Business logic layer: the "how" behind each operation
Data/ → EF Core DbContext: the data access layer
Models/ → Database entities
DTOs/ → Data Transfer Objects: define exactly what the API accepts/returns
Middleware/ → Cross-cutting concerns (global exception handling)


Controllers never talk to the database directly — they call services, which encapsulate all business logic and are the only layer that touches the DbContext. This keeps HTTP concerns fully decoupled from data logic.

## Features

- Full CRUD on Projects and Tasks
- Nested REST routes reflecting real ownership (`/api/projects/{id}/tasks`)
- JWT authentication with registration and login
- Passwords hashed with BCrypt — never stored in plain text
- DTOs on every endpoint — internal database models are never exposed directly
- Input validation via data annotations, returning structured 400 errors
- Global exception handling middleware — unhandled errors return a clean, generic response instead of leaking stack traces
- Protected endpoints requiring a valid Bearer token
- A React frontend consuming the live API: login/register, project management, task management with checkboxes and delete

## API Endpoints

| Method | Endpoint                          | Description                       | Auth Required |
|--------|------------------------------------|------------------------------------|:---:|
| POST   | `/api/auth/register`              | Register a new user                | No  |
| POST   | `/api/auth/login`                 | Log in, returns a JWT              | No  |
| GET    | `/api/projects`                   | List all projects                  | Yes |
| POST   | `/api/projects`                   | Create a project                   | Yes |
| GET    | `/api/projects/{projectId}/tasks` | List tasks under a project         | Yes |
| POST   | `/api/projects/{projectId}/tasks` | Create a task under a project      | Yes |
| GET    | `/api/tasks/{id}`                 | Get a single task by id            | Yes |
| PUT    | `/api/tasks/{id}`                 | Update a task                      | Yes |
| DELETE | `/api/tasks/{id}`                 | Delete a task                      | Yes |

## Running Locally

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (for the frontend)
- A PostgreSQL database (e.g. a free [Supabase](https://supabase.com) project)

### Backend Setup

1. Clone the API repository:
git clone https://github.com/borgasarrifana/task-manager-api.git
cd task-manager-api/TaskManager.Api

2. Copy the example config and fill in your own values:
cp appsettings.Example.json appsettings.json

   Edit `appsettings.json` with your database connection string and a randomly generated JWT signing key (at least 32 characters).

3. Apply database migrations:
dotnet ef database update

4. Run the API:
dotnet run


5. Open Swagger UI at `http://localhost:PORT/swagger` (check your terminal for the exact port).

### Frontend Setup

1. Clone the UI repository and install dependencies:
git clone https://github.com/YOUR_USERNAME/task-manager-ui.git
cd task-manager-ui
npm install


2. Update `src/api.js` with your local API URL (`http://localhost:PORT/api`).

3. Run the dev server:
npm run dev

## Deployment Notes

Deploying this project surfaced several real-world issues worth documenting:

- **Geographic latency matters.** The API and database must be deployed in the same (or nearby) region. Hosting the API in Ohio while the database pooler was in Ireland caused query times of 12-30+ seconds; moving the API to Render's Frankfurt region brought this down to milliseconds.
- **Supabase's direct connection (port 5432, IPv6) doesn't work on Render** — Render's network can't route outbound IPv6, causing "Network unreachable" errors. The fix is to use Supabase's **connection pooler** instead.
- **Pooler mode matters for EF Core.** Supabase's pooler offers both "Transaction" mode (port 6543) and "Session" mode (port 5432, using the same pooler host). Transaction mode caused `INSERT` commands to hang and time out with EF Core, likely due to prepared-statement handling; switching to Session mode resolved it immediately.
- **Reverse proxy HTTPS detection**: `UseForwardedHeaders` middleware is required so the app correctly recognizes HTTPS requests forwarded by Render's proxy — without it, generated URLs default to `http://`, causing mixed-content errors in the browser.

## What I'd Add Next

- Scope Projects/Tasks to their owning User (currently any authenticated user can see all projects)
- Unit tests for the service layer (xUnit + Moq)
- Refresh tokens, since access tokens currently expire after 2 hours with no renewal flow
- Rate limiting on the auth endpoints

## What This Project Demonstrates

- Designing a layered architecture with clear separation between HTTP handling, business logic, and data access
- Modeling relational data with EF Core, including foreign keys and navigation properties
- Implementing secure authentication from scratch (password hashing, JWT issuing and validation)
- Defensive API design: DTOs to control data exposure, input validation, and centralized error handling
- Building a working frontend that consumes the API end-to-end
- Diagnosing and resolving real production deployment issues across multiple cloud platforms (Render, Vercel, Supabase) — including networking, connection pooling, and reverse proxy configuration