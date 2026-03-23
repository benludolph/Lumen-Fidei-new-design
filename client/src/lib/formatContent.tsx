export function formatInlineStyles(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const italicMatch = remaining.match(/\*([^*]+)\*/);

    if (
      boldMatch &&
      boldMatch.index !== undefined &&
      (!italicMatch || italicMatch.index === undefined || boldMatch.index <= italicMatch.index)
    ) {
      if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index));
      parts.push(
        <strong key={key++} style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) parts.push(remaining.slice(0, italicMatch.index));
      parts.push(
        <em key={key++} style={{ fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
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
            <li key={idx} className="type-body-lg" style={{ marginBottom: "6px", color: "rgba(255,255,255,0.75)" }}>
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
          <p key={result.length} className="type-body-lg" style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic", margin: "8px 0" }}>
            {inner}
          </p>
        );
        i++;
        continue;
      }
    }

    if (line.startsWith("---")) {
      result.push(<hr key={result.length} style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.1)", margin: "16px 0" }} />);
      i++;
      continue;
    }

    if (line.trim() === "") {
      result.push(<div key={result.length} style={{ height: "8px" }} />);
      i++;
      continue;
    }

    result.push(
      <p key={result.length} className="type-body-lg" style={{ color: "rgba(255,255,255,0.78)", margin: "4px 0" }}>
        {formatInlineStyles(line)}
      </p>
    );
    i++;
  }

  return result;
}
