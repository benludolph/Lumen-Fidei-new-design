# Deliverance Workbook content editing

Open Administration → Content → Deliverance Workbook. The workbook is shared across tracks; changing the selected lesson track does not select a different workbook.

## Editing and applying

- Edit wording in the grouped fields. Section IDs, answer keys, option values, completion rules, and prayer insertion conditions are not editable.
- Optional blocks can be blank. Additional-note headings and bodies must either both be present or both be blank.
- **Save draft** persists wording without changing participant screens.
- **Preview** renders current local wording with the participant components, synthetic answers, and Catholic/non-Catholic views. It does not fetch or save anyone's answers.
- **Apply changes** activates the saved draft in the current environment, after confirmation. Unsaved edits must be saved first.
- If another editor has saved, reload the latest draft before saving again. Copy any local wording you want to retain before choosing to discard it.

Applying is not publishing. Keep the workbook in preview until the owner explicitly authorizes publishing the combined revision. Do not ship it incidentally with an unrelated fix.

## Code boundaries

- The initial approved text and protected structural defaults live in `shared/workbook-content-defaults.json`. This is a seed, not a competing runtime fallback or a file to overwrite after every edit.
- `shared/workbook-content.ts` defines the editable text catalog, validates documents, and builds sections, categories, choices and prayer templates from protected structures plus applied wording.
- `server/workbook-content.ts` owns editorial APIs and transactional, revision-checked saves. The global editorial row is separate from workbook participant records and track data.
- The workbook provider loads applied content once through the query cache; consumers use selectors rather than importing initial defaults. Admin previews override content in a separate context and query cache.
- Admin editor, preview, navigation protection and layout are focused modules, not additions to the lesson editor's large implementation.
- Initial compatibility exports remain for tests and export scripts. Adding editorial fields requires a deliberate content-document migration; do not silently replace saved documents or reset them to defaults.

## Setup and checks

The additive `scripts/workbook-editor-schema.sql` is included in post-merge setup. No participant table is modified. Reconcile the schema and restart the preview server after merging; client hot reload does not update the server.

Run:

```
npx tsc --noEmit
npx tsx script/test-workbook-content.ts
npx tsx script/test-workbook-stage-one.ts
npx tsx script/test-workbook-stage-two.ts
```

The old resource workbook routes redirect to `/workbook`; their screens and obsolete prayer cards are removed. Current lesson prayer sheets remain supported.

IvyOra uses its supplied static font without added bold. Do not add heavier typography variants or replace it with a different face.
