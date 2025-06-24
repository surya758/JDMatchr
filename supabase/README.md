# JDMatchr Supabase Project

This directory contains the Supabase configuration, migrations, and database schema for JDMatchr.

## Setup Instructions

### 1. Prerequisites

- Supabase CLI installed (`brew install supabase/tap/supabase`)
- Supabase account and project created

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here
```

### 3. Link to Remote Project

```bash
supabase link --project-ref your-project-id
```

### 4. Push Migrations to Remote

```bash
supabase db push
```

## Development Workflow

### Local Development

```bash
# Start local Supabase (optional, for local development)
supabase start

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts
```

### Creating Migrations

```bash
# Create a new migration
supabase migration new migration_name

# Edit the generated SQL file in supabase/migrations/

# Push to remote
supabase db push
```

### Managing Remote Database

```bash
# Pull changes from remote
supabase db pull

# Push local migrations to remote
supabase db push

# Generate types from remote
supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

## Database Schema

### Users Table

- `id` (UUID) - Primary key, references auth.users
- `email` (TEXT) - User email address
- `full_name` (TEXT) - User's full name
- `avatar_url` (TEXT) - Profile picture URL
- `subscription_status` (TEXT) - 'free', 'pro', or 'enterprise'
- `job_credits` (INTEGER) - Number of job screening credits
- `created_at` (TIMESTAMP) - Account creation date
- `updated_at` (TIMESTAMP) - Last update date

### Security

- Row Level Security (RLS) enabled
- Users can only view/update their own profile
- Automatic user profile creation via database trigger

## File Structure

```
supabase/
├── config.toml          # Supabase configuration
├── migrations/          # Database migrations
│   └── *.sql           # Migration files
├── seed.sql            # Initial data (optional)
└── README.md           # This file
```

## Useful Commands

```bash
# Check migration status
supabase migration list

# Repair migration history (if needed)
supabase migration repair

# View logs
supabase logs

# Generate types
supabase gen types typescript --project-id YOUR_PROJECT_ID
```
