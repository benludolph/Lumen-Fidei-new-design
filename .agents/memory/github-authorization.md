---
name: GitHub authorization
description: Distinguishes integration status from actual source-control authentication in this workspace.
---
Do not assume that a healthy GitHub integration means command-line Git can authenticate.

**Why:** The integration reported healthy and automatic Git authentication, but GitHub rejected a Git read request. Both integration connection forms also failed. Official documentation identifies Git Providers authentication as separate from general connected services.

**How to apply:** Verify access with a read-only Git request before attempting a push. If credentials are rejected and integration reconnection is unavailable, guide the user to reconnect GitHub in Replit account settings under Git Providers. Never ask for tokens in chat, bypass authentication, or claim a local commit has reached GitHub.
