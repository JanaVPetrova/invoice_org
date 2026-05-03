# Invoice Organizer — Setup Guide

Automatically detects receipts in your Gmail, saves them to Google Drive, and logs them to a Google Sheet for your Steuerberaterin.

---

## What you need

- A Google account (your existing Gmail)
- A free Gemini API key (takes 2 minutes)
- Node.js installed (only needed for the automated deployment workflow)

---

## Step 1 — Get a free Gemini API key

1. Go to [aistudio.google.com](https://aistudio.google.com) and sign in with your Google account
2. Click **Get API key** → **Create API key**
3. A dialog asks you to pick a Google Cloud project — this is unrelated to your Apps Script project. Click **Create new project** and confirm. It's free and just used to track your API quota.
4. Copy the generated key and keep it somewhere safe for now

---

## Step 2 — Create the Apps Script project

1. Go to [script.google.com](https://script.google.com)
2. Click **New project** (top left)
3. Rename the project to `Invoice Organizer` (click the title at the top)

---

## Step 3 — Add the script files

The editor starts with one file called `Code.gs`. You need to create 5 files total.

For **each** of the files below:
- Click the **+** button next to "Files" in the left sidebar → choose **Script**
- Name it exactly as shown (without `.gs` — the editor adds it)
- Delete any placeholder content and paste in the full contents from the corresponding `.gs` file in this project

| File to create | Paste contents from |
|---|---|
| `config` | `config.gs` |
| `main` | `main.gs` |
| `gemini` | `gemini.gs` |
| `drive` | `drive.gs` |
| `sheets` | `sheets.gs` |

You can delete the original `Code.gs` file — it won't be used.

---

## Step 4 — Add your Gemini API key

1. In the Apps Script editor, click the **gear icon** (Project Settings) in the left sidebar
2. Scroll down to **Script Properties**
3. Click **Add script property**
4. Set **Property** to `GEMINI_API_KEY` and **Value** to the key you copied in Step 1
5. Click **Save script properties**

---

## Step 5 — Run setup

1. In the editor, open `main.gs`
2. In the toolbar, select the function `setup` from the dropdown (it may default to another function name)
3. Click **Run**
4. A dialog will appear asking you to authorize permissions — click **Review permissions**
5. Choose your Google account
6. You will see a warning "Google hasn't verified this app" — click **Advanced** → **Go to Invoice Organizer (unsafe)**
   *(This is normal for personal scripts you write yourself)*
7. Click **Allow** to grant access to Gmail, Drive, and Sheets

The setup function will create:
- A `Tax Receipts` folder in your Google Drive
- A `Tax Deductions` spreadsheet in Google Drive
- A `tax/processed` label in Gmail
- An hourly trigger that runs automatically

The URL of your new spreadsheet is printed in the **Execution log** at the bottom of the editor — save it.

---

## Step 6 — Verify it works

1. In the editor, select the function `processNewEmails` from the dropdown and click **Run**
2. Check the **Execution log** — it should complete without errors
3. Send yourself an email with a PDF invoice attached and wait up to an hour (or run `processNewEmails` manually again) to see it appear in the sheet

---

## How to handle physical / snail mail receipts

1. Scan or photograph the receipt
2. Email it to yourself (your own Gmail address) with the image or PDF attached
3. The script will pick it up on the next hourly run

---

## Your spreadsheet columns

| Column | Description |
|---|---|
| Date | Date on the receipt |
| Vendor | Company or seller name |
| Amount | Amount on the document |
| Currency | e.g. EUR |
| Category | e.g. software, travel, office_supplies |
| Deduction Reason | Why it's deductible under German tax law |
| Receipt | Direct link to the file in Google Drive |
| Email Subject | Original email subject for reference |
| Processed At | When the script processed it |

---

## Sharing with your Steuerberaterin

At tax time:
1. Open the `Tax Deductions` spreadsheet
2. **File → Share → Share with others** — enter her email address (view-only is enough)
3. Also share the `Tax Receipts` folder in Google Drive the same way so she can access the original documents

---

## Automated deployment with clasp

Instead of copy-pasting files into the browser editor, you can push changes directly from this folder using the terminal.

### First-time setup

```bash
# Install dependencies
npm install

# Log in to Google (opens a browser window)
npx clasp login

# Link this folder to your Apps Script project
# Find your Script ID in the editor: Project Settings → IDs → Script ID
# Then paste it into .clasp.json, replacing YOUR_SCRIPT_ID
```

Open [.clasp.json](.clasp.json) and replace `YOUR_SCRIPT_ID` with the value from the Apps Script editor:
- Open your project at [script.google.com](https://script.google.com)
- Click the **gear icon** (Project Settings)
- Copy the **Script ID**

### Deploying changes

```bash
# Push local files to Apps Script (overwrites what's in the editor)
npm run push

# Push and create a new named deployment version
npm run deploy
```

`npm run push` is enough for most changes. `npm run deploy` additionally creates a versioned snapshot in Apps Script (visible under **Deploy → Manage deployments**), which is useful for tracking releases.

### Workflow for updates

1. Edit `.gs` files locally
2. Run `npm run push` to sync
3. Open the Apps Script editor to verify, or run `processNewEmails` manually to test

---

## GitHub deployment (auto-deploy on push)

Every push to `main` automatically deploys to Google Apps Script via GitHub Actions. Setup is a one-time process.

### Step 1 — Initialize git and push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a new repository on [github.com](https://github.com/new) and follow the instructions to push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2 — Get your clasp credentials

The GitHub Action needs to authenticate with Google on your behalf. After running `npx clasp login` (from the clasp setup above), your credentials are stored locally:

```bash
cat ~/.clasprc.json
```

Copy the entire output — it looks like `{"token":{"access_token":"..."},...}`.

### Step 3 — Add the secret to GitHub

1. Go to your repository on GitHub
2. **Settings → Secrets and variables → Actions → New repository secret**
3. Name: `CLASPRC_JSON`
4. Value: paste the contents of `~/.clasprc.json`
5. Click **Add secret**

### Step 4 — Verify

Push any change to `main` and go to the **Actions** tab in your GitHub repository. You should see the workflow run and complete successfully. From then on, every push to `main` deploys automatically.

---

## Troubleshooting

**"GEMINI_API_KEY not found" error**
You skipped Step 4 or made a typo in the property name. It must be exactly `GEMINI_API_KEY`.

**"Google hasn't verified this app" warning**
This is expected for personal scripts. Click Advanced → Go to Invoice Organizer (unsafe) → Allow.

**An email was not picked up**
Check that the attachment is a PDF or image file. Other formats (e.g. `.zip`, `.docx`) are skipped. You can also run `processNewEmails` manually at any time.

**The trigger isn't running**
In the editor go to **Triggers** (clock icon in the left sidebar) and confirm the `processNewEmails` trigger is listed. If not, run `setup` again.
