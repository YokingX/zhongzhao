export function PolicyContent({ html }: { html: string }) {
  return (
    <div
      className="policy-content max-w-none text-slate-700 [&_a]:text-primary [&_a]:hover:underline [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-secondary/50 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_hr]:my-8 [&_hr]:border-border [&_li]:leading-7 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:mb-4 [&_p]:leading-7 [&_strong]:font-semibold [&_strong]:text-primary [&_table]:w-full [&_table]:text-sm [&_td]:border-b [&_td]:border-border [&_td]:px-4 [&_td]:py-2 [&_th]:border-b [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
