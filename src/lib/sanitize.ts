import sanitizeHtml from "sanitize-html";

/**
 * Sanitizer for rich-text HTML stored in the database (CMS rich-text blocks,
 * blog post bodies). Anything not on the allowlist below is removed: scripts,
 * styles, event-handler attributes, iframes/embeds, forms, inline styles and
 * classes, and URLs with schemes other than http/https/mailto.
 *
 * Prefer calling this on the server (server components, route handlers). It is
 * isomorphic, so a client component *can* import it, but that pulls
 * sanitize-html + htmlparser2 + postcss into that route's client bundle.
 */

const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

// Heading ids are kept so in-page anchors (e.g. href="#jobs") keep working.
const SAFE_ID = /^[A-Za-z][\w-]{0,63}$/;

const keepSafeHeadingId: sanitizeHtml.Transformer = (tagName, attribs) => {
  const { id, ...rest } = attribs;
  return { tagName, attribs: id && SAFE_ID.test(id) ? { ...rest, id } : rest };
};

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...HEADING_TAGS,
    "p", "br", "hr", "div", "span",
    "ul", "ol", "li",
    "blockquote", "code", "pre",
    "strong", "b", "em", "i", "u", "s", "del", "sub", "sup", "mark",
    "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td",
    "a", "img", "figure", "figcaption",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height"],
    ol: ["start"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
    ...Object.fromEntries(HEADING_TAGS.map((tag) => [tag, ["id"]])),
  },
  // Only these classes survive; arbitrary utility classes could be used to
  // overlay or restyle the surrounding page.
  allowedClasses: { p: ["lead"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowedSchemesAppliedToAttributes: ["href", "src"],
  // Relative URLs ("/about", "#jobs", "image.png") are allowed; "//host" is not.
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    ...Object.fromEntries(HEADING_TAGS.map((tag) => [tag, keepSafeHeadingId])),
    a: (tagName, attribs) => {
      const next = { ...attribs };
      if (next.target !== "_blank" && next.target !== "_self") delete next.target;
      if (next.target === "_blank") next.rel = "noopener noreferrer";
      return { tagName, attribs: next };
    },
  },
};

/** Sanitize rich-text HTML for rendering with dangerouslySetInnerHTML. */
export function sanitizeRichText(html: unknown): string {
  if (typeof html !== "string" || html.length === 0) return "";
  return sanitizeHtml(html, RICH_TEXT_OPTIONS);
}
