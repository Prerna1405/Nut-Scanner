# AI Calorie Tracker - Project Report

## Overview
**AI Calorie Tracker** is a comprehensive, React Native/Expo mobile application designed to help users track their nutrition, generate AI-powered meal plans and recipes, analyze food through images, and monitor their overall health and fitness progress.

## Core Architecture
- **Frontend Framework**: React Native with Expo (Expo Router for navigation).
- **Authentication**: Clerk authentication system.
- **Backend/Services**: 
  - Direct integration with Firebase for data storage (user profiles, meal logs, water logs, exercise logs).
  - External APIs: FatSecret (nutrition DB), OpenFoodFacts (barcode scanning), MealDB.
- **AI Integrations**: 
  - **Google Gemini API** (`aiService.ts`, `nutritionCoachService.ts`) handles intelligent image recognition for food scanning, AI chat coaching, and advanced nutrition planning.
  - **OpenAI / OpenRouter API** for recipe generation and intelligent recommendations.

## Key Features & Modules

### 1. Food & Nutrition Tracking
- **Food Scanner (`food-scanner.tsx`)**: Allows users to take pictures of their food. It directly calls the Gemini AI via `aiService.ts` to identify the food, estimate portion sizes, provide exact macronutrients, ingredients, and health assessments.
- **Barcode Scanner (`barcode-scanner.tsx`)**: Scans product barcodes and fetches nutrition facts from OpenFoodFacts.
- **Food Search (`food-search.tsx`)**: Manual lookup for foods using FatSecret/MealDB integration.

### 2. AI Recipe Generation & Planning
- **Recipe Generator (`recipe-generator.tsx`)**: Leverages AI to generate custom recipes based on user macros, dietary preferences, and available ingredients.
- **Recipe Pantry (`recipe-pantry.tsx`)**: Manages ingredients the user currently has at home.
- **Recipe Planner & Shopping List**: Automatically organizes weekly meals and generates categorized shopping lists.
- **Recipe Hub & Details**: Saves favorite recipes and provides step-by-step cooking instructions.

### 3. Progress & Health Monitoring
- **Health Score (`health-score.tsx`)**: A dynamic scoring system tracking user consistency and nutritional balance.
- **Progress Prediction (`progress-prediction.tsx`)**: Uses AI and historical data to forecast weight and fitness progress over time.
- **Weekly Report (`weekly-report.tsx`)**: Provides an auto-generated summary and AI insights about the user's past week.
- **Water & Exercise Logging**: Intuitive forms for logging daily water intake and workout routines.

### 4. Virtual Nutrition Coaching
- **Nutrition Coach (`nutrition-coach.tsx`)**: An interactive AI chatbot that acts as a personal nutritionist.
- **Coach Calls (`coach-call.tsx`)**: Simulates voice/text interactions with the coach.

### 5. Admin & Management
- **Admin Analytics (`admin-analytics.tsx`)**: Dashboard for overall platform statistics.
- **Admin Coach Logs**: For monitoring coach interactions and ensuring safety/quality.

## Recent Technical Refactoring
- **Removed Deprecated Cloud Run Backend**: The food scanner module was refactored to bypass an unreliable external backend API (`/api/scan-food`), executing the AI image processing purely and securely on the client-side via the Gemini SDK.
- **Model Upgrades**: Transitioned legacy API requests to `gemini-1.5-pro-latest` and `gemini-2.0-flash` for more robust and accurate image processing without 404 endpoint errors.

## Conclusion
The application is a feature-rich, AI-first approach to dietary tracking, utilizing modern cloud AI models to minimize manual data entry and maximize personalized guidance.
