import { sql } from "drizzle-orm";
import { currentTrackId } from "./track-context";

/** Companion activity references move in the same transaction as their lesson. */
export async function remapActivityDays(tx: { execute: (query: any) => Promise<any> }, mapping: { oldDay: number; newDay: number; newWeek?: number }[]) {
  const changes = mapping.filter(m => m.oldDay !== m.newDay);
  for (const phase of [0, 1]) {
    for (const { oldDay, newDay } of changes) {
      const from = phase === 0 ? oldDay : oldDay + 10000;
      const to = phase === 0 ? oldDay + 10000 : newDay;
      for (const name of ["guided_prayer_responses", "lesson_progress", "lesson_workbook_modules"]) {
        await tx.execute(sql`UPDATE ${sql.identifier(name)} SET day_number = ${to}
          WHERE day_number = ${from} AND track_id = ${currentTrackId()}`);
      }
      for (const name of ["chat_flow_responses", "module_overlays"]) {
        for (const prefix of ["day-", "track_a-day", "chat-flow-"]) {
          const pattern = `^${prefix}${from}($|-)`;
          const replacement = `${prefix}${to}\\1`;
          await tx.execute(sql`UPDATE ${sql.identifier(name)}
            SET context_key = regexp_replace(context_key, ${pattern}, ${replacement})
            WHERE track_id = ${currentTrackId()} AND context_key ~ ${pattern}`);
        }
      }
    }
  }
  // Variants share the track's lesson schedule, but retain their own slide content.
  const snapshots = await tx.execute(sql`SELECT id,data FROM track_a_snapshots WHERE track_id = ${currentTrackId()}`);
  for (const snapshot of snapshots.rows) {
    const data = snapshot.data;
    if (!Array.isArray(data?.track_a_content)) continue;
    data.track_a_content = data.track_a_content.map((lesson: any) => {
      const move = mapping.find(m => m.oldDay === lesson.dayNumber);
      return move ? { ...lesson, dayNumber: move.newDay, ...(move.newWeek === undefined ? {} : { weekNumber: move.newWeek }) } : lesson;
    });
    await tx.execute(sql`UPDATE track_a_snapshots SET data = ${JSON.stringify(data)}::json
      WHERE id = ${snapshot.id} AND track_id = ${currentTrackId()}`);
  }
}
