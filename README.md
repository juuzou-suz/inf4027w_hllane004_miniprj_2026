Curate — Online Art Marketplace
   Curate is an online art marketplace built with Next.js and Firebase, featuring artwork listings, live auctions, AI-powered image analysis, and an admin dashboard.
=====================================================================================================
1. How to Run the Application from VS Code (localhost)

Prerequisites
1.1. Before you begin, ensure you have the following installed:
    Node.js - (https://nodejs.org/en/download)
    npm (comes with Node.js) or yarn
    Git - (https://git-scm.com/install/windows)
    VS Code - (https://code.visualstudio.com/download)
 
- Open VS Code terminal and run these commands to verify installations:
    git --version 
    npm --version
    node --version

- Expected output example:
    PS C:\Users\Student\Desktop\inf4027w_hllane004_miniprj_2026> git --version 
    git version 2.53.0.windows.1
    PS C:\Users\Student\Desktop\inf4027w_hllane004_miniprj_2026> npm --version
    11.9.0
    PS C:\Users\Student\Desktop\inf4027w_hllane004_miniprj_2026> node --version
    v24.14.0

=====================================================================================================
1.2. Clone the repo
- Open your terminal and run:
    git clone https://github.com/juuzou-suz/inf4027w_hllane004_miniprj_2026.git

- Then open the cloned folder in VS Code:
    cd inf4027w_hllane004_miniprj_2026
    code .

=====================================================================================================
1.3. Install Dependencies
- In the terminal, ensure you are in the root folder and run:
    npm install

- This will install all required dependencies including React, Next.js, Firebase, Lucide React, and other packages listed in `package.json`.

=====================================================================================================
1.4. Create Environment Variables

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

=====================================================================================================
1.5. Run the Development Server
- Make sure you are in the root folder when running this command:
    npm run dev

- The application will start on http://localhost:3000
- Ctrl + Click the URL link in the terminal to open it in your browser
- You should see the Curate homepage

=====================================================================================================
1.6. To stop the server
- Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac) in the terminal

=====================================================================================================
1.7. Troubleshooting
- Port already in use:
    npx kill-port 3000

- Or use a different port:
    npm run dev -- -p 3001

- Module not found errors:
    # Delete node_modules and package-lock.json
    rm -rf node_modules package-lock.json

    # Reinstall dependencies
    npm install

- Firebase connection errors:
    Verify .env.local file exists in the root directory
    Check that all Firebase environment variables are correctly configured
    Ensure Firebase project is active in the Firebase Console

=====================================================================================================
2. Deployed Site URL
- Live Application: https://curate-nu.vercel.app/
- The application is deployed on Vercel and is accessible at the above URL.

=====================================================================================================

For any issues or questions, please contact: hllane004@myuct.ac.za