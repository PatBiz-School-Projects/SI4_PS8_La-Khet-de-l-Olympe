# Khet de l'Olympe — Project Report

## Team

- **Team name:** La Khet de l'Olympe
- **Members:**
    - Nicolas Malay
    - Patrick Bizot
    - Ismail Guerraoui

---

## Installation & Launch Procedure

### Prerequisites

- Node.js 20
- Docker + Docker Compose

### Environment setup

1. Clone the repository.
2. Copy the sample environment file and fill the required values:
    - `cp secrets.env.example secrets.env`

### Run with Docker (recommended)

From the project root:

```bash
docker compose --env-file ./secrets.env up --build
```

Gateway entrypoint: `http://localhost:8000`.

### Run manually (without Docker)

Start each service independently (with matching environment variables):

```bash
node services/gateway/index.js
node services/files/index.js
node services/auth/index.js
node services/gameService/index.js
node services/userService/index.js
node services/challengeService/index.js
node services/chats/index.js
```

## Functional Features Implemented

## Authentication & Account Management

- Sign up with:
    - username
    - password
    - secret question + answer
- Login / token verification / access token renewal.
- Logout with cookie cleanup.
- **Forgot password flow implemented**:
    1. User provides username.
    2. System returns stored secret question.
    3. User submits answer + new password.
    4. Password is reset if answer is valid.

## User Profile & Social Features

- Player profile with:
    - username
    - profile picture
    - ELO
    - win/loss statistics
    - winstreak information
- Public profile page and personal profile page.
- User search by username.
- Friends system:
    - send request
    - list incoming requests
    - accept/remove requests
    - list friends
- Connected users tracking (online/offline distinction).

## Game Modes & Match Flow

- Solo mode (with AI).
- Local multiplayer mode.
- Online multiplayer mode through rooms/challenges.
- Waiting room before multiplayer game starts.
- In-game actions (movement/rotation/placement according to rules).
- Turn handling + active player tracking.
- Game end handling with stat updates.
- Match history retrieval.

## Challenges

- Send challenge to another user.
- List incoming challenges.
- Accept/decline/cancel challenge.

## Chat Systems Implemented

- **Two chats are implemented:**:
    1. Global-chat.
    2. Game-chat.

### Usage restrictions

- Access requires authentication cookies (`userToken` or `guestToken`, `refreshToken`).
- Each chat is restricted to authorized users only.
- Playing multiplayer games and accessing personal profiles are strictly restricted to authenticated users.

## Progression, Achievements, Ranking

- ELO-based ranking with win/loss updates.
- Win-streak bonus integrated in ELO progression.
- Leaderboard endpoint + UI display.
- Achievements catalogue implemented, including:
    - First win
    - 50 wins
    - 5-win streak
    - First connection

---

## Back-end Architecture Strategy



### Service decomposition

The platform is split into focused services:

- **Gateway**: single external entrypoint, routes HTTP/WS traffic to internal services.
- **Files service**: serves static front-end files/assets.
- **Auth service**: registration, login, token lifecycle, password reset.
- **User service**: profiles, friends, connected users, achievements, leaderboard/stats.
- **Game service**: game state, turn logic, board/inventory actions, game lifecycle.
- **Challenge service**: challenge orchestration and challenge-state transitions.
- **Chat service**: chat rooms, history, and real-time messaging.

#### Why this split made sense

- Clear business boundaries (auth/user/game/chat/challenge).
- Better maintainability: each domain can evolve independently.
- Easier debugging and ownership by feature area.
- Natural fit for different communication patterns (REST for request/response, WebSocket for real-time interactions).

#### Event-driven architecture (Redis Pub/Sub)

To reduce synchronous coupling between services, the architecture adopts **EDA via Redis Pub/Sub** for transient domain events:
- Services publish events such as `users.created-new-user`, `users.pdated-user-profile`.
- Interested services subscribe to relevant channels and react asynchronously.

Benefits of this approach:

- Lower request-chain latency and fewer hard dependencies between services.
- Better resilience during partial outages (publish/retry patterns instead of deep sync call chains).
- Cleaner separation between command handling (HTTP) and side effects/notifications (events).

#### Difficulties encountered / what could be improved

- Some flows go through multiple services (e.g., challenge → game room → chat room), increasing risks of network errors.
- More importantly, some choices were made purely because they were technically easier.

### HTTP & WebSocket strategy

#### HTTP (request/response, deterministic operations)

Used for:

- Authentication operations (signup/login/renew/logout/forgot-password).
- Profile and social operations (friends, search, stats, leaderboard).
- Game commands and state fetches (create/join/action/get board/inventory/player state).
- Challenge creation/list/accept/decline/cancel.
- Chat history retrieval.

HTTP is initiated by the **front-end client** through the gateway, and by services for internal orchestration.

#### WebSocket (real-time events)

Used for:

- **Game service**: real-time match events (turn transitions, opponent actions, start/end dynamics).
- **Chat service**: instant message broadcasting in chat rooms.
- **Challenge service**: real-time challenge notifications to targeted users.
- **Notifications**: users receive real-time friend requests or challenges upon visiting the home page.

Connection initiation:

- Client opens Socket.IO connections via gateway (upgrade proxied to relevant service).
- Services emit server-side events to connected clients/rooms.

Why this choice is relevant:

- Real-time gameplay/chat/challenge UX requires low-latency events and need to be run all the time.
- HTTP remains simpler for CRUD-like and transactional operations.

#### Middleware strategy
A shared middleware baseline is enforced at the gateway level, then complemented by domain-specific middleware inside each service:
- **Gateway middleware pipeline**:
  - CORS policy and origin filtering.
  - JSON/body parsing.
  - Access-token extraction/verification and auth-context propagation.
  - Request validation.
  - Injecting guest token when unauthenticated.
  - Centralized error mapping/logging to provide consistent API responses.
- **Service-level middleware**:
  - Authorization guards (resource ownership / room membership checks).
  - Domain validation (game move legality pre-checks, challenge state guardrails).


This keeps cross-cutting concerns standardized while leaving business rules close to the owning bounded context.
---




