const SAFE_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4', 'HR', 'I',
  'LI', 'OL', 'P', 'S', 'SPAN', 'STRONG', 'U', 'UL',
]);

const SAFE_CLASSES = new Set([
  'speaking-part1-topic',
  'speaking-part3-layout',
  'speaking-part3-options',
  'speaking-part3-options-center',
  'speaking-part3-option',
]);

export function sanitizeClipboardHtml(html: string): string {
  if (typeof window === 'undefined') return html;

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  parsed.querySelectorAll('script,style,iframe,object,embed,svg,math').forEach((node) => node.remove());

  Array.from(parsed.body.querySelectorAll('*')).forEach((element) => {
    if (!SAFE_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name === 'class') {
        const safeClasses = attribute.value
          .split(/\s+/)
          .filter((className) => SAFE_CLASSES.has(className));
        if (safeClasses.length > 0) {
          element.className = safeClasses.join(' ');
        } else {
          element.removeAttribute('class');
        }
      } else if (attribute.name === 'style') {
        // preserve safe inline styles for Part 3 diagram if needed
        const style = attribute.value;
        if (/display|align-items|justify-content|flex|grid|gap|margin|border|padding|min-|text-align/.test(style)) {
          // keep inline styles
        } else {
          element.removeAttribute('style');
        }
      } else if (element.tagName !== 'A' || attribute.name !== 'href') {
        element.removeAttribute(attribute.name);
        return;
      }

      if (element.tagName === 'A' && attribute.name === 'href') {
        try {
          const url = new URL(attribute.value, window.location.origin);
          if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
            element.removeAttribute('href');
          } else {
            element.setAttribute('href', url.href);
          }
        } catch {
          element.removeAttribute('href');
        }
      }
    });
  });

  return parsed.body.innerHTML;
}

