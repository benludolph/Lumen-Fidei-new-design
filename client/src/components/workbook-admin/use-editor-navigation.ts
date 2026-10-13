import { useEffect, useRef } from "react";

// Shared by the editor and its parent tabs. Capture runs before Radix tab handlers.
let dirtyEditor = false;
export function confirmWorkbookNavigation() {
  return !dirtyEditor || window.confirm("You have unsaved workbook changes. Leave without saving them?");
}
export function useEditorNavigation(dirty: boolean, busy = false) {
  const dirtyRef = useRef(dirty || busy);
  dirtyRef.current = dirty || busy;
  useEffect(() => { dirtyEditor = dirty || busy; }, [dirty, busy]);
  useEffect(() => {
    const currentUrl = window.location.href;
    const currentState = window.history.state;
    const unload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target || !dirtyRef.current || target.getAttribute("aria-selected") === "true") return;
      if (!confirmWorkbookNavigation()) { event.preventDefault(); event.stopPropagation(); }
    };
    const mousedown = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("[role='tab']") : null;
      if (!target || event.button !== 0 || !dirtyRef.current || target.getAttribute("aria-selected") === "true") return;
      if (!confirmWorkbookNavigation()) { event.preventDefault(); event.stopPropagation(); }
    };
    const keydown = (event: KeyboardEvent) => {
      if (!dirtyRef.current || !["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(event.key)) return;
      if (!(event.target instanceof Element) || !event.target.closest("[role='tab']")) return;
      if (!confirmWorkbookNavigation()) { event.preventDefault(); event.stopPropagation(); }
    };
    const popstate = (event: PopStateEvent) => {
      if (!dirtyRef.current || confirmWorkbookNavigation()) return;
      event.stopImmediatePropagation();
      window.history.replaceState(currentState, "", currentUrl);
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("popstate", popstate, true);
    document.addEventListener("click", click, true);
    document.addEventListener("mousedown", mousedown, true);
    document.addEventListener("keydown", keydown, true);
    return () => {
      dirtyEditor = false;
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("popstate", popstate, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("mousedown", mousedown, true);
      document.removeEventListener("keydown", keydown, true);
    };
  }, []);
}
