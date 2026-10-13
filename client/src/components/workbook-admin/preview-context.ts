import { createContext, useContext } from "react";

export const WorkbookPreviewContext = createContext(false);
export const useIsWorkbookPreview = () => useContext(WorkbookPreviewContext);
