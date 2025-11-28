<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Ghk3WBuysB0KVMCCZo4ebvuYREB9B6i4

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Database Setup (Supabase)

### 1. Create Supabase Project

1. Create a new project on [Supabase](https://supabase.com).
2. Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Project Settings > API.
3. Add them to your `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 2. Run SQL Migrations

Go to the **SQL Editor** in your Supabase dashboard and run the following scripts **in order**:

#### Step 1: Main Schema
Open `supabase_schema.sql` and run the entire script to create:
- All tables (users, locations, items, inventory, etc.)
- Enums (roles, statuses, payment methods, etc.)
- RLS policies
- Triggers and functions

#### Step 2: Settings Tables
Open `supabase_settings_migration.sql` and run it to create:
- Payment methods table
- Expense categories table
- Company settings table

### 3. Create Your Account

1. Run the app: `npm run dev`
2. Click "Criar Conta" (Create Account)
3. Fill in your details and create your account
4. Check your email for verification (if enabled)

### 4. Promote Yourself to Admin

After creating your account, run this SQL in Supabase SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
update public.users 
set role = 'ADMIN' 
where id = (
  select id from auth.users where email = 'your-email@example.com'
);
```

Or use the helper file `supabase_admin_helper.sql` (update the email first).

### 5. Verify Setup

1. Refresh the app
2. You should now see all admin features
3. Go to **Definições** (Settings) to configure:
   - Payment methods
   - Expense categories
   - Company information
   - Default currency

## Authentication

The app now includes full authentication:
- **Login/Signup** pages with email/password
- **Session management** with Supabase Auth
- **Logout** button in the header
- **Protected routes** - must be logged in to access the app

## Features

- ✅ Multi-user authentication
## Security / Access Control

- The app no longer supports client-side impersonation ("Simular Usuário"). The UI option to switch the active user has been removed.
- Database row-level security (RLS) on `public.users` was tightened: users can only SELECT/UPDATE their own profile unless they are an Admin or General Manager. This enforces that regular users cannot read or modify other users' accounts.

- ✅ Role-based permissions (Admin, Manager, Worker)
- ✅ Inventory management
- ✅ Requisitions workflow
- ✅ Performance tracking
- ✅ POS & Financial transactions
- ✅ Invoice generation
- ✅ Payroll calculation
- ✅ Settings management

## Deploy to Netlify

### Quick Deploy

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com) and sign up

2. **Connect Repository**
   - Click "Add new site" > "Import an existing project"
   - Connect your Git provider (GitHub, GitLab, Bitbucket)
   - Select this repository

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - These are already configured in `netlify.toml`

4. **Set Environment Variables**
   Go to Site settings > Environment variables and add:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy automatically
   - Your site will be live at `https://your-site-name.netlify.app`

### Manual Deploy (without Git)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Post-Deployment

1. Run the SQL migrations in your Supabase project
2. Create your admin account through the app
3. Use the `supabase_admin_helper.sql` to promote yourself to Admin
4. Configure your company settings

## Support

For issues or questions, please check the documentation or contact support.
