/** Retired IDs are never reused. Original rows remain archived in the database. */
export const RETIRED_WORKBOOK_SECTION_IDS = [8, 9, 10, 12, 17, 18, 19, 21] as const;
export const WORKBOOK_CATEGORY_SECTIONS: Record<number, number[]> = {
  1: [1, 4, 11, 13],
  2: [5, 20],
  3: [15, 16, 22, 23, 25],
  4: [6, 7, 24],
  5: [2, 3, 14],
};

export const WORKBOOK_SECTION_CATEGORY: Record<number, number> =
  Object.fromEntries(Object.entries(WORKBOOK_CATEGORY_SECTIONS)
    .flatMap(([category, sections]) => sections.map(section => [section, Number(category)])));

export const ACTIVE_WORKBOOK_SECTION_IDS = Object.keys(WORKBOOK_SECTION_CATEGORY).map(Number);
export const isActiveWorkbookSection = (id: number) => ACTIVE_WORKBOOK_SECTION_IDS.includes(id);
