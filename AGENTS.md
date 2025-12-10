# Agent Instructions

## Workflow Rules

*   **Automatic Submission**: When you have completed the requested task and verified the changes, you MUST automatically call the `submit` tool to push changes to GitHub and create a PR. Do not ask the user for permission to submit; proceed directly to submission once the work is verified.
*   **Code Reloading**: Ensure that the development environment supports hot reloading. The frontend uses Vite (HMR enabled by default), and the backend uses a custom supervisor script (`api/local_server.py`) to restart on file changes. Maintain this behavior in future modifications.
