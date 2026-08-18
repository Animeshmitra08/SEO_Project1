import {
  Calendar,
  Clock,
  CloudSun,
  History,
  Link2,
  Quote,
  Search,
  StickyNote,
  Timer,
  Type,
  type LucideIcon,
} from "lucide-react"
import type { WeatherCondition } from "@/lib/icons"
import type {
  ClockTemplate,
  CountdownTemplate,
  DateTemplate,
  WeatherTemplate,
} from "@/lib/templates"

export type SearchEngine = "google" | "bing" | "duckduckgo"

export const SEARCH_ENGINES: Record<
  SearchEngine,
  { label: string; action: string; param: string }
> = {
  google: { label: "Google", action: "https://www.google.com/search", param: "q" },
  bing: { label: "Bing", action: "https://www.bing.com/search", param: "q" },
  duckduckgo: { label: "DuckDuckGo", action: "https://duckduckgo.com/", param: "q" },
}

export type QuickLink = {
  id: string
  label: string
  url: string
}

export type DateStyle = "full" | "long" | "medium" | "short"

export type TemperatureUnit = "c" | "f"

/** One row in the Recent pages widget. */
export type RecentPage = {
  id: string
  title: string
  url: string
}

/** Props carried by each component type. Keys here define the set of valid types. */
export type NodePropsMap = {
  clock: { template: ClockTemplate; seconds: boolean; hour12: boolean; size: number }
  date: { template: DateTemplate; dateStyle: DateStyle; size: number }
  greeting: { text: string; dynamic: boolean; size: number }
  search: { placeholder: string; engine: SearchEngine }
  links: { items: QuickLink[] }
  quote: { text: string; author: string; size: number }
  note: { text: string; size: number }
  countdown: { template: CountdownTemplate; label: string; target: string; size: number }
  weather: {
    template: WeatherTemplate
    location: string
    temperature: number
    unit: TemperatureUnit
    condition: WeatherCondition
    high: number
    low: number
    showRange: boolean
    size: number
  }
  recent: { heading: string; items: RecentPage[]; showUrl: boolean; size: number }
}

export type ComponentType = keyof NodePropsMap

type NodeBase = {
  id: string
  name: string
  /** Position as a percentage of canvas size, anchored at the element's centre. */
  x: number
  y: number
  /** Width as a percentage of canvas width. */
  width: number
  hidden: boolean
  locked: boolean
}

/** A placed component. Discriminated on `type`, so `props` narrows automatically. */
export type CanvasNode = {
  [K in ComponentType]: NodeBase & { type: K; props: NodePropsMap[K] }
}[ComponentType]

/** A node narrowed to one specific type — handy for per-type renderers and editors. */
export type NodeOf<K extends ComponentType> = Extract<CanvasNode, { type: K }>

type CatalogEntry<K extends ComponentType> = {
  type: K
  label: string
  description: string
  icon: LucideIcon
  defaultWidth: number
  defaultProps: () => NodePropsMap[K]
}

/** Everything the palette can create, in display order. */
export const COMPONENT_CATALOG: { [K in ComponentType]: CatalogEntry<K> }[ComponentType][] = [
  {
    type: "clock",
    label: "Clock",
    description: "Live time, updates itself",
    icon: Clock,
    defaultWidth: 60,
    defaultProps: () => ({
      template: "digital-plain",
      seconds: false,
      hour12: true,
      size: 60,
    }),
  },
  {
    type: "date",
    label: "Date",
    description: "Today's date",
    icon: Calendar,
    defaultWidth: 60,
    defaultProps: () => ({ template: "plain", dateStyle: "full", size: 18 }),
  },
  {
    type: "greeting",
    label: "Greeting",
    description: "A line of welcome text",
    icon: Type,
    defaultWidth: 60,
    defaultProps: () => ({ text: "Good to see you", dynamic: true, size: 18 }),
  },
  {
    type: "search",
    label: "Search bar",
    description: "Working search box",
    icon: Search,
    defaultWidth: 55,
    defaultProps: () => ({ placeholder: "Search the web...", engine: "google" }),
  },
  {
    type: "links",
    label: "Quick links",
    description: "Shortcut tiles",
    icon: Link2,
    defaultWidth: 60,
    defaultProps: () => ({
      items: [
        { id: "l1", label: "GitHub", url: "https://github.com" },
        { id: "l2", label: "Gmail", url: "https://mail.google.com" },
        { id: "l3", label: "YouTube", url: "https://youtube.com" },
      ],
    }),
  },
  {
    type: "quote",
    label: "Quote",
    description: "Pinned quotation",
    icon: Quote,
    defaultWidth: 50,
    defaultProps: () => ({
      text: "Simplicity is the ultimate sophistication.",
      author: "Leonardo da Vinci",
      size: 16,
    }),
  },
  {
    type: "note",
    label: "Note",
    description: "Free text block",
    icon: StickyNote,
    defaultWidth: 40,
    defaultProps: () => ({ text: "Remember to take a break.", size: 16 }),
  },
  {
    type: "countdown",
    label: "Countdown",
    description: "Days until a date",
    icon: Timer,
    defaultWidth: 40,
    defaultProps: () => ({
      template: "plain",
      label: "Launch day",
      target: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      size: 18,
    }),
  },
  {
    type: "weather",
    label: "Weather",
    description: "Fixed forecast card",
    icon: CloudSun,
    defaultWidth: 28,
    defaultProps: () => ({
      template: "card",
      location: "San Francisco",
      temperature: 18,
      unit: "c",
      condition: "partly-cloudy",
      high: 22,
      low: 12,
      showRange: true,
      size: 16,
    }),
  },
  {
    type: "recent",
    label: "Recent pages",
    description: "Hand-picked shortcuts list",
    icon: History,
    defaultWidth: 30,
    defaultProps: () => ({
      heading: "Recently visited",
      showUrl: true,
      size: 14,
      items: [
        { id: newId(), title: "GitHub — Pull requests", url: "https://github.com/pulls" },
        { id: newId(), title: "Figma — Design system", url: "https://figma.com" },
        { id: newId(), title: "Hacker News", url: "https://news.ycombinator.com" },
      ],
    }),
  },
]

const CATALOG_BY_TYPE = Object.fromEntries(
  COMPONENT_CATALOG.map((entry) => [entry.type, entry])
) as { [K in ComponentType]: CatalogEntry<K> }

export function catalogEntry<K extends ComponentType>(type: K): CatalogEntry<K> {
  return CATALOG_BY_TYPE[type]
}

/** Narrow an untrusted string (e.g. a drag payload) to a known component type. */
export function isComponentType(value: string): value is ComponentType {
  return Object.hasOwn(CATALOG_BY_TYPE, value)
}

/** MIME-ish key used to carry a component type from the palette onto the canvas. */
export const DRAG_MIME = "application/x-extension-designer-component"

/** MIME-ish key used to carry a node's paint-order index while reordering the tree. */
export const LAYER_DRAG_MIME = "application/x-extension-designer-layer"

let counter = 0

/** crypto.randomUUID is unavailable in insecure contexts, so keep a fallback. */
export const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `node-${++counter}`

/** The logical screen the canvas designs against, so px sizes match a real display. */
export const STAGE_WIDTH = 1600
export const STAGE_HEIGHT = 900

/** Build a fresh node of `type` centred on (x, y), given as canvas percentages. */
export function createNode<K extends ComponentType>(
  type: K,
  x = 50,
  y = 50
): CanvasNode {
  const entry = catalogEntry(type)
  return {
    id: newId(),
    type,
    name: entry.label,
    x,
    y,
    width: entry.defaultWidth,
    hidden: false,
    locked: false,
    props: entry.defaultProps(),
  } as CanvasNode
}

export function createQuickLink(): QuickLink {
  return { id: newId(), label: "New link", url: "https://example.com" }
}

export function createRecentPage(): RecentPage {
  return { id: newId(), title: "New page", url: "https://example.com" }
}

/** Display host for a URL — "github.com" rather than "https://www.github.com/pulls". */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/** Single-letter avatar used by the Recent pages rows, avoiding favicon lookups. */
export function initialOf(url: string): string {
  return (hostnameOf(url).charAt(0) || "?").toUpperCase()
}

/* ---------------- runtime helpers shared by canvas and export ---------------- */

export function greetingFor(date: Date, node: NodeOf<"greeting">): string {
  if (!node.props.dynamic) return node.props.text
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/** Whole days from now until `target` (an ISO yyyy-mm-dd string). Negative once passed. */
export function daysUntil(target: string, now: Date): number {
  const end = new Date(`${target}T00:00:00`)
  if (Number.isNaN(end.getTime())) return 0
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((end.getTime() - startOfToday.getTime()) / 86_400_000)
}
