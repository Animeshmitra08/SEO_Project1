import type { DateStyle } from "@/lib/nodes"
import type { FontChoice, PageConfig } from "@/store/useDesignerStore"

export const FONT_STACKS: Record<FontChoice, string> = {
  sans: "'Geist Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "ui-serif, Georgia, Cambria, 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
}

/** The CSS `background` shorthand for a page. Shared by the canvas and the export. */
export function backgroundCss(page: PageConfig): string {
  switch (page.backgroundKind) {
    case "gradient":
      return `linear-gradient(${page.gradientAngle}deg, ${page.gradientFrom}, ${page.gradientTo})`
    case "image":
      // The solid colour sits under the image as the final layer, so a URL that
      // fails to load degrades to the chosen colour instead of nothing at all.
      return page.backgroundImage
        ? `url("${page.backgroundImage}") center / cover no-repeat, ${page.background}`
        : page.background
    default:
      return page.background
  }
}

export function fontStack(page: PageConfig): string {
  return FONT_STACKS[page.font]
}

/** Surface styling for search boxes, links, and cards — solid or frosted glass. */
export function surfaceCss(page: PageConfig) {
  return page.glass
    ? {
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.22)",
        backdropFilter: "blur(12px)",
      }
    : {
        background: "rgba(0,0,0,0.28)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "none",
      }
}

export function formatTime(date: Date, withSeconds: boolean, hour12: boolean): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
    ...(withSeconds ? { second: "2-digit" } : {}),
  })
}

export function formatDate(date: Date, dateStyle: DateStyle): string {
  return date.toLocaleDateString([], { dateStyle })
}
