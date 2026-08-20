# To-Do List Mobile App

SDE-1 (MERN Stack) Assignment – Frontend only implementation using **React + Vite + Tailwind CSS**.

Fully responsive mobile UI based on the provided Figma design.

## Features

- **Onboarding** screen matching Figma
- **Home screen** with:
  - Search bar
  - Weekly calendar strip (Mon–Sun)
  - Task Complete / Task Pending summary cards
  - Weekly Progress bar
  - Tasks list for selected day (checkbox, edit, delete)
  - Floating Action Button (+)
- **Add / Edit Task** form with:
  - Title (required)
  - Start & End time
  - Date
  - **Priority** (Low / Medium / High)
  - Description
- **Search** tasks by title or description
- **Mark tasks complete / incomplete**
- **Delete tasks**
- **LocalStorage persistence** – tasks survive page refresh
- Strict visual match to Figma (colors, cards, layout, blue theme)

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- date-fns
- lucide-react (icons)
- localStorage for persistence

## Getting Started

```bash
# Clone the repository
git clone https://github.com/abhishektayal216/todo-list-mobile-app.git
cd todo-list-mobile-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── hooks/
│   └── useLocalStorage.js
├── App.jsx              # Main application (all screens)
├── index.css            # Tailwind + custom styles
└── main.jsx
```

## Notes

- No backend required – pure frontend.
- Tasks are stored in `localStorage` under key `todo-tasks`.
- Mobile-first design (max-width 390px card layout to match phone mockups).
- Priority field added as per assignment requirements.

## Live Demo

You can deploy this easily on Netlify / Vercel by connecting the GitHub repo or uploading the `dist` folder after `npm run build`.

---

Built for SDE-1 Assessment • React + Vite + Tailwind
