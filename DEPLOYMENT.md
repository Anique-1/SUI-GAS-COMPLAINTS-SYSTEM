# Production Deployment Guide: SUI Gas Complaint System

Follow these step-by-step instructions to deploy the SUI Gas Pipeline Pakistan Gas Complaint System to production using **Vercel** (hosting), **Supabase** (auth and database), and **Cloudinary** (file attachments storage).

---

## Step 1: Create a GitHub Repository & Push Your Code

Vercel deploys directly from GitHub, meaning any changes you push to GitHub will automatically trigger a new deployment.

1. Open your terminal in the project directory (`e:\SUI Gas Complaint System`).
2. Run the following commands to initialize Git and commit your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SUI Gas Complaint System with PDF download fix"
   ```
3. Go to [GitHub](https://github.com/) and create a new **private** or **public** repository named `sui-gas-complaint-system`.
4. Run the commands provided by GitHub to link your local project to GitHub and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/your-username/sui-gas-complaint-system.git
   git push -u origin main
   ```

---

## Step 2: Configure Supabase Production Database

You need a live Supabase project to handle user authentication, employee/lawyer credentials, and complaint records.

1. Go to the [Supabase Dashboard](https://supabase.com/) and create a new project.
2. Go to the **SQL Editor** tab on the left sidebar.
3. Paste and run the following database schema commands to create the required tables and configure Row Level Security (RLS) policies:

   ```sql
   -- Create profiles table
   CREATE TABLE public.profiles (
       id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
       name TEXT NOT NULL,
       email TEXT NOT NULL UNIQUE,
       phone TEXT NOT NULL,
       role TEXT CHECK (role IN ('employee', 'executive', 'lawyer')) NOT NULL,
       role_id TEXT NOT NULL,
       status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create complaints table
   CREATE TABLE public.complaints (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       register_date DATE NOT NULL,
       description TEXT,
       created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
       images TEXT[] NOT NULL DEFAULT '{}',
       pdfs TEXT[] NOT NULL DEFAULT '{}',
       public_link_token TEXT UNIQUE,
       public_link_active BOOLEAN NOT NULL DEFAULT FALSE,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security (RLS)
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

   -- Row Level Security Policies for profiles table
   CREATE POLICY "Allow users to read all profiles" ON public.profiles
       FOR SELECT USING (true);

   CREATE POLICY "Allow users to insert their own profile" ON public.profiles
       FOR INSERT WITH CHECK (auth.uid() = id);

   CREATE POLICY "Allow users to update their own profile" ON public.profiles
       FOR UPDATE USING (auth.uid() = id);

   CREATE POLICY "Allow executives full control on profiles" ON public.profiles
       FOR ALL USING (
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE id = auth.uid() AND role = 'executive' AND status = 'approved'
           )
       );

   -- Row Level Security Policies for complaints table
   CREATE POLICY "Allow public select for active public link tokens" ON public.complaints
       FOR SELECT USING (public_link_active = true);

   CREATE POLICY "Allow authenticated users to read complaints" ON public.complaints
       FOR SELECT USING (
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE id = auth.uid() AND status = 'approved'
           )
       );

   CREATE POLICY "Allow approved employees and executives to insert complaints" ON public.complaints
       FOR INSERT WITH CHECK (
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE id = auth.uid() AND role IN ('employee', 'executive') AND status = 'approved'
           )
       );

   CREATE POLICY "Allow employees to update their own complaints" ON public.complaints
       FOR UPDATE USING (
           auth.uid() = created_by AND 
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE id = auth.uid() AND role = 'employee' AND status = 'approved'
           )
       );

   -- Note: Executives can update any complaints, so we define:
   CREATE POLICY "Allow executives to update all complaints" ON public.complaints
       FOR UPDATE USING (
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE id = auth.uid() AND role = 'executive' AND status = 'approved'
           )
       );

   -- Delete Policy
   CREATE POLICY "Allow employees to delete their own complaints" ON public.complaints
       FOR DELETE USING (
           auth.uid() = created_by AND 
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE id = auth.uid() AND role = 'employee' AND status = 'approved'
           )
       );

   CREATE POLICY "Allow executives to delete any complaints" ON public.complaints
       FOR DELETE USING (
           EXISTS (
               SELECT 1 FROM public.profiles
               WHERE id = auth.uid() AND role = 'executive' AND status = 'approved'
           )
       );
   ```

4. Head to **Project Settings** > **API** on Supabase to fetch your:
   * **Project URL**
   * **Project Anon API Key**

---

## Step 3: Get Cloudinary API Keys

1. Sign up or log in to [Cloudinary](https://cloudinary.com/).
2. From your Dashboard, locate your Cloudinary product credentials:
   * **Cloud Name**
   * **API Key**
   * **API Secret**

---

## Step 4: Import and Deploy to Vercel

1. Log in to [Vercel](https://vercel.com/) and click the **Add New...** > **Project** button.
2. Find the GitHub repository (`sui-gas-complaint-system`) you pushed in Step 1 and click **Import**.
3. Under the **Environment Variables** panel, copy and paste the credentials from your `.env.local` file:

   | Key | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_SUPABASE_URL` | *Your Supabase Project URL* |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Your Supabase Anon API Key* |
   | `CLOUDINARY_CLOUD_NAME` | *Your Cloudinary Cloud Name* |
   | `CLOUDINARY_API_KEY` | *Your Cloudinary API Key* |
   | `CLOUDINARY_API_SECRET` | *Your Cloudinary API Secret* |
   | `EXECUTIVE_REGISTRATION_PASSKEY` | *A secure registration passcode for executives (e.g. `SuiGasExecPass2026`)* |

4. Click **Deploy**. Vercel will build the Next.js production code and give you a live domain link (e.g., `sui-gas-complaint-system.vercel.app`) in under 2 minutes!

---

## Step 5: Verification Checklist

* **First User**: Register your first **Executive** account at `/register/executive` using the passkey you configured. They will be auto-approved and can start approving other personnel.
* **Employee Registration**: Register an **Employee** account on `/register`. Log in as the Executive, approve them in the **Approvals** tab, and then log back in as the Employee to upload documents and log complaints.
* **Lawyer Audit**: Register a **Lawyer** account. Approve them, log in, and verify they have read-only access to records and can download files, but cannot create or edit records.
