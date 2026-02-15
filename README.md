Prerequisites

1. Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- **VS Code - [Download here](https://code.visualstudio.com/)

=====================================================================================================

2. To pull repo into visual Studio Code:

click Code Button and copy repo "https://github.com/juuzou-suz/inf4027w_hllane004_miniprj_2026.git"

Go to file in Visual Studio Code

Click on New Window , A welcome window should be visible

Click on clone git repository on this welcome window

Paste the repo into the topbar that pops up

Choose an easily findable folder on your computer to save the repo to your computer

You should get a pop up afterwards asking if you want to open repo, click Open

Then you should select Yes when the next pop up appears

=====================================================================================================

3. Install dependency in the terminal (ensure you are in the root folder):
--npm install
=====================================================================================================

4. Create environment variables
   - Create a file called `.env.local` in the root directory
   - Add your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
 
=====================================================================================================

5. COMMAND to run program: MAKE SURE YOU ARE ON THE ROOT FOLDER WHEN YOU RUN THIS COMMAND

npm run dev

=====================================================================================================
6. To stop the server
   - Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac) in the terminal

=====================================================================================================

To make a new branch visual Studio Code: MAKE ONLY ONE BRANCH AND THAT WILL BE YOUR BRANCH. AVOID MAKING MULTIPLE BRANCHES

= Paste these commands in the terminal =

git checkout -b "your-branch-name-here"

[CREATES YOUR BRANCH LOCALLY ON YOUR COMPUTER]

git push --set-upstream origin your-branch-name-here

[PUSHES YOUR BRANCH ONLINE]

To save changes in your branch and push it to GitHub:

= Paste these commands in the terminal =

git add .

[THIS STAGES ALL CHANGES MADE ON BRANCH]

git commit -m "your-message-here"

[THIS SAVES ALL THE STAGED CHANGES UNDER A MESSAGE LIKE "FIXED BUTTON"]

git push

[THIS PUSHES ALL CHANGES TO GITHUB]

To pull changes from GitHub into your branch:

=Paste these commands in the terminal =

git pull origin main

[PULLS ALL CHANGES MADE TO MAIN BRANCH TO YOUR BRANCH ON YOUR COMPUTER]

=====================================================================================================

