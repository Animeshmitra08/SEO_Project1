import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { Search } from "lucide-react"
import { formatDate, formatTime, surfaceCss } from "@/lib/design"
import { WEATHER_ICON_SVG, WEATHER_LABELS } from "@/lib/icons"
import {
  daysUntil,
  greetingFor,
  hostnameOf,
  initialOf,
  type CanvasNode,
  type NodeOf,
} from "@/lib/nodes"
import type { PageConfig } from "@/store/useDesignerStore"

/** Renders one of the shared raw-SVG glyphs. Sources are module constants, never user input. */
function Glyph({ svg, style }: { svg: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/** Re-render on an interval so time-based nodes stay current. */
function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}

/** Renders a node exactly as it will appear on the exported page. Non-interactive. */
export default function NodeView({ node, page }: { node: CanvasNode; page: PageConfig }) {
  switch (node.type) {
    case "clock":
      return <ClockView node={node} />
    case "date":
      return <DateView node={node} />
    case "greeting":
      return <GreetingView node={node} />
    case "search":
      return <SearchView node={node} page={page} />
    case "links":
      return <LinksView node={node} page={page} />
    case "quote":
      return <QuoteView node={node} />
    case "note":
      return <NoteView node={node} />
    case "countdown":
      return <CountdownView node={node} />
    case "weather":
      return <WeatherView node={node} page={page} />
    case "recent":
      return <RecentView node={node} page={page} />
  }
}

function ClockView({ node }: { node: NodeOf<"clock"> }) {
  const now = useNow(node.props.seconds ? 1000 : 15_000)

  return (
    <div
      className="font-semibold tabular-nums leading-tight tracking-tight"
      style={{ fontSize: node.props.size }}
    >
      {formatTime(now, node.props.seconds, node.props.hour12)}
    </div>
  )
}

function DateView({ node }: { node: NodeOf<"date"> }) {
  const now = useNow(60_000)

  return (
    <div className="opacity-70" style={{ fontSize: node.props.size }}>
      {formatDate(now, node.props.dateStyle)}
    </div>
  )
}

function GreetingView({ node }: { node: NodeOf<"greeting"> }) {
  const now = useNow(600_000)

  return (
    <div className="opacity-70" style={{ fontSize: node.props.size }}>
      {greetingFor(now, node)}
    </div>
  )
}

function SearchView({ node, page }: { node: NodeOf<"search">; page: PageConfig }) {
  return (
    <div
      className="flex w-full items-center gap-3 px-5 py-3"
      style={{ ...surfaceCss(page), borderRadius: page.radius }}
    >
      <Search className="size-5 shrink-0 opacity-60" />
      <span className="truncate text-base opacity-50">{node.props.placeholder}</span>
    </div>
  )
}

function LinksView({ node, page }: { node: NodeOf<"links">; page: PageConfig }) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {node.props.items.map((link) => (
        <span
          key={link.id}
          className="px-4 py-2 text-sm"
          style={{ ...surfaceCss(page), borderRadius: Math.min(page.radius, 16) }}
        >
          {link.label}
        </span>
      ))}
    </div>
  )
}

function QuoteView({ node }: { node: NodeOf<"quote"> }) {
  return (
    <figure className="m-0">
      <blockquote className="m-0 italic leading-relaxed" style={{ fontSize: node.props.size }}>
        “{node.props.text}”
      </blockquote>
      {node.props.author && (
        <figcaption className="mt-2 opacity-60" style={{ fontSize: node.props.size * 0.8 }}>
          — {node.props.author}
        </figcaption>
      )}
    </figure>
  )
}

function NoteView({ node }: { node: NodeOf<"note"> }) {
  return (
    <p className="m-0 whitespace-pre-wrap leading-relaxed opacity-80" style={{ fontSize: node.props.size }}>
      {node.props.text}
    </p>
  )
}

function WeatherView({ node, page }: { node: NodeOf<"weather">; page: PageConfig }) {
  const { location, temperature, unit, condition, high, low, showRange, size } = node.props
  const degrees = `°${unit.toUpperCase()}`

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 text-left"
      style={{ ...surfaceCss(page), borderRadius: Math.min(page.radius, 24), fontSize: size }}
    >
      <Glyph
        svg={WEATHER_ICON_SVG[condition]}
        style={{ width: size * 3, height: size * 3, flexShrink: 0, opacity: 0.9 }}
      />

      <div className="min-w-0 flex-1">
        <div className="font-semibold tabular-nums" style={{ fontSize: size * 2 }}>
          {temperature}
          {degrees}
        </div>
        <div className="truncate opacity-70">{WEATHER_LABELS[condition]}</div>
        <div className="truncate opacity-50">{location}</div>
        {showRange && (
          <div className="tabular-nums opacity-50" style={{ fontSize: size * 0.85 }}>
            H {high}° · L {low}°
          </div>
        )}
      </div>
    </div>
  )
}

function RecentView({ node, page }: { node: NodeOf<"recent">; page: PageConfig }) {
  const { heading, items, showUrl, size } = node.props
  const surface = surfaceCss(page)

  return (
    <div
      className="px-4 py-3 text-left"
      style={{ ...surface, borderRadius: Math.min(page.radius, 24), fontSize: size }}
    >
      {heading && (
        <div
          className="mb-2 font-medium uppercase tracking-wide opacity-50"
          style={{ fontSize: size * 0.8 }}
        >
          {heading}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5">
            <span
              className="grid shrink-0 place-items-center rounded font-semibold"
              style={{
                width: size * 1.9,
                height: size * 1.9,
                background: "rgba(255,255,255,0.14)",
                fontSize: size * 0.85,
              }}
            >
              {initialOf(item.url)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{item.title}</span>
              {showUrl && (
                <span className="block truncate opacity-50" style={{ fontSize: size * 0.8 }}>
                  {hostnameOf(item.url)}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CountdownView({ node }: { node: NodeOf<"countdown"> }) {
  const now = useNow(60_000)
  const days = daysUntil(node.props.target, now)

  return (
    <div style={{ fontSize: node.props.size }}>
      <span className="font-semibold tabular-nums" style={{ fontSize: node.props.size * 2 }}>
        {Math.abs(days)}
      </span>
      <span className="ml-2 opacity-70">
        {days >= 0 ? "days until" : "days since"} {node.props.label}
      </span>
    </div>
  )
}
