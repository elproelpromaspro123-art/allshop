"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AssistantMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-emerald-300/90 underline decoration-emerald-400/30 underline-offset-[3px] transition-colors hover:text-emerald-200"
          >
            {children}
          </a>
        ),
        p: ({ children }) => (
          <p className="text-[13px] leading-[1.75] text-white/75 [&:not(:first-child)]:mt-3">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mt-2.5 space-y-1.5 pl-4 text-[13px] leading-[1.75] text-white/75 [&_li]:relative [&_li]:pl-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-2.5 space-y-1.5 pl-4 text-[13px] leading-[1.75] text-white/75 [&_li]:relative [&_li]:pl-1">
            {children}
          </ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-white/90">{children}</strong>
        ),
        table: ({ children }) => (
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="min-w-full divide-y divide-white/[0.06] text-left text-xs text-white/70">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-white/[0.04]">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 align-top">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
