# Agent Instructions

## Workflow Rules

*   **Google Gemini Protocol (Auto-Submit)**: When you (Google Gemini / Jules) have completed a requested task and verified the changes, you MUST automatically call the `submit` tool to push changes to GitHub and create a PR. Do not ask the user for permission to submit; proceed directly to submission once the work is verified.
*   **Code Reloading**: Ensure that the development environment supports hot reloading for both frontend and backend.
    *   **Frontend**: Uses Vite (HMR enabled by default).
    *   **Backend**: Uses a custom supervisor script (`api/local_server.py`) to restart the server whenever code changes (e.g., when you modify logic during a task).
    *   **Constraint**: Maintain this auto-reload behavior in all future modifications.
