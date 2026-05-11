export function formatInlineStyles(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const italicMatch = remaining.match(/\*([^*]+)\*/);

    const candidates = [
      linkMatch ? { match: linkMatch, type: "link" as const } : null,
      boldMatch ? { match: boldMatch, type: "bold" as const } : null,
      italicMatch ? { match: italicMatch, type: "italic" as const } : null,
    ].filter(Boolean) as { match: RegExpMatchArray; type: "link" | "bold" | "italic" }[];

    candidates.sort((a, b) => (a.match.index ?? 0) - (b.match.index ?? 0));
    const first = candidates[0];

    if (!first) {
      parts.push(remaining);
      break;
    }

    if ((first.match.index ?? 0) > 0) parts.push(remaining.slice(0, first.match.index));

    if (first.type === "link") {
      parts.push(
        <a
          key={key++}
          href={first.match[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--brand, #a78bfa)", textDecoration: "underline", textUnderlineOffset: "3px" }}
        >
          {first.match[1]}
        </a>
      );
    } else if (first.type === "bold") {
      parts.push(
        <strong key={key++} style={{ fontWeight: 600, color: "var(--white-90)" }}>
          {first.match[1]}
        </strong>
      );
    } else {
      parts.push(
        <em key={key++} style={{ fontStyle: "italic", color: "var(--white-70)" }}>
          {first.match[1]}
        </em>
      );
    }
    remaining = remaining.slice((first.match.index ?? 0) + first.match[0].length);
  }
  return parts;
}

export function formatContent(content: string): JSX.Element[] {
  const lines = content.split("\n");
  const result: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      result.push(
        <ol key={result.length} style={{ listStyleType: "decimal", paddingLeft: "20px", margin: "10px 0" }}>
          {listItems.map((item, idx) => (
            <li key={idx} className="type-body-lg" style={{ marginBottom: "6px", color: "var(--white-70)" }}>
              {formatInlineStyles(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.startsWith("**") && line.endsWith("**")) {
      result.push(
        <h3 key={result.length} className="type-display-sm" style={{ color: "white", margin: "18px 0 6px" }}>
          {line.replace(/\*\*/g, "")}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**") && line.length > 2) {
      const inner = line.slice(1, -1);
      if (!inner.includes("*")) {
        result.push(
          <p key={result.length} className="type-body-lg" style={{ color: "var(--white-50)", fontStyle: "italic", margin: "8px 0" }}>
            {inner}
          </p>
        );
        i++;
        continue;
      }
    }

    if (line.startsWith("---")) {
      result.push(<hr key={result.length} style={{ border: "none", borderTop: "0.5px solid var(--white-10)", margin: "16px 0" }} />);
      i++;
      continue;
    }

    if (line.trim() === "") {
      result.push(<div key={result.length} style={{ height: "8px" }} />);
      i++;
      continue;
    }

    result.push(
      <p key={result.length} className="type-body-lg" style={{ color: "var(--white-80)", margin: "4px 0" }}>
        {formatInlineStyles(line)}
      </p>
    );
    i++;
  }

  return result;
}
