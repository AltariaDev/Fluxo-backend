# 🧠 Fluxo Backend

**SherpApp** is a comprehensive productivity application backend that provides timer-based work sessions, task management, habit tracking, and gamification features.  
This system serves as the API foundation for a web and mobile productivity platform centered around the Pomodoro Technique and collaborative study sessions.

**For more detailed documentation, visit:** 

## 🚀 Getting Started

### ✅ Prerequisites

Before starting, ensure you have the following installed:

| Requirement     | Version    | Purpose                    |
|----------------|------------|----------------------------|
| Node.js         | ≥ 20.x     | Runtime environment        |
| pnpm            | ≥ 10.6.2   | Package manager            |
| Docker          | Latest     | Database containers        |
| Docker Compose  | Latest     | Multi-container orchestration |

### 1. Clone the repository

```bash
git clone https://github.com/AltariaDev/Fluxo-backend
cd Fluxo-backend
````

### 2. Install dependencies
```
pnpm install

    Make sure you have pnpm installed. If not:

    npm install -g pnpm
```
### 3. Set up environment variables
```
Create a .env file at the root of the project and add the following:

PORT=4000
MONGO_URI=mongodb://localhost/focusmate
JWT_SECRET=your_secret

You can customize these variables to match your environment.
```
### 4. Run the server in development mode
```
pnpm run start:dev
```
### 📂 Project Structure
```
src/
├── auth/                  # Authentication and JWT
├── calendar/              # Calendar module
├── habits/                # Habits module
├── pomodoro/              # Pomodoro timer
├── tasks/                 # Task management
├── stats/                 # Global app statistics
├── common/                # Pipes, decorators, and utilities
├── dashboard/             # Stats dashboard
├── email/                 # Email messaging module
├── events/                # Event management
├── events-calendar/       # Calendar-related events
├── gamification-profile/  # User profile module
├── pomodoro-task-link/    # Pomodoro-task linking
├── user-logs/             # User logs
├── users/                 # Users module
├── main.ts                # App entry point
```
### 🛠️ Available Scripts
```
pnpm run start         # Start the app
pnpm run start:dev     # Start in development mode (with hot reload)
pnpm run build         # Build the app
pnpm run lint          # Run the linter
pnpm run test          # Run tests
```
### 🔐 Authentication
```
JWT is used for authentication. Include the token in your request headers like so:

Authorization: Bearer <your_token_here>
```
### 📊 Database

The project uses MongoDB with Mongoose. All entities are document-based.

### 📝 License

This project is licensed under the MIT License.
