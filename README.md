# Daily Habits Tracker

A modern, minimalist web application for tracking your daily habits and visualizing your progress over time. Built with Next.js, React, and Supabase.

## Features

- Create and manage daily habits
- Mark habits as completed with a single click
- Visual color-coded grid to track habit completion over time
- Modern and minimalist UI design
- Responsive layout for desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15.2.3, React 19
- **Styling**: TailwindCSS 4
- **Backend**: Supabase (Authentication and Database)
- **Utilities**: date-fns, Lucide React

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn
- Supabase account (for backend)

### Setup Instructions

1. Clone the repository

```bash
git clone https://github.com/yourusername/dailyhabits.git
cd dailyhabits
```

2. Install dependencies

```bash
npm install
```

3. Set up Supabase

- Create a new project in [Supabase](https://supabase.com/)
- Create the following tables in your Supabase database:

**habits**
```sql
create table habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  name text not null,
  created_at timestamp with time zone default now() not null
);
```

**habit_completions**
```sql
create table habit_completions (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid not null,
  date date not null,
  completed_at timestamp with time zone default now() not null,
  unique(habit_id, date)
);
```

4. Set environment variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Run the development server

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

This application can be easily deployed to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/dailyhabits)

Make sure to add the environment variables in your Vercel project settings.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
