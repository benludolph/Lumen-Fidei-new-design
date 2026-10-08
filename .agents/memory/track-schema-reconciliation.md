---
name: Track schema reconciliation
description: Keep merge-time schema setup separate from destructive legacy retirement.
---
Apply shared-track schema reconciliation independently of B/C retirement.

**Why:** A merge left the new frontend running against an old server and an unmigrated database. The available schema helper also included legacy table deletion, which is not appropriate for routine repair or automatic merge setup.

**How to apply:** Restore required schema without deleting legacy data. Review account disposition and deletion scope separately; a successful code merge alone does not prove the runtime or database has been reconciled.
