/**
 * Per-component template catalogue plus the pure helpers that both renderers
 * share. The React canvas and the exported HTML each draw their own markup, so
 * anything with real logic in it lives here to keep the two from drifting.
 */

export type TemplateDef<T extends string> = {
  id: T
  label: string
  /** Optional family, used to group the picker (Clock splits Analog / Digital). */
  group?: string
}

export type ClockTemplate =
  | "digital-plain"
  | "digital-stacked"
  | "digital-tiles"
  | "digital-mono"
  | "analog-minimal"
  | "analog-ticks"
  | "analog-numerals"

export type DateTemplate = "plain" | "stacked" | "badge" | "calendar"
export type WeatherTemplate = "card" | "compact" | "stacked" | "detailed"
export type CountdownTemplate = "plain" | "stacked" | "tile" | "units"
export type LinksTemplate = "pills" | "icons-row" | "icons-column"

export const CLOCK_TEMPLATES: TemplateDef<ClockTemplate>[] = [
  { id: "digital-plain", label: "Plain", group: "Digital" },
  { id: "digital-stacked", label: "Stacked", group: "Digital" },
  { id: "digital-tiles", label: "Tiles", group: "Digital" },
  { id: "digital-mono", label: "Mono", group: "Digital" },
  { id: "analog-minimal", label: "Minimal", group: "Analog" },
  { id: "analog-ticks", label: "Ticks", group: "Analog" },
  { id: "analog-numerals", label: "Numerals", group: "Analog" },
]

export const DATE_TEMPLATES: TemplateDef<DateTemplate>[] = [
  { id: "plain", label: "Plain" },
  { id: "stacked", label: "Stacked" },
  { id: "badge", label: "Badge" },
  { id: "calendar", label: "Calendar" },
]

export const WEATHER_TEMPLATES: TemplateDef<WeatherTemplate>[] = [
  { id: "card", label: "Card" },
  { id: "compact", label: "Compact" },
  { id: "stacked", label: "Stacked" },
  { id: "detailed", label: "Detailed" },
]

export const COUNTDOWN_TEMPLATES: TemplateDef<CountdownTemplate>[] = [
  { id: "plain", label: "Plain" },
  { id: "stacked", label: "Stacked" },
  { id: "tile", label: "Tile" },
  { id: "units", label: "Units" },
]

export const LINKS_TEMPLATES: TemplateDef<LinksTemplate>[] = [
  { id: "pills", label: "Labelled pills" },
  { id: "icons-row", label: "Icons — row" },
  { id: "icons-column", label: "Icons — column" },
]

/** Icon-only templates hide labels, so the glyph carries the whole link. */
export const isIconsOnly = (template: LinksTemplate) => template !== "pills"

export const isAnalog = (template: ClockTemplate) => template.startsWith("analog")

/* ---------------- shared time maths ---------------- */

/** Zero-padded clock components. Mirrored by `clockParts` in the export runtime. */
export function clockParts(date: Date, hour12: boolean) {
  let hours = date.getHours()
  const meridiem = hours < 12 ? "AM" : "PM"
  if (hour12) {
    hours = hours % 12
    if (hours === 0) hours = 12
  }

  return {
    h: String(hours).padStart(2, "0"),
    m: String(date.getMinutes()).padStart(2, "0"),
    s: String(date.getSeconds()).padStart(2, "0"),
    meridiem: hour12 ? meridiem : "",
  }
}

/** Hand rotations in degrees, clockwise from 12 o'clock. */
export function analogAngles(date: Date) {
  const seconds = date.getSeconds()
  const minutes = date.getMinutes()
  const hours = date.getHours() % 12

  return {
    hour: hours * 30 + minutes * 0.5,
    minute: minutes * 6 + seconds * 0.1,
    second: seconds * 6,
  }
}

export function dateParts(date: Date) {
  return {
    weekday: date.toLocaleDateString([], { weekday: "long" }),
    weekdayShort: date.toLocaleDateString([], { weekday: "short" }),
    day: String(date.getDate()),
    month: date.toLocaleDateString([], { month: "long" }),
    monthShort: date.toLocaleDateString([], { month: "short" }),
    year: String(date.getFullYear()),
  }
}

/**
 * Whole days (calendar-aligned, matching the plain templates) alongside a
 * precise day/hour/minute breakdown for the Units template.
 */
export function countdownParts(target: string, now: Date) {
  const end = new Date(`${target}T00:00:00`)
  if (Number.isNaN(end.getTime())) {
    return { wholeDays: 0, days: 0, hours: 0, minutes: 0, past: false }
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const wholeDays = Math.round((end.getTime() - startOfToday.getTime()) / 86_400_000)

  const diff = end.getTime() - now.getTime()
  const absolute = Math.abs(diff)

  return {
    wholeDays,
    days: Math.floor(absolute / 86_400_000),
    hours: Math.floor(absolute / 3_600_000) % 24,
    minutes: Math.floor(absolute / 60_000) % 60,
    past: diff < 0,
  }
}

/* ---------------- analog clock face geometry ---------------- */

/** Presentation attributes are inlined so the markup needs no accompanying CSS. */
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const major = i % 3 === 0
  return `<line x1="50" y1="${major ? 4 : 6}" x2="50" y2="${major ? 13 : 11}" transform="rotate(${i * 30} 50 50)" stroke="currentColor" stroke-width="${major ? 2.5 : 1.5}" stroke-linecap="round" opacity="0.45" />`
}).join("")

const NUMERALS = Array.from({ length: 12 }, (_, i) => {
  const numeral = i === 0 ? 12 : i
  const radians = ((i * 30 - 90) * Math.PI) / 180
  const x = 50 + 37 * Math.cos(radians)
  const y = 50 + 37 * Math.sin(radians)
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-size="10" font-weight="500" opacity="0.65">${numeral}</text>`
}).join("")

/** The static part of an analog face: rim plus ticks or numerals. */
export function analogFaceSvg(template: ClockTemplate): string {
  const rim =
    '<circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3" />'

  if (template === "analog-ticks") return rim + TICKS
  if (template === "analog-numerals") return rim + NUMERALS
  return rim
}

/**
 * Hand geometry, shared so the canvas and export draw identical clocks.
 * `length` is measured from the centre outward on the 100×100 viewBox, where
 * the rim sits at r=48. Ordering matters: the hour hand must stay shortest and
 * thickest, the second hand longest and thinnest, or the dial misreads.
 */
export const ANALOG_HANDS = {
  hour: { length: 25, width: 4.5 },
  minute: { length: 36, width: 3 },
  second: { length: 40, width: 1.5 },
} as const
