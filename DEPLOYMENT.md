# Production Deployment Guide: SUI Gas Complaint System (MongoDB Edition)

Follow these step-by-step instructions to deploy the SUI Gas Pipeline Pakistan Gas Complaint System to production using **Vercel** (hosting), **MongoDB Atlas** (database), and **Cloudinary** (file attachments storage).

---

## Step 1: Create a GitHub Repository & Push Your Code

Vercel deploys directly from GitHub, meaning any changes you push to GitHub will automatically trigger a new deployment.

1. Open your terminal in the project directory (`e:\SUI Gas Complaint System`).
2. Run the following commands to initialize Git and commit your code:
   ```bash
   git init
   git add .
   git commit -m "Migration to MongoDB with custom cryptographic cookie authentication"
   ```
3. Go to [GitHub](https://github.com/) and create a new repository (e.g. `SUI-GAS-COMPLAINTS-SYSTEM`).
4. Link your local project to GitHub and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/your-username/SUI-GAS-COMPLAINTS-SYSTEM.git
   git push -u origin main
   ```

---

## Step 2: Configure MongoDB Atlas Production Database

You need a live MongoDB database to handle user accounts, role-based approvals, and pipeline complaint entries.

1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new project and select the **M0 Free Tier** database cluster.
3. Under **Database Access**, create a database user with read and write permissions (remember the username and password).
4. Under **Network Access**, add an IP Access List entry. Set the IP address to `0.0.0.0/0` (Allow Access from Anywhere). 
   * *Why?* Vercel uses dynamic serverless functions, so the database must allow incoming connections from Vercel's changing server IPs.
5. Click **Database** under Deployment, then click the **Connect** button on your cluster.
6. Select **Drivers** and copy your **Connection String**. It will look similar to this:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sui_gas_db?retryWrites=true&w=majority`
7. Replace `<username>` and `<password>` with your created database credentials, and make sure `sui_gas_db` (or another name) is specified as the database path.

---

## Step 3: Get Cloudinary API Keys

1. Sign up or log in to [Cloudinary](https://cloudinary.com/).
2. From your Dashboard, locate your Cloudinary product credentials:
   * **Cloud Name**
   * **API Key**
   * **API Secret**

---

## Step 4: Import and Deploy to Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New...** > **Project**.
2. Find your repository (`SUI-GAS-COMPLAINTS-SYSTEM`) and click **Import**.
3. Under the **Environment Variables** panel, add the following credentials:

   | Key | Value |
   | :--- | :--- |
   | `MONGODB_URI` | *Your MongoDB Atlas Connection String (from Step 2)* |
   | `SESSION_SECRET` | *A secure random string used to sign user cookies (e.g. `sui-gas-system-secret-2026`)* |
   | `CLOUDINARY_CLOUD_NAME` | *Your Cloudinary Cloud Name* |
   | `CLOUDINARY_API_KEY` | *Your Cloudinary API Key* |
   | `CLOUDINARY_API_SECRET` | *Your Cloudinary API Secret* |
   | `EXECUTIVE_REGISTRATION_PASSKEY` | *A secure passcode for Executive register (e.g. `SuiGasExecPass2026`)* |

4. Click **Deploy**. Vercel will build the Next.js production code and give you a live domain link in under 2 minutes!

---

## Step 5: Verification Checklist

* **First User**: Register your first **Executive** account at `/register/executive` using the passkey you configured in the environment variables. They will be auto-approved and can start approving other personnel.
* **Employee Registration**: Register an **Employee** account on `/register`. Log in as the Executive, approve them in the **Approvals** tab, and then log back in as the Employee to upload documents and log complaints.
* **Lawyer Audit**: Register a **Lawyer** account. Approve them, log in, and verify they have read-only access to records and can download files, but cannot create or edit records.
