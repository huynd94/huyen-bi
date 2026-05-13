/**
 * Shared constant for the unauthenticated AI message.
 * Used by useSSEChat (401 branch) and useAISSEChat (client short-circuit)
 * to display a friendly Vietnamese login prompt instead of raw error text.
 *
 * The markdown link renders as a clickable CTA via MarkdownRenderer on all
 * 7 AI pages without requiring per-page changes.
 */
export const UNAUTHENTICATED_AI_MESSAGE =
  "Vui lòng [đăng nhập](/sign-in) để nhận luận giải từ AI.";
