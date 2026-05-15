/**
 * Submit-with-errors focus helper.
 *
 * After a form submit fails client-side validation, this helper finds the
 * first errored field (by visual / source order) and:
 *   1. Calls `.focus({ preventScroll: true })` on it so screen readers and
 *      keyboard users land directly on the offending control.
 *   2. Calls `.scrollIntoView(...)` on it so sighted users immediately see
 *      the field and its error message in the viewport.
 *
 * The function is pure aside from those two side-effects (focus + scroll)
 * and is SSR-safe — calling it on the server, in a stripped happy-dom
 * environment, or with no errored refs is a no-op that returns `null`.
 *
 * Accessibility note: focusing the first error helps users with motor or
 * visual impairments locate the problem without scanning the whole form,
 * and respects `prefers-reduced-motion` by switching the scroll behavior
 * from `"smooth"` to `"auto"` so motion-sensitive users do not get an
 * unexpected animated scroll. (Requirement 6.5.)
 *
 * Round-trip / invariants intended for the future property test
 * (`focus-first-error.property.test.ts`, design Property 14):
 *   - For any non-empty `order` and any `errorRefs` whose values are either
 *     `null` or attached `HTMLElement`s, the returned key (when not `null`)
 *     is the first key in `order` for which `errorRefs[key]` is a non-null
 *     `HTMLElement`.
 *   - When the helper returns a key, `document.activeElement` equals
 *     `errorRefs[key]` and `scrollIntoView` has been invoked on that
 *     element exactly once.
 *   - When every field in `order` is error-free, the helper returns `null`
 *     and does not call `focus` or `scrollIntoView` on any element.
 *
 * @param errorRefs Map keyed by field name, whose value is the field's DOM
 *   element when that field currently has a validation error, or `null`
 *   when the field is valid. Typically populated from
 *   `react-hook-form`'s `register(name).ref` plus a parallel
 *   `formState.errors` lookup, e.g.
 *
 *   ```ts
 *   const { register, handleSubmit, formState } = useForm<FormValues>();
 *   const refs: Record<string, HTMLElement | null> = {};
 *   <input {...register("name", { required: true })} ref={(el) => {
 *     refs.name = formState.errors.name ? el : null;
 *   }} />
 *   <input {...register("dob", { required: true })} ref={(el) => {
 *     refs.dob = formState.errors.dob ? el : null;
 *   }} />
 *
 *   const onInvalid = () => {
 *     focusFirstError(refs, ["name", "dob"]);
 *   };
 *   handleSubmit(onValid, onInvalid);
 *   ```
 *
 * @param order Field keys in the order they should be considered (usually
 *   their visual / source order in the form). The first key in `order`
 *   whose ref is a non-null `HTMLElement` wins.
 *
 * @returns The key that received focus, or `null` if nothing was focused
 *   (no errors, SSR, or all refs were detached / lacked a `focus` method).
 */
export function focusFirstError(
  errorRefs: Record<string, HTMLElement | null>,
  order: string[],
): string | null {
  // SSR / non-DOM guard. happy-dom always has `window`, but a Node-only
  // unit test environment or a Vite SSR pass will not.
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  for (const key of order) {
    const el = errorRefs[key];
    if (!isFocusableElement(el)) continue;

    // 1. Move focus first, suppressing the browser's default scroll so the
    //    subsequent `scrollIntoView` call has full control over the
    //    motion behavior (smooth vs auto under reduced motion).
    try {
      el.focus({ preventScroll: true });
    } catch {
      // Some happy-dom / jsdom builds throw on `focus({ preventScroll })`;
      // fall back to the no-arg form which is universally supported.
      el.focus();
    }

    // 2. Scroll the element into the centre of the viewport, honouring the
    //    user's reduced-motion preference.
    if (typeof el.scrollIntoView === "function") {
      el.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "center",
      });
    }

    return key;
  }

  return null;
}

/**
 * Narrowing type guard: returns `true` only for non-null DOM elements that
 * actually expose a `.focus()` method. This protects against:
 *   - `null` entries in `errorRefs` (the valid-field case),
 *   - older happy-dom builds that hand back stripped element shells, and
 *   - test doubles that intentionally omit `focus`.
 */
function isFocusableElement(el: HTMLElement | null): el is HTMLElement {
  return el !== null && typeof (el as HTMLElement).focus === "function";
}

/**
 * Reads `prefers-reduced-motion: reduce` from `window.matchMedia`.
 *
 * Returns `false` when `matchMedia` is unavailable (older happy-dom, JSDOM
 * without the media-query polyfill) so behaviour falls back to the more
 * polished smooth scroll.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
