import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Tham chiếu API của Embla Carousel để consumer điều khiển từ ngoài
 * (scrollTo index, on/off plugin, đọc trạng thái slide hiện tại).
 */
type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

/**
 * Carousel — slider đa-slide dựa trên `embla-carousel-react`.
 *
 * Mục đích: hiển thị danh sách card trượt ngang/dọc (testimonials,
 * tài liệu nổi bật, hướng dẫn nhanh), có nút điều hướng prev/next.
 *
 * Props:
 * - `orientation`: `"horizontal" | "vertical"`.
 * - `opts`: tuỳ chọn của Embla (`loop`, `align`, `slidesToScroll`,...).
 * - `plugins`: plugin Embla (autoplay, classNames,...).
 * - `setApi`: callback nhận tham chiếu {@link CarouselApi}.
 *
 * Lưu ý a11y: container ngoài có `role="region"` +
 * `aria-roledescription="carousel"`; mỗi slide có `role="group"`
 * + `aria-roledescription="slide"`. Bàn phím `←/→` cuộn prev/next
 * thông qua `onKeyDownCapture`. Khi dùng autoplay, cân nhắc cung cấp
 * nút pause vì `prefers-reduced-motion` không tự dừng autoplay.
 *
 * @example
 * ```tsx
 * <Carousel opts={{ align: "start", loop: true }}>
 *   <CarouselContent>
 *     {items.map((item) => (
 *       <CarouselItem key={item.id}>{item.title}</CarouselItem>
 *     ))}
 *   </CarouselContent>
 *   <CarouselPrevious />
 *   <CarouselNext />
 * </Carousel>
 * ```
 */
const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

/**
 * Wrapper cho phần track chứa các slide. Bám ref viewport của Embla
 * và áp `overflow-hidden`. Đặt làm con trực tiếp của {@link Carousel}.
 */
const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

/**
 * Một slide trong {@link CarouselContent}.
 *
 * Mục đích: bọc nội dung của từng slide (card, ảnh, testimonial). Mỗi
 * item chiếm `basis-full` mặc định; điều chỉnh `basis-*` qua className
 * để hiển thị nhiều slide cùng lúc (`md:basis-1/2`, `lg:basis-1/3`,...).
 *
 * Lưu ý a11y: tự gắn `role="group"` + `aria-roledescription="slide"`
 * theo khuyến nghị WAI-ARIA Authoring Practices cho carousel pattern.
 * Cân nhắc đặt thêm `aria-label="Slide 2 / 5"` cho consumer khi cần
 * announce thứ tự cho screen reader.
 */
const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

/**
 * Nút điều hướng về slide trước trong {@link Carousel}.
 *
 * Mục đích: cung cấp affordance click/tap (kèm bàn phím khi focus) để
 * cuộn ngược lại; tự động `disabled` khi không còn slide trước theo
 * trạng thái Embla `canScrollPrev`.
 *
 * Props: kế thừa props của {@link Button} — `variant` mặc định
 * `"outline"`, `size` mặc định `"icon"`. Đè qua className/className
 * khi cần đặt vị trí khác.
 *
 * Lưu ý a11y: nút render text "Previous slide" trong `<span class="sr-only">`
 * để screen reader đọc; ngoài ra `←` trong container cha cũng cuộn nhờ
 * `onKeyDownCapture` của {@link Carousel}.
 */
const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

/**
 * Nút điều hướng về slide kế tiếp trong {@link Carousel}.
 *
 * Mục đích: đối xứng với {@link CarouselPrevious} — cuộn tới slide kế
 * và tự `disabled` khi `canScrollNext === false`.
 *
 * Props: kế thừa props của {@link Button} — `variant` mặc định
 * `"outline"`, `size` mặc định `"icon"`.
 *
 * Lưu ý a11y: dùng `<span class="sr-only">Next slide</span>` cho screen
 * reader; bàn phím `→` trên container {@link Carousel} cũng cuộn next.
 */
const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
