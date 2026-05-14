import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Form — wrapper trực tiếp `FormProvider` của `react-hook-form`.
 *
 * Mục đích: cung cấp context của một form instance cho toàn bộ cây
 * con để các {@link FormField} có thể đọc/ghi state qua `useFormContext`.
 * Truyền vào toàn bộ object trả về từ `useForm()`.
 *
 * Lưu ý a11y: bản thân `Form` không render element — phần a11y
 * (label, mô tả, lỗi, `aria-invalid`, `aria-describedby`) được xử lý
 * bởi {@link FormItem} + {@link FormLabel} + {@link FormControl} +
 * {@link FormDescription} + {@link FormMessage}.
 *
 * @example
 * ```tsx
 * const form = useForm<Inputs>({ defaultValues: { name: "" } })
 *
 * <Form {...form}>
 *   <form onSubmit={form.handleSubmit(onSubmit)}>
 *     <FormField
 *       control={form.control}
 *       name="name"
 *       render={({ field }) => (
 *         <FormItem>
 *           <FormLabel>Họ tên</FormLabel>
 *           <FormControl><Input {...field} /></FormControl>
 *           <FormDescription>Tên hiển thị trên lá số.</FormDescription>
 *           <FormMessage />
 *         </FormItem>
 *       )}
 *     />
 *   </form>
 * </Form>
 * ```
 */
const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

/**
 * FormField — kết nối một input vào state của `react-hook-form` thông
 * qua `Controller`, đồng thời publish `name` vào context để
 * {@link useFormField} truy cập trạng thái lỗi/giá trị.
 *
 * Dùng prop `render` để render input controlled (Input, Select,
 * Checkbox,...). Hỗ trợ đầy đủ `rules`, `defaultValue`, `shouldUnregister`.
 *
 * Lưu ý a11y: cặp với {@link FormItem} bên trong `render` để các id
 * (`form-item`, `form-item-description`, `form-item-message`) được
 * gắn đúng vào input và liên kết qua `aria-describedby` / `aria-invalid`.
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

/**
 * Hook truy cập trạng thái của field hiện tại bên trong cặp
 * {@link FormField} + {@link FormItem}.
 *
 * Trả về `id`, `name`, `formItemId`, `formDescriptionId`,
 * `formMessageId`, cùng các thuộc tính `fieldState` của
 * `react-hook-form` (`error`, `invalid`, `isDirty`, `isTouched`,...).
 *
 * @throws Khi gọi ngoài `<FormField>` hoặc `<FormItem>` — ném lỗi để
 * tránh hợp lệ hoá ngầm sai context.
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>")
  }

  const fieldState = getFieldState(fieldContext.name, formState)

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null)

/**
 * FormItem — wrapper layout cho một field, sinh `id` ổn định qua
 * `React.useId()` để các id phái sinh (`form-item`,
 * `form-item-description`, `form-item-message`) liên kết
 * label/description/message với input qua aria attributes.
 *
 * Render `<div class="space-y-2">` đặt label, control, description,
 * message theo chiều dọc.
 */
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

/**
 * FormLabel — `<label>` cho field, tự gắn `htmlFor` tới `formItemId`
 * của {@link FormControl} và đổi sang `text-destructive` khi field có lỗi.
 *
 * Lưu ý a11y: nhờ `htmlFor` đúng id, click vào label sẽ focus input
 * và screen reader sẽ đọc label cùng input. Dùng nội dung văn bản rõ
 * ràng, không lồng `<button>` trong label.
 */
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

/**
 * FormControl — bọc input thực tế bằng `Slot` (Radix), tự gắn:
 *
 * - `id={formItemId}` để {@link FormLabel} liên kết qua `htmlFor`.
 * - `aria-describedby` trỏ tới {@link FormDescription} (luôn) và
 *   {@link FormMessage} (khi có lỗi).
 * - `aria-invalid` true/false theo `fieldState.error`.
 *
 * Nhờ `Slot`, các thuộc tính trên được merge vào element con thực tế
 * (Input, Select, Checkbox,...) — không cần wrap thêm `<div>`.
 */
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

/**
 * FormDescription — text mô tả/hướng dẫn cho field. Tự gắn id
 * `formDescriptionId` để {@link FormControl} liên kết qua
 * `aria-describedby`, giúp screen reader đọc mô tả khi focus input.
 */
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

/**
 * FormMessage — hiển thị thông báo lỗi của field (ưu tiên
 * `error.message`) hoặc fallback `children` khi không có lỗi.
 *
 * Tự gắn id `formMessageId` để {@link FormControl} liên kết qua
 * `aria-describedby` khi có lỗi. Trả về `null` khi không có nội dung
 * — tránh tạo node trống làm screen reader đọc thừa.
 *
 * Lưu ý a11y: kết hợp với `aria-invalid` trên control để screen reader
 * thông báo trạng thái lỗi và đọc kèm nội dung message.
 */
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
