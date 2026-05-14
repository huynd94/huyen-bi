import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Tailwind class-variance-authority recipe for the {@link Button} primitive.
 *
 * Variants follow shadcn/ui conventions. The `default` size enforces a 44px
 * minimum tap target so the button satisfies the mobile accessibility floor
 * required by Huyền Bí Requirement 4.3 (Property 10 in design.md).
 *
 * @remarks
 * Exported so consumers (e.g. `<Pagination>`, `<AlertDialog>`, custom anchors)
 * can compose the same look without importing the `<Button>` component itself.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
" hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
           // @replit: no hover, and add primary border
           "bg-primary text-primary-foreground border border-primary-border",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border-destructive-border",
        outline:
          // @replit Shows the background color of whatever card / sidebar / accent background it is inside of.
          // Inherits the current text color. Uses shadow-xs. no shadow on active
          // No hover state
          " border [border-color:var(--button-outline)] shadow-xs active:shadow-none ",
        secondary:
          // @replit border, no hover, no shadow, secondary border.
          "border bg-secondary text-secondary-foreground border border-secondary-border ",
        // @replit no hover, transparent border
        ghost: "border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // @huyen-bi: 44px floor for primary tap-target — Requirement 4.3 / Property 10.
        default: "min-h-11 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        // Bumped from min-h-10 so `lg` is never visually smaller than `default`.
        lg: "min-h-12 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Props accepted by the {@link Button} primitive.
 *
 * Extends every native `<button>` attribute and the cva variant props produced
 * by {@link buttonVariants}.
 *
 * @property asChild     - Render the consumer's own element via Radix `Slot`
 *                         instead of a native `<button>`. Useful for routing
 *                         links such as `<Button asChild><Link /></Button>`.
 * @property loading     - When `true`, the button shows an inline spinner,
 *                         sets `aria-busy="true"`, and is forced into the
 *                         disabled state. Satisfies Requirement 5.2.
 * @property loadingText - Optional Vietnamese label that replaces `children`
 *                         while `loading` is `true` (e.g. "Đang tính lá số…").
 *                         When omitted, the original children stay visible
 *                         alongside the spinner.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: React.ReactNode
}

/**
 * Inline activity indicator rendered while {@link ButtonProps.loading} is `true`.
 *
 * Honours `prefers-reduced-motion` via `motion-reduce:animate-none` and is
 * marked `aria-hidden` so the loading announcement comes solely from the
 * parent button's `aria-busy` attribute (avoids double-speech).
 */
function ButtonSpinner() {
  return (
    <Loader2
      aria-hidden="true"
      className="animate-spin motion-reduce:animate-none"
    />
  )
}

/**
 * Primary action primitive used across Huyền Bí UI.
 *
 * Wraps either a native `<button>` or — when `asChild` is `true` — the
 * consumer's own element through Radix `Slot`. Supports a first-class loading
 * state with an inline `Loader2` spinner that honours
 * `prefers-reduced-motion` via `motion-reduce:animate-none`.
 *
 * The default `size` variant ships with `min-height: 44px` so primary CTAs
 * meet the mobile tap-target floor required by Requirement 4.3 (Property 10).
 *
 * @example Basic usage
 * ```tsx
 * <Button onClick={onSubmit}>Lập lá số</Button>
 * ```
 *
 * @example Loading state with Vietnamese label (Requirement 5.2)
 * ```tsx
 * <Button loading={isPending} loadingText="Đang tính lá số…">
 *   Lập lá số
 * </Button>
 * ```
 *
 * @example Render as a router link via `asChild`
 * ```tsx
 * <Button asChild variant="outline">
 *   <Link to="/profile">Hồ sơ</Link>
 * </Button>
 * ```
 *
 * @remarks
 * - While `loading` is `true` the button is forced into the disabled state.
 *   For native buttons we set the `disabled` HTML attribute; with `asChild`
 *   (where the rendered element may be `<a>`, which has no `disabled` attr)
 *   we fall back to `aria-disabled="true"` and the variant's
 *   `aria-disabled:pointer-events-none` rule.
 * - The spinner is marked `aria-hidden`; the loading status is announced
 *   only via `aria-busy` to avoid duplicate screen-reader output.
 * - When `asChild` + `loading` + `loadingText` are combined, `loadingText`
 *   replaces the slotted element's children for the duration of the loading
 *   state. The consumer must therefore pass a single React element child.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled === true || loading
    const showLoadingText = loading && loadingText !== undefined

    const classes = cn(buttonVariants({ variant, size, className }))
    const ariaBusy = loading ? true : undefined

    if (asChild) {
      // Slot needs exactly one element to merge props into; when we add the
      // spinner sibling we wrap the consumer's element in <Slottable> so Slot
      // can identify the passthrough child.
      const slotChild = React.Children.only(children) as React.ReactElement<{
        children?: React.ReactNode
      }>
      const swappedChild = showLoadingText
        ? React.cloneElement(slotChild, undefined, loadingText)
        : slotChild

      return (
        <Slot
          className={classes}
          ref={ref}
          {...props}
          aria-busy={ariaBusy}
          aria-disabled={
            isDisabled
              ? true
              : (props["aria-disabled"] as boolean | undefined)
          }
          data-disabled={isDisabled ? "" : undefined}
        >
          {loading ? <ButtonSpinner /> : null}
          <Slottable>{swappedChild}</Slottable>
        </Slot>
      )
    }

    return (
      <button
        className={classes}
        ref={ref}
        {...props}
        aria-busy={ariaBusy}
        disabled={isDisabled}
      >
        {loading ? <ButtonSpinner /> : null}
        {showLoadingText ? loadingText : children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
