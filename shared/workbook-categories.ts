/** Stage 1 includes all 25 sections; no retirement or unlock-rule changes. */
export const WORKBOOK_CATEGORY_SECTIONS: Record<number, number[]> = {
  1: [1, 4, 8, 9, 11, 13, 18],
  2: [5, 12, 19, 20, 21],
  3: [15, 16, 17, 22, 23, 25],
  4: [6, 7, 24],
  5: [2, 3, 10, 14],
};

export const WORKBOOK_SECTION_CATEGORY: Record<number, number> =
  Object.fromEntries(Object.entries(WORKBOOK_CATEGORY_SECTIONS)
    .flatMap(([category, sections]) => sections.map(section => [section, Number(category)])));
