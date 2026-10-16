# Lumen Fidei: Quick Smoke Test

Run this after a refactor. Use preview/staging and test accounts for a participant, their assigned mentor, and an admin—not real participant data. Sign out before switching accounts.

## Participant
- [ ] Log in. Confirm the dashboard loads, shows lesson cards and progress, and has no error message.
- [ ] Open an unlocked, unfinished lesson. Move through its slides, complete any required activities, and finish it. Return to the dashboard and refresh; confirm it stays completed.
- [ ] Open an available workbook section. Add a harmless sample entry and save. Leave the section and reopen it; confirm the entry is still there.
- [ ] Send the assigned mentor a message such as “Smoke test—please ignore.” Refresh the conversation and confirm it remains visible.

## Mentor
- [ ] Log in as the assigned mentor. Confirm the mentor portal loads and lists the test participant.
- [ ] Open that participant. Confirm their progress is accessible without errors.
- [ ] Open their conversation, confirm the test message arrived, and send a reply. Later, check that the participant receives it.

## Admin
- [ ] Log in as an admin. Confirm the Admin Portal loads.
- [ ] Open **Content → Track content** and select the test track and a lesson. Confirm the editor loads its existing content.
- [ ] Preview the lesson and move through a few slides. Confirm text, controls, and any included media display.
- [ ] In a test lesson, make a small text change, save, then reopen and preview it. Confirm the change persisted. Restore the original text and save again.

**If anything fails:** stop and note the account role, page, action, and what happened. Include a screenshot without passwords or private answers. Do not publish as part of this test.
