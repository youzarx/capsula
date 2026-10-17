export const escapeXml = (unsafe: string): string => {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export const escapeHtml = escapeXml;

export class Html {
  content = "";

  constructor(strings: TemplateStringsArray, values: any[]) {
    this.content = strings.reduce((result, string, i) => {
      const value = Array.isArray(values[i])
        ? values[i].map(v => (v instanceof Html ? v.toString() : v)).join("")
        : values[i] instanceof Html
          ? values[i].toString()
          : values[i] !== undefined
            ? escapeHtml(String(values[i]))
            : "";
      return result + string + value;
    }, "");
  }

  append(newContent: string | Html | string[] | Html[]) {
    return html`${this.content}${newContent}`;
  }

  appendIf(condition: boolean, newContent: string | Html | string[] | Html[]) {
    if (condition) return this.append(newContent);
    return this;
  }

  toString() {
    return this.content;
  }
}

export const html = (strings: TemplateStringsArray, ...values: any[]): Html => {
  return new Html(strings, values);
};
