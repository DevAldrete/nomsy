# 🍱 Nomsy: Situational Meal Recommender & Planner

![Status](https://img.shields.io/badge/Status-In%20Development-blue)
![Architecture](https://img.shields.io/badge/Architecture-Microservices-orange)

## 📖 Overview

Nomsy is a situational meal recommender and calendar-based meal planner. Instead of just giving users a giant list of recipes, it acts as an intelligent culinary assistant. It suggests what to eat based on the user's current situation (time, weather, mood, or pantry inventory) and allows for seamless drag-and-drop weekly planning.

## ✨ Core Features

- **Situational Recommendations:** Suggests meals based on dynamic inputs (e.g., "Need a quick warm meal because it's raining and I have 15 minutes").
- **Drag-and-Drop Weekly Calendar:** Interactive UI for mapping out the week's meals.
- **Smart Shopping List Aggregation:** Automatically compiles and deduplicates ingredients from the week's recipes.
- **NLP Recipe Parsing:** Users can paste raw text (like a blog post), and the backend extracts the ingredients and measurements into structured data.

## 🚀 Fresh & Advanced Implementation Ideas

- **Reinforcement Learning Engine:** Implement a feedback loop where the system learns the user's hidden preferences. If the app suggests a spicy dish and the user skips it 3 times, the system updates its policy to de-prioritize high-spice meals for that specific context.
- **Pantry Triage (Decay Algorithm):** Users input what they bought. The backend calculates the average shelf-life of ingredients and pushes recipes that utilize items about to go bad.
- **Fast Text Parsing:** Build the core ingredient-parsing microservice in a low-level language like Rust to ensure blazingly fast string manipulation and regex matching before handing the structured data back to the main API.

## 🧠 System Architecture

- **Frontend:** React + Vite + Tanstack Router + Tailwindcss
- **Backend API:** Express + TypeScript
- **AI/Parsing Service:** Standalone service for text extraction and recommendation logic.
- **Database:** Relational schema handling Users, Recipes, Ingredients, and Calendar states.

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0 (runtime and package manager)
- [Node.js](https://nodejs.org/) >= 20 (for Docker/builds)
- MongoDB (local or cloud instance)

### Installation

```bash
# Install dependencies
bun install

# Start development servers (monorepo with turbo)
bun run dev
```

### Environment Variables

Create `.env` files as needed:

#### apps/api/.env

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nomsy
JWT_SECRET=your-secret-key
NODE_ENV=development
```

#### apps/web/.env (if needed)

```env
VITE_API_URL=http://localhost:3000
```

### Running the Application

```bash
# Development (all apps)
bun run dev

# API only
cd apps/api && bun run dev

# Web only
cd apps/web && bun run dev
```

### Testing

```bash
# Run all tests
bun test

# API tests
cd apps/api && bun test
```

## 🐳 Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 📁 Project Structure

```
.
├── apps/
│   ├── api/          # Express API server
│   └── web/          # React + Vite frontend
├── packages/
│   ├── ui/           # Shared UI components
│   ├── eslint-config # ESLint configuration
│   └── typescript-config # TypeScript configuration
├── docs/             # Documentation and plans
└── turbo.json        # Turborepo configuration
```

## 🧪 CI/CD

GitHub Actions workflow runs on:

- Push to main
- Pull requests

Jobs: Lint → Typecheck → Test → Build
