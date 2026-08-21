---
name: Program release compatibility
description: Durable rules for delivering reusable programs while preserving existing Track A participants.
---

Published program releases are immutable, and rollback means creating a new draft from an older release. Enrollments stay pinned to their assigned program, release, and cohort; publishing a newer release must not move existing participants.

Track A is the compatibility baseline. Release-backed content is adapted into the existing Track A participant endpoint shapes so prayers, workbook state, specialized slides, URLs, and established participant behavior continue to work. Track B and Healing remain available as legacy programs under Operations unless a separate migration is explicitly requested.

Programs created outside Track A must remain participant-deliverable through a generic program library and lesson flow sourced from each enrollment's pinned curriculum. Generic program creation and assignment must not become admin-only dead ends.

**Why:** Existing participants already have substantial state in legacy feature-specific tables, so replacing Track A would create unnecessary migration risk. At the same time, a reusable catalog is only real if newly created programs have a complete participant delivery path.

**How to apply:** Keep Track A release progress compatible with legacy prayer/workbook/answer data, use the pinned cohort for release-aware timing, and deliver non-Track-A lessons and progress directly from the enrollment's pinned release.