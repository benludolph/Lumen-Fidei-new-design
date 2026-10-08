import { and, eq } from "drizzle-orm";
import { db as baseDb } from "./db";
import { currentTrackId } from "./track-context";
import { surveyResponses, trackRequirements } from "@shared/schema";

/**
 * One query boundary for curriculum data. Tables with trackId are curriculum;
 * accounts, messages, personal tools and uploaded assets are deliberately shared.
 * Scope is captured when a query is constructed, never from request bodies.
 * Raw SQL is NOT transformed: maintenance SQL must explicitly include track_id.
 */
export function scopeDatabase<T>(database: T, trackId: string): T {
  const scopeColumn = (table: any) =>
    table?.trackId ?? (table === surveyResponses || table === trackRequirements ? table.track : undefined);
  const field = (table: any) => table?.trackId ? "trackId" : "track";
  function query(builder: any, table?: any, mode?: string): any {
    const column = scopeColumn(table);
    const predicate = column ? eq(column, trackId) : undefined;
    return new Proxy(builder, {
      get(target, key) {
        if (key === "then" || key === "catch" || key === "finally" || key === "toSQL") {
          const method = target[key];
          return typeof method === "function" ? method.bind(target) : method;
        }
        const method = target[key];
        if (typeof method !== "function") return method;
        return (...args: any[]) => {
          if (key === "from") {
            const source = args[0];
            let next = method.apply(target, args);
            const sourceColumn = scopeColumn(source);
            if (sourceColumn) next = next.where(eq(sourceColumn, trackId));
            return query(next, source, "select");
          }
          if (key === "where" && predicate) args[0] = and(predicate, args[0]);
          if ((key === "innerJoin" || key === "leftJoin" || key === "rightJoin" || key === "fullJoin") && scopeColumn(args[0])) {
            args[1] = and(eq(scopeColumn(args[0]), trackId), args[1]);
          }
          if (key === "values" && column) {
            const scoped = (row: any) => ({ ...row, [field(table)]: trackId });
            args[0] = Array.isArray(args[0]) ? args[0].map(scoped) : scoped(args[0]);
          }
          if (key === "set" && column) {
            args[0] = { ...args[0] };
            delete args[0][field(table)];
          }
          if ((key === "onConflictDoUpdate" || key === "onConflictDoNothing") && column && args[0]?.target) {
            const columns = Array.isArray(args[0].target) ? args[0].target : [args[0].target];
            args[0] = { ...args[0], target: columns.includes(table.id) || columns.includes(column) ? columns : [column, ...columns] };
            if (args[0].set) {
              args[0].set = { ...args[0].set };
              delete args[0].set[field(table)];
              args[0].setWhere = and(predicate, args[0].setWhere);
            }
          }
          let next = method.apply(target, args);
          if (key === "set" && mode === "update" && predicate) next = next.where(predicate);
          return query(next, table, mode);
        };
      },
    });
  }
  return new Proxy(database as object, {
    get(target: any, key) {
      if (key === "transaction") return (work: any, config?: any) =>
        target.transaction((tx: any) => work(scopeDatabase(tx, trackId)), config);
      if (key === "query") throw new Error("Use scoped select queries for curriculum data");
      const method = target[key];
      if (typeof method !== "function") return method;
      return (...args: any[]) => {
        const result = method.apply(target, args);
        if (key === "select" || key === "selectDistinct") return query(result);
        if (key === "insert" || key === "update" || key === "delete") {
          const table = args[0];
          const column = scopeColumn(table);
          return query(key === "delete" && column ? result.where(eq(column, trackId)) : result, table, String(key));
        }
        return result;
      };
    },
  }) as T;
}

export const trackDb: typeof baseDb = new Proxy(baseDb, {
  get(_target, key) {
    const scoped = scopeDatabase(baseDb, currentTrackId()) as any;
    return scoped[key];
  },
});
