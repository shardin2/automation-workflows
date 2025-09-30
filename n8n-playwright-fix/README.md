# n8n Playwright Fix Helper

This script automates your n8n UI to diagnose a workflow and apply a basic fix (activate if inactive).
It collects screenshots and recent execution error details to speed up triage.

Requirements
- Node.js 18+ (you appear to have Node 22)
- macOS (your OS)

Setup
1) Create a copy of .env.example and fill in credentials
   cp .env.example .env
   - N8N_EMAIL and N8N_PASSWORD are required for login (no 2FA)
   - N8N_BASE_URL defaults to your instance
   - N8N_WORKFLOW_ID defaults to the one you provided

2) Install dependencies and browser binaries
   npm install
   npm run playwright:install

3) Run the fix script
   npm run fix

What it does
- Logs into the n8n UI and stores a session under .auth/state.json for reuse
- Navigates to /workflow/<ID>
- Activates the workflow if it’s inactive
- Opens Executions tab, captures recent errors, and stores a screenshot under artifacts/
- Prints a summary and exit code indicating success/failure

Notes
- This script does not create or edit credentials; if nodes are failing due to missing credentials or secrets, please add them in n8n and rerun.
- If you use SSO/2FA, supply a session storage file instead or temporarily use a service account without 2FA.
- Extend src/fix-workflow.js to implement additional targeted fixes once we identify the root cause from the diagnostics.
