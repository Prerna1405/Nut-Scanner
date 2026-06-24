# 📦 Merge Recipe Module into Next.js App

## 🚀 Step 1: Copy Files to Your Next.js App
First, copy these from `c:\Users\ahire\airecipe\src\`:
- `src/components/` → Copy to your Next.js `components/` folder
- `src/services/` → Copy to `lib/services/`
- `src/hooks/` → Copy to `lib/hooks/`
- `src/types/` → Copy to `lib/types/`
- `src/contexts/` → Copy to `contexts/`
- `.env` and `.env.example` → Copy to your Next.js app root
  (Rename `VITE_OPENAI_API_KEY` to `NEXT_PUBLIC_OPENAI_API_KEY`)

## 📦 Step 2: Install Dependencies
Run in your Next.js app:
```bash
npm install lucide-react
```

## 🛠️ Step 3: Update Next.js Files
1. Copy `recipes-page.tsx` to `app/recipes/page.tsx`
2. Copy `recipe-details-page.tsx` to `app/recipes/[id]/page.tsx`
3. Add `AppProvider` to your `app/layout.tsx`

## 📝 Step 4: Update Environment Variable
In your Next.js `.env` file:
```env
NEXT_PUBLIC_OPENAI_API_KEY=your-api-key-here
```

## 🎉 Step 5: Add Bottom Navigation
Add `BottomNav` to your `app/layout.tsx`!
