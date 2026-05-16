# Keyboard Walkthrough — Flow C: AI Chat — Send Message & Copy Response

## Flow Description

User navigates to the AI chat page (`/ai-chat`), types a message (or selects a suggestion), sends it, waits for the AI response, and copies the response text. This flow tests keyboard accessibility of the real-time chat interface including streaming state, suggestion chips, and clipboard interaction.

**Browser:** Chrome 125 (Chromium)
**OS:** Windows 11
**Status:** Pending manual verification

---

## Expected Tab Order (based on DOM structure)

### Step 1: AI Chat Page — Empty State (no messages)

| # | Element | Component | Notes |
|---|---------|-----------|-------|
| 1 | Logo link "HUYỀN BÍ" | `Navbar` | `aria-label="Huyền Bí — Về trang chủ"` |
| 2 | Mystic cursor toggle | `Navbar` | Hidden on `<md` |
| 3 | Theme toggle | `Navbar` | |
| 4 | AI settings badge | `Navbar` | Hidden on `<sm` |
| 5 | Auth link/button | `Navbar` | |
| 6 | MobileDrawer trigger | `MobileDrawer` | `<md` only |
| 7 | Breadcrumb links | `Breadcrumb` | Path: Trang chủ → Trợ Lý AI |
| 8–21 | **SuggestionGrid buttons (14 items)** | `SuggestionGrid` | Grid layout, each is `<button type="button">` with `focus-visible:ring-1 ring-ring` |
| 22–35 | **SuggestionChips buttons (14 items)** | `SuggestionChips` | Horizontal scroll strip, `role="group" aria-label="Câu hỏi gợi ý"`, each chip has `focus-visible:ring-1 ring-ring` |
| 36 | Textarea (`#ai-chat-input`) | Form | `<Textarea>` with `<label class="sr-only">`, `aria-describedby="ai-chat-input-help"` |
| 37 | Send button "Gửi" | Form | `<Button type="submit">`, `aria-label="Gửi tin nhắn"`, disabled when input empty |

### Step 2: After Sending a Message (messages exist)

| # | Element | Component | Notes |
|---|---------|-----------|-------|
| 1–6 | Navbar elements | `Navbar` | Same as above |
| 7 | Breadcrumb links | `Breadcrumb` | |
| 8 | "Xoá hội thoại" button | Header | `aria-label="Xoá toàn bộ hội thoại"`, disabled during streaming |
| 9 | Chat log area (`<ul role="log" aria-live="polite">`) | Chat | `aria-label="Lịch sử hội thoại với trợ lý AI"` — container is not focusable itself |
| 10+ | Timestamp buttons (per bubble) | `ChatBubble` | `<button type="button">` with `aria-label="Gửi lúc {datetime}"`, `focus-visible:ring-1 ring-ring` |
| N | "Tin nhắn mới" scroll button (conditional) | Chat | Appears when user scrolled up and new messages arrive |
| N+1–N+14 | SuggestionChips (14 items) | `SuggestionChips` | Always visible above input |
| N+15 | Textarea (`#ai-chat-input`) | Form | |
| N+16 | Send button / Stop button | Form | Toggles between "Gửi" and "Dừng" based on streaming state |

### Step 3: During AI Streaming

| # | Element | Component | Notes |
|---|---------|-----------|-------|
| — | Textarea | Form | `disabled={isStreaming}` — **removed from tab order** |
| — | SuggestionChips | `SuggestionChips` | `disabled={true}` — **removed from tab order** |
| — | "Dừng" button | Form | `<Button type="button" variant="destructive">`, `aria-label="Dừng phản hồi đang stream"` — **only interactive element in composer** |

### Step 4: Copying AI Response

The AI chat page does **not** have a dedicated "Copy" button for individual messages. To copy a response, the user must:

1. Use browser-native text selection (mouse or Shift+Arrow keys) on the AI bubble content
2. Press Ctrl+C to copy

**Alternative copy paths in the app:**
- On Module pages (e.g., `/than-so-hoc`): `ExportDownloadBar` provides download-as-text
- On `/profile` (Lịch Sử): `ShareButton` copies share URL to clipboard
- No per-message copy button exists in the AI chat interface

---

## Focus Ring Visibility

| Element | Expected Behavior | Status |
|---------|-------------------|--------|
| SuggestionGrid buttons | `focus-visible:ring-1 ring-ring` | ⏳ Pending verification |
| SuggestionChips buttons | `focus-visible:ring-1 ring-ring` | ⏳ Pending verification |
| Textarea | Inherits shadcn/ui Textarea focus ring | ⏳ Pending verification |
| Send button | Inherits shadcn/ui Button focus ring | ⏳ Pending verification |
| Stop button (destructive) | Inherits shadcn/ui Button destructive variant focus ring | ⏳ Pending verification |
| "Xoá hội thoại" button | Inherits ghost Button focus ring | ⏳ Pending verification |
| Timestamp buttons | `focus-visible:ring-1 ring-ring rounded` | ⏳ Pending verification |
| "Tin nhắn mới" scroll button | `focus-visible:ring-1 ring-ring` | ⏳ Pending verification |

---

## Trap Focus / Unreachable Element Observations

| Issue | Element | Severity | Status |
|-------|---------|----------|--------|
| 14 suggestion chips in horizontal scroll | `SuggestionChips` | P2 | Keyboard user must Tab through all 14 chips to reach textarea — no skip mechanism |
| 14 suggestion grid buttons (empty state) | `SuggestionGrid` | P2 | Same issue — 14 tab stops before reaching input |
| Disabled textarea during streaming | `<Textarea disabled>` | P1 | User cannot Tab to textarea while streaming — only "Dừng" button is reachable in composer area |
| No per-message copy button | Chat bubbles | P2 | Keyboard user has no efficient way to copy a single AI response — must use text selection |
| `aria-live="polite"` on chat log | `<ul role="log">` | INFO | Screen reader will announce new messages — verify it doesn't overwhelm during streaming |
| Timestamp buttons inside chat bubbles | `ChatBubble` | INFO | Each bubble adds a focusable timestamp button — may clutter tab order in long conversations |
| Scroll container not keyboard-scrollable | Chat log `<div>` | P2 | `overflow-y-auto` div is not focusable — keyboard user cannot scroll chat without Tab-ing through all bubbles |
| No `<main>` landmark on ai-chat page | Page layout | P1 | Unlike other pages, ai-chat does NOT have `<main id="main" tabIndex={-1}>` — no skip-to-content target |

---

## Keyboard Shortcuts

| Key | Context | Expected Behavior |
|-----|---------|-------------------|
| Enter | In textarea (no Shift) | Send message (`handleKeyDown` prevents default, calls `sendMessage`) |
| Shift+Enter | In textarea | Insert newline (default textarea behavior preserved) |
| Tab | Throughout | Move to next focusable element |
| Shift+Tab | Throughout | Move to previous focusable element |
| Ctrl+C | After text selection | Copy selected text (browser native) |
| Escape | During streaming | No handler — "Dừng" button must be clicked/activated |

---

## Accessibility Attributes Audit

| Element | Attribute | Value | Correct? |
|---------|-----------|-------|----------|
| Chat log | `role` | `"log"` | ✅ Appropriate for chat history |
| Chat log | `aria-live` | `"polite"` | ✅ Non-intrusive announcements |
| Chat log | `aria-label` | `"Lịch sử hội thoại với trợ lý AI"` | ✅ Descriptive |
| Textarea | `aria-describedby` | `"ai-chat-input-help"` | ✅ Points to sr-only hint |
| Textarea label | `class` | `"sr-only"` | ✅ Visually hidden, accessible |
| Send button | `aria-label` | `"Gửi tin nhắn"` | ✅ |
| Stop button | `aria-label` | `"Dừng phản hồi đang stream"` | ✅ |
| Clear button | `aria-label` | `"Xoá toàn bộ hội thoại"` | ✅ |
| Typing indicator | `role` | `"status"` | ✅ |
| Typing indicator | `aria-label` | `"Đang suy nghĩ"` | ✅ |
| Suggestion chips group | `role` | `"group"` | ✅ |
| Suggestion chips group | `aria-label` | `"Câu hỏi gợi ý"` | ✅ |
| Reconnecting banner | `role` | `"status"` | ✅ |
| Reconnecting banner | `aria-live` | `"polite"` | ✅ |

---

## Summary

- **Total focusable elements (empty state):** ~37 (navbar + 14 grid suggestions + 14 chip suggestions + textarea + send button)
- **Total focusable elements (with messages):** Variable — grows with each message (timestamp buttons) + 14 chips + textarea + send/stop
- **Known concerns from source analysis:**
  1. **No `<main>` landmark** — ai-chat page lacks `<main id="main" tabIndex={-1}>`, unlike other pages (sign-in, than-so-hoc)
  2. **28 suggestion tab stops** — In empty state, user must Tab through 14 grid + 14 chip buttons before reaching textarea
  3. **No copy button for AI responses** — Keyboard users cannot efficiently copy a single response without mouse text selection
  4. **Chat scroll container not keyboard-accessible** — `overflow-y-auto` div has no `tabIndex`, keyboard users cannot scroll independently
  5. **Disabled textarea during streaming** — Removes textarea from tab order; only "Dừng" button remains interactive
  6. **Timestamp buttons accumulate** — Long conversations add many focusable elements to tab order

**Status:** Pending manual verification — Streaming behavior, focus management during state transitions, and screen reader announcements must be confirmed in a running browser instance.
