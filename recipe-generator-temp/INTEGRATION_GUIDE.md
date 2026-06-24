# 📦 Recipe Module Integration Guide

## 🚀 What You Get
A complete, production-ready AI-powered Recipe Generator module with:
- 🔍 Search recipes from TheMealDB (free, unlimited)
- ✨ Free "AI" recipe generation (built-in database)
- 📊 Nutrition information
- 🛒 Ingredients checklist
- ⭐ Save & favorite recipes
- 📱 Responsive design
- 💫 Smooth animations

---

## 📂 Files to Copy to Your Project
Copy these from `c:\Users\ahire\airecipe\src\` to your existing project:

### 1. **Components**
- Copy `src/components/` → Your project's `components/` folder
  - `RecipeCard.tsx`
  - `NutritionCard.tsx`
  - `Skeleton.tsx`

### 2. **Services** (Business Logic)
- Copy `src/services/` → Your project's `services/` or `lib/` folder
  - `mealDbService.ts`
  - `freeAiRecipes.ts`
  - `storageService.ts`

### 3. **Hooks** (State Management)
- Copy `src/hooks/` → Your project's `hooks/` folder
  - `useRecipes.ts`

### 4. **Types** (Type Definitions)
- Copy `src/types/` → Your project's `types/` folder
  - `index.ts`

### 5. **Context** (Global State)
- Copy `src/contexts/` → Your project's `contexts/` folder
  - `AppContext.tsx`

### 6. **Pages** (Main UI)
- Copy `src/pages/RecipeHome.tsx` → Your project's recipe page
- Copy `src/pages/RecipeDetails.tsx` → Your project's recipe details page

---

## 📦 Install Dependencies in Your Project
Run in your project root:
```bash
npm install lucide-react react-router-dom
```

---

## 🎨 Styling
This module uses Tailwind CSS! If your project doesn't use Tailwind:
1. Either set up Tailwind CSS in your project
2. Or convert the classes to your existing CSS framework

---

## 🛠️ Integration Steps
1. **Copy all files above** to your project
2. **Wrap your app** with `AppProvider` (from `contexts/AppContext.tsx`)
3. **Add the routes** to your router:
   - `/recipes` → `RecipeHome.tsx`
   - `/recipe/:id` → `RecipeDetails.tsx`
4. **Done!** You now have a complete recipe module!

---

## 🌱 Environment Variables
If you want to use OpenAI (optional, we have free option):
```env
# If using Vite
VITE_OPENAI_API_KEY=your-key

# If using Next.js
NEXT_PUBLIC_OPENAI_API_KEY=your-key
```

---

## ✅ Features Summary
✅ Free, unlimited recipe search
✅ Free, unlimited "AI" recipe generation
✅ Nutrition info per serving
✅ Ingredients checklist
✅ Save & favorite recipes
✅ Recent recipes history
✅ Beautiful, modern UI
✅ Responsive design
