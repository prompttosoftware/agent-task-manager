**Pull Request Description: Cleanup & Gitignore Updates**

This pull request focuses on cleaning up the repository and improving the overall development experience. Key changes include:

*   **Removal of temporary files:** Cleared out unnecessary temporary files that were cluttering the directory.
*   **Log cleanup:** Removed old and potentially large log files.
*   **.gitignore update:** Enhanced the `.gitignore` file to prevent tracking of common temporary files, build artifacts, npm artifacts, IDE files, OS generated files, environment files, and log files. This keeps the repository cleaner and reduces unnecessary commits. Specifically, additions include ignoring build artifacts, npm artifacts (`npm-debug.log`, `yarn-error.log`, `.cache`), and consolidating log ignoring patterns.
