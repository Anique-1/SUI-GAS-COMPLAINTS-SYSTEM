# Step-by-Step Guide: Deploying SUI Gas Complaint System to Render

This guide walks you through deploying your **Next.js (App Router) + MongoDB Atlas + Cloudinary** application to [Render](https://render.com).

---

## Prerequisites Checklist

1. A [GitHub](https://github.com/) account with this repository pushed.
2. A [Render](https://render.com/) account.
3. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster connection string.
4. A [Cloudinary](https://cloudinary.com/) account (Cloud Name, API Key, API Secret).

---

## Step 1: Ensure MongoDB Atlas Allows Render Connections

Because Render uses dynamic server IPs, your MongoDB Atlas cluster must allow connections from anywhere:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. In the left sidebar, click **Network Access**.
3. Click **Add IP Address**.
4. Choose **Allow Access From Anywhere** (`0.0.0.0/0`).
5. Click **Confirm**.

---

## Step 2: Push Your Project to GitHub

Make sure your latest code and the newly added `render.yaml` are pushed to GitHub:

```bash
git add .
git commit -m "Add render deployment configuration"
git push origin main
```

---

## Step 3: Create a Web Service on Render

### Option A: Standard Manual Setup (Recommended)

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top right and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and click **Next**.
4. Connect your GitHub account and select your repository (`SUI-GAS-COMPLAINTS-SYSTEM`).
5. Configure the following service settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `sui-gas-complaint-system` (or your choice) |
| **Language / Runtime** | `Node` |
| **Branch** | `main` (or `master`) |
| **Region** | Choose the closest region (e.g. `Singapore` or `Frankfurt`) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

---

## Step 4: Add Environment Variables on Render

Scroll down to the **Environment Variables** section on the same page (or under **Settings > Environment** after creation) and add the following keys and values:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_VERSION` | `20` | Ensures Render uses Node 20 LTS for Next.js 16 |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/sui_gas_db?retryWrites=true&w=majority` | Your MongoDB connection string |
| `SESSION_SECRET` | `your-secure-random-secret-key-32-chars-long` | Secret used to sign session cookies |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Your Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | `123456789012345` | Your Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `your_cloudinary_api_secret` | Your Cloudinary API Secret |
| `EXECUTIVE_REGISTRATION_PASSKEY` | `YourExecSecretPass2026!` | Passkey required to register the first executive account |

> **Note:** Render automatically provides the `PORT` environment variable, and Next.js `npm start` will automatically bind to it.

---

## Step 5: Deploy & Monitor

1. Click **Create Web Service** (or **Deploy**).
2. Render will start the build process:
   - Cloning repository
   - Running `npm install && npm run build`
   - Starting the server with `npm start`
3. Once the logs display `Ready in ... ms`, your service status will change to **Live** with a URL like `https://sui-gas-complaint-system.onrender.com`.

---

## Step 6: Initial System Setup & Verification

1. **Register Executive Account**:
   - Open `https://<your-render-subdomain>.onrender.com/register/executive`
   - Fill in your details and enter the passkey you configured for `EXECUTIVE_REGISTRATION_PASSKEY`.
   - You will be automatically approved and logged in as the primary Executive.

2. **Register Staff / Lawyer Accounts**:
   - Open `/register` to test user registration.
   - Go to `/dashboard/approvals` as Executive to approve staff accounts.

3. **Test File Uploads**:
   - Test submitting complaints and attaching PDF / Excel / CSV files to verify Cloudinary integration.

---

## Important Tips for Render Free Tier

- **Cold Starts**: Render's free tier spins down services after 15 minutes of inactivity. When a new visitor accesses your URL, it can take ~30–50 seconds to wake up.
- **Custom Domains**: You can attach a free custom domain (e.g. `complaints.yourdomain.com`) in the **Settings** tab of your Render service.
