"use client";

import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ComponentPropsWithoutRef, JSX } from "react";

import { cn } from "../../lib/utils";

/** Element props plus the hast `node` react-markdown adds — stripped on use so
 * it never reaches the DOM. */
type MdProps<K extends keyof JSX.IntrinsicElements> = ComponentPropsWithoutRef<K> & ExtraProps;

/**
 * Renders creator-authored markdown for learner-facing surfaces.
 *
 * The safety posture is structural rather than a filter to remember:
 *
 * - react-markdown never parses raw HTML unless `rehype-raw` is added — it is
 *   deliberately absent, so `<script>` or an `<img onerror>` in a lesson body
 *   renders as literal text, never as markup.
 * - Every URL-bearing attribute (`href`, `src`) passes through react-markdown's
 *   default URL transform, which allows only http(s), mailto and friends — a
 *   `javascript:` link comes through with an empty URL.
 *
 * A body authored before markdown support may hold plain paragraphs; markdown
 * degrades to exactly that, so nothing needs migrating.
 */
const components: Components = {
  h1: ({ node: _node, ...props }: MdProps<"h1">) => (
    <h1
      className="font-heading text-ink border-hairline mt-6 mb-3 border-b pb-2 text-2xl font-semibold first:mt-0 [&+*]:mt-3"
      {...props}
    />
  ),
  h2: ({ node: _node, ...props }: MdProps<"h2">) => (
    <h2 className="font-heading text-ink mt-6 mb-2 text-xl font-semibold first:mt-0" {...props} />
  ),
  h3: ({ node: _node, ...props }: MdProps<"h3">) => (
    <h3 className="text-ink mt-5 mb-2 text-base font-semibold first:mt-0" {...props} />
  ),
  h4: ({ node: _node, ...props }: MdProps<"h4">) => (
    <h4 className="text-ink mt-4 mb-1.5 text-sm font-semibold first:mt-0" {...props} />
  ),
  p: ({ node: _node, ...props }: MdProps<"p">) => (
    <p className="text-body my-3 first:mt-0 last:mb-0" {...props} />
  ),
  ul: ({ node: _node, ...props }: MdProps<"ul">) => (
    <ul
      className="text-body marker:text-muted-soft my-3 list-disc space-y-1 pl-5 first:mt-0 last:mb-0"
      {...props}
    />
  ),
  ol: ({ node: _node, ...props }: MdProps<"ol">) => (
    <ol
      className="text-body marker:text-muted-soft my-3 list-decimal space-y-1 pl-5 first:mt-0 last:mb-0"
      {...props}
    />
  ),
  li: ({ node: _node, ...props }: MdProps<"li">) => <li className="leading-relaxed" {...props} />,
  blockquote: ({ node: _node, ...props }: MdProps<"blockquote">) => (
    <blockquote
      className="border-hairline-strong text-muted-foreground my-3 border-l-2 pl-3 italic first:mt-0 last:mb-0 [&>p]:my-1"
      {...props}
    />
  ),
  hr: ({ node: _node, ...props }: MdProps<"hr">) => (
    <hr className="border-hairline my-5 first:mt-0 last:mb-0" {...props} />
  ),
  a: ({ node: _node, children, ...props }: MdProps<"a">) => (
    // target=_blank pairs with rel: a creator's reference link should not blow
    // away a half-finished lesson.
    <a
      className="hover:text-ink decoration-hairline-strong font-medium underline underline-offset-2 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ node: _node, alt = "", ...props }: MdProps<"img">) => (
    // Creator-supplied hosts are untrusted by construction (same call the course
    // cover made), so no optimization path fetches them server-side — a plain
    // img, lazy-loaded.
    <img
      className="border-hairline my-3 max-w-full rounded-sm border first:mt-0 last:mb-0"
      alt={alt}
      loading="lazy"
      {...props}
    />
  ),
  table: ({ node: _node, ...props }: MdProps<"table">) => (
    <div className="border-hairline my-3 overflow-x-auto rounded-sm border first:mt-0 last:mb-0">
      <table className="text-body w-full border-collapse text-left text-xs" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }: MdProps<"th">) => (
    <th
      className="bg-surface-strong text-ink border-hairline border-b px-2.5 py-1.5 font-medium"
      {...props}
    />
  ),
  td: ({ node: _node, ...props }: MdProps<"td">) => (
    <td className="border-hairline border-b px-2.5 py-1.5 align-top last:border-b-0" {...props} />
  ),
  pre: ({ node: _node, ...props }: MdProps<"pre">) => (
    <pre
      className="bg-ink text-on-ink overflow-x-auto rounded-sm px-3 py-2.5 text-xs leading-relaxed first:mt-0 last:mb-0 [&_code]:bg-transparent [&_code]:px-0 [&_code]:py-0"
      {...props}
    />
  ),
  code: ({ node: _node, className, children, ...props }: MdProps<"code">) =>
    // A fenced block carries a language- class on its code element; anything
    // else is inline. Inside our dark `pre` the chip styles are stripped again
    // by the descendant reset above.
    className?.includes("language-") ? (
      <code className={cn("font-code", className)} {...props}>
        {children}
      </code>
    ) : (
      <code
        className="bg-surface-strong text-ink font-code rounded-xs px-1 py-px text-[0.875em]"
        {...props}
      >
        {children}
      </code>
    ),
};

export interface MarkdownProps {
  /** Raw markdown source. Never HTML — there is no raw-HTML pass to feed one. */
  children: string;
  className?: string;
}

export const Markdown = ({ children, className }: MarkdownProps) => (
  <div
    className={cn(
      "text-sm leading-relaxed break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
      className,
    )}
  >
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  </div>
);
