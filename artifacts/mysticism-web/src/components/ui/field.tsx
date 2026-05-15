"use client"

import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

/**
 * FieldSet — wrapper `<fieldset>` cho một nhóm field liên quan.
 *
 * Mục đích: gom nhóm các input có cùng chủ đề (ví dụ: thông tin sinh,
 * tuỳ chọn lá số) để screen reader hiểu cấu trúc form. Tự áp layout
 * dọc với `gap-6`, riêng nhóm checkbox/radio thu hẹp xuống `gap-3`.
 *
 * Lưu ý a11y: nên kèm {@link FieldLegend} ngay đầu `<fieldset>` để
 * gắn caption cho nhóm — screen reader đọc legend trước khi vào từng
 * field con.
 *
 * @example
 * ```tsx
 * <FieldSet>
 *   <FieldLegend>Thông tin sinh</FieldLegend>
 *   <FieldGroup>
 *     <Field>
 *       <FieldLabel>Ngày sinh</FieldLabel>
 *       <Input type="date" />
 *     </Field>
 *   </FieldGroup>
 * </FieldSet>
 * ```
 */
function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  )
}

/**
 * FieldLegend — `<legend>` mô tả nhóm bên trong {@link FieldSet}.
 *
 * Prop `variant`: `"legend"` (mặc định, `text-base`) cho tiêu đề nhóm
 * lớn, `"label"` (`text-sm`) cho ngữ cảnh nhỏ hơn (ví dụ: nhóm phụ
 * trong cùng form). Tránh ẩn legend visually-hidden vì screen reader
 * dựa vào legend để liên kết tất cả input con với caption nhóm.
 */
function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-3 font-medium",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * FieldGroup — container layout dọc cho nhiều {@link Field}. Tạo
 * container query (`@container/field-group`) để các field con dùng
 * `responsive` orientation tự đổi layout khi đủ rộng (`@md:`).
 *
 * Dùng khi muốn xếp nhiều field có khoảng cách thống nhất, hoặc lồng
 * `FieldGroup` bên trong `FieldGroup` để tạo nhóm con (gap thu hẹp
 * còn `gap-4`).
 */
function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field data-[invalid=true]:text-destructive flex w-full gap-3",
  {
    variants: {
      orientation: {
        vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
        horizontal: [
          "flex-row items-center",
          "[&>[data-slot=field-label]]:flex-auto",
          "has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px has-[>[data-slot=field-content]]:items-start",
        ],
        responsive: [
          "@md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto flex-col [&>*]:w-full [&>.sr-only]:w-auto",
          "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
          "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        ],
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

/**
 * Field — wrapper cho một field đơn (label + control + description +
 * error). Render `<div role="group">` với `data-orientation` để
 * screen reader nhận biết đây là một nhóm liên quan.
 *
 * Prop `orientation`:
 * - `"vertical"` (mặc định): label trên, control dưới — dùng cho
 *   input dài, textarea.
 * - `"horizontal"`: label trái, control phải — dùng cho checkbox,
 *   switch, toggle có label ngắn.
 * - `"responsive"`: vertical trên mobile, horizontal trên `@md:` —
 *   yêu cầu lồng trong {@link FieldGroup}.
 *
 * Lưu ý a11y: đặt `data-invalid="true"` lên `Field` (qua state ngoài)
 * để toàn bộ label/description con tự đổi sang `text-destructive`,
 * đồng bộ với `aria-invalid` trên control bên trong.
 */
function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

/**
 * FieldContent — container phụ bên trong {@link Field} để gom
 * label + description khi có control là checkbox/radio đặt cạnh.
 * Dùng để giữ control căn đỉnh (`items-start`) thay vì `items-center`.
 */
function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-1.5 leading-snug",
        className
      )}
      {...props}
    />
  )
}

/**
 * FieldLabel — `<label>` cho control. Hỗ trợ "card-style label" khi
 * lồng `<Field>` con bên trong (toàn bộ block trở thành clickable
 * card với border + padding, highlight khi `data-state=checked`).
 *
 * Lưu ý a11y: dùng cùng `htmlFor` (hoặc bọc control bên trong) để
 * click label focus đúng input. Khi `Field` cha có `data-disabled`,
 * label tự giảm opacity.
 */
function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>[data-slot=field]]:p-4",
        "has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10",
        className
      )}
      {...props}
    />
  )
}

/**
 * FieldTitle — tiêu đề non-label (render `<div>`) cho trường hợp
 * không cần liên kết `htmlFor` (ví dụ: tiêu đề cho group switch hoặc
 * khi label đã ở chỗ khác). Áp `data-slot="field-label"` để chia sẻ
 * style với {@link FieldLabel}.
 */
function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm font-medium leading-snug group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

/**
 * FieldDescription — text mô tả/hướng dẫn cho {@link Field}. Dùng
 * `text-muted-foreground` để giảm nhấn so với label.
 *
 * Lưu ý a11y: liên kết với control qua `aria-describedby` (cần gắn
 * id thủ công hoặc dùng cặp Form từ `form.tsx` cho việc tự liên kết).
 * Anchor `<a>` bên trong tự có gạch dưới để tăng affordance.
 */
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-muted-foreground text-sm font-normal leading-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "nth-last-2:-mt-1 last:mt-0 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * FieldSeparator — đường kẻ ngang chia tách các nhóm field, có thể
 * kèm text ở giữa (ví dụ: "Hoặc") qua `children`.
 *
 * Dùng khi muốn phân tách các nhóm logic trong cùng form (ví dụ:
 * chia thông tin cá nhân và thông tin liên hệ).
 */
function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

/**
 * FieldError — thông báo lỗi cho {@link Field}. Có thể nhận
 * `children` (custom node) hoặc `errors` (mảng object có `message`).
 *
 * - Một lỗi: hiển thị plain text.
 * - Nhiều lỗi: render `<ul>` bullet để liệt kê.
 * - Không có nội dung: trả `null` để tránh node trống.
 *
 * Lưu ý a11y: dùng `role="alert"` để screen reader ngay lập tức công
 * bố lỗi khi component xuất hiện (ví dụ: sau submit). Kết hợp với
 * `aria-invalid="true"` trên control để hoàn thiện trải nghiệm a11y.
 */
function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors) {
      return null
    }

    if (errors?.length === 1 && errors[0]?.message) {
      return errors[0].message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {errors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-destructive text-sm font-normal", className)}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
