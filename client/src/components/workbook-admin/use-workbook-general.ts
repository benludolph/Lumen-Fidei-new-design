import { useWorkbookContent } from "./WorkbookContentProvider";

// Stable general-key contract shared with the content catalog.
export function useWorkbookGeneral() {
  const { text } = useWorkbookContent();
  return {
    intro: [0, 1, 2].map(index => text(`general.intro.${index}`)),
    nonCatholicIntroSecond: text("general.nonCatholicIntroSecond"),
    openingPrayer: text("general.openingPrayer"),
    closingPrayer: text("general.closingPrayer"),
    nonCatholicClosingPrayer: text("general.nonCatholicClosingPrayer"),
    bringToTheLord: text("general.bringToTheLord"),
  };
}
