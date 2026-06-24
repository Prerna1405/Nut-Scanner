# Nut Scanner - Setup Guide

## Prerequisites

Before running the project, install:

* Node.js (v18 or later recommended)
* npm
* Git

Verify installation:

```bash
node -v
npm -v
git --version
```

---

# Project Structure

The project contains two folders:

```text
Nut-Scanner/
│
├── ai-cal-tracker/
│   └── .env
│
└── recipe/
    └── .env
```

---

# Step 1: Clone the Repository

```bash
git clone https://github.com/Prerna1405/Nut-Scanner.git
cd Nut-Scanner
```

---

# Step 2: Configure Environment Variables

## ai-cal-tracker/.env

Create a `.env` file inside the `ai-cal-tracker` folder and add your own API keys:

```env
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=

# AI APIs
EXPO_PUBLIC_GEMINI_API_KEY=
VITE_OPENAI_API_KEY=
OPENAI_API_KEY=

# FatSecret
EXPO_PUBLIC_FATSECRET_CLIENT_ID=
EXPO_PUBLIC_FATSECRET_CLIENT_SECRET=

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=

# Spoonacular
EXPO_PUBLIC_SPOONACULAR_API_KEY=

# OpenRouter
EXPO_PUBLIC_OPENROUTER_KEY=

# USDA
USDA_API_KEY=

# Backend Port
PORT=5000
```

---

## recipe/.env

Create a `.env` file inside the `recipe` folder:

```env
VITE_OPENAI_API_KEY=
```

Add your own OpenAI API key.

---

# Step 3: Install Dependencies

## AI Cal Tracker

```bash
cd ai-cal-tracker
npm install
```

## Recipe Project

Open another terminal:

```bash
cd recipe
npm install
```

---

# Step 4: Run the Projects

## Run AI Cal Tracker

```bash
cd ai-cal-tracker
npm start
```

If `npm start` does not work, check available scripts:

```bash
npm run
```

and run the appropriate command (e.g. `npm run dev`).

---

## Run Recipe Project

```bash
cd recipe
npm run dev
```

---

# Notes

* Do not commit your `.env` files to GitHub.
* Add your own API keys before running the project.
* Ensure internet connectivity for API-based features.
* If you encounter dependency issues, delete `node_modules` and reinstall:

```bash
rm -rf node_modules
npm install
```

or on Windows:

```powershell
rmdir /s /q node_modules
npm install
```

---

# Support

If the project fails to start:

```bash
npm run
```

and check which scripts are available in `package.json`.

Then run the appropriate command listed there.
