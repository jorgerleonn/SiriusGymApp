# Sirius Gym App

A modern gym tracking application with a cinematic SpaceX-inspired design.

![Sirius](https://img.shields.io/badge/Version-1.0.0-%23f0f0fa)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![License](https://img.shields.io/badge/License-MIT-%23f0f0fa)

## 🚀 Demo

**Live**: [siriusgym.vercel.app](https://siriusgym.vercel.app)

## ✨ Features

- **Authentication** - Secure login with Clerk
- **Dashboard** - Overview of your training progress
- **Workout Tracking** - Create workouts with exercises and sets
- **History** - View all your past workouts
- **Statistics** - Track progress with interactive charts (Recharts)
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🎨 Design System

Inspired by SpaceX's cinematic aesthetic:
- Pure black background (`#000000`)
- Spectral white text (`#f0f0fa`)
- Uppercase typography with letter-spacing
- Ghost buttons with subtle borders
- No cards or containers - text on image

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Charts | Recharts |
| Deployment | Vercel |

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Clerk account
- Supabase account

## 🔧 Setup

1. **Clone the repository**
```bash
git clone https://github.com/jorgerleonn/SiriusGymApp.git
cd SiriusGymApp
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Variables**

Create a `.env.local` file:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Database Setup**

Run the SQL commands from `schema.sql` in your Supabase SQL Editor to create the required tables and configure Row Level Security (RLS).

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (dashboard)/     # Protected routes
│   │   ├── dashboard/    # Dashboard page
│   │   ├── history/      # Workout history
│   │   ├── stats/        # Statistics page
│   │   └── workout/new/  # Create workout
│   ├── api/              # API routes
│   ├── sign-in/          # Clerk sign-in
│   └── sign-up/          # Clerk sign-up
├── actions/              # Server Actions
├── components/           # React components
└── lib/                 # Utilities and queries
```

## 🔐 Security

- Authentication via Clerk
- Row Level Security (RLS) in Supabase
- Service role key only for server-side operations

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ☕ and ⚡ by Jorge León