import { Fragment, type ReactNode } from "react";

// One-pass substitution. Injected participant text is never interpreted as
// markup or recursively treated as another personalization token.
export function formatPrayerNodes(template: string, values: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\{[a-z_]+\}\})/g).map((part, index) => {
    const token = /^\{\{([a-z_]+)\}\}$/.exec(part);
    if (token && !Object.hasOwn(values, token[1])) throw new Error(`Missing protected prayer token: ${token[1]}`);
    return <Fragment key={index}>{token && Object.hasOwn(values, token[1]) ? values[token[1]] : part}</Fragment>;
  });
}
