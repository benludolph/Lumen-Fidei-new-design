import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, pool } from "../server/db";
import { scopeDatabase } from "../server/track-db";
import { trackAContent, prelimModules, userAnswers, moduleOverlays, trackASnapshots, prayerCompletions } from "../shared/schema";

const rollback = new Error("test rollback");
try {
  await db.transaction(async tx => {
    const a = scopeDatabase(tx, "isolation-test-one");
    const b = scopeDatabase(tx, "isolation-test-two");
    for (const scoped of [a,b]) {
      await scoped.insert(trackAContent).values({ dayNumber: 1, weekNumber: 1, centralTheme: "isolated", trackId: "A" });
      await scoped.insert(prelimModules).values({ position: 1, title: "intro" });
      await scoped.insert(userAnswers).values({ userId: -1, dayNumber: 1, content: "first" });
      await scoped.insert(prayerCompletions).values({ userId: -1, dayNumber: 1, period: "morning" });
      await scoped.insert(moduleOverlays).values({ contextKey: "day-1" }).onConflictDoUpdate({ target: moduleOverlays.contextKey, set: { text: "updated" } });
      await scoped.insert(trackASnapshots).values({ name: "snapshot", data: {} });
    }
    await a.insert(userAnswers).values({ userId: -1, dayNumber: 1, content: "updated" }).onConflictDoUpdate({ target: [userAnswers.userId, userAnswers.dayNumber], set: { content: "updated" } });
    assert.equal((await a.select().from(userAnswers))[0].content,"updated");
    assert.equal((await b.select().from(userAnswers))[0].content,"first");
    const [one] = await a.select().from(trackAContent);
    assert.equal(one.trackId,"isolation-test-one");
    assert.equal((await b.select().from(trackAContent).where(eq(trackAContent.id,one.id))).length,0);
    await b.update(trackAContent).set({centralTheme:"attack"}).where(eq(trackAContent.id,one.id));
    assert.equal((await a.select().from(trackAContent))[0].centralTheme,"isolated");
    const joined = await a.select().from(userAnswers).innerJoin(trackAContent, eq(userAnswers.dayNumber,trackAContent.dayNumber));
    assert.equal(joined.length,1);
    await a.delete(trackAContent);
    assert.equal((await a.select().from(trackAContent)).length,0);
    assert.equal((await b.select().from(trackAContent)).length,1);
    await a.transaction(async nested => { assert.equal((await nested.select().from(prelimModules)).length,1); });
    throw rollback;
  });
} catch (error) {
  if (error !== rollback) throw error;
  console.log("Track query isolation passed; test records rolled back.");
} finally { await pool.end(); }
