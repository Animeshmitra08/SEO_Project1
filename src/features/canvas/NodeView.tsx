import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { Search } from "lucide-react"
import { FONT_STACKS, formatDate, formatTime, surfaceCss } from "@/lib/design"
import { WEATHER_ICON_SVG, WEATHER_LABELS } from "@/lib/icons"
import {
  ANALOG_HANDS,
  analogAngles,
  analogFaceSvg,
  clockParts,
  countdownParts,
  dateParts,
  isAnalog,
} from "@/lib/templates"
import {
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
      return <ClockView node={node} page={page} />
    case "date":
      return <DateView node={node} page={page} />
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
      return <CountdownView node={node} page={page} />
    case "weather":
      return <WeatherView node={node} page={page} />
    case "recent":
      return <RecentView node={node} page={page} />
  }
}

function ClockView({ node, page }: { node: NodeOf<"clock">; page: PageConfig }) {
  const { template, seconds, hour12, size } = node.props
  const now = useNow(seconds || isAnalog(template) ? 1000 : 15_000)

  if (isAnalog(template)) return <AnalogClock node={node} page={page} now={now} />

  const { h, m, s, meridiem } = clockParts(now, hour12)

  if (template === "digital-stacked") {
    return (
      <div className="font-semibold tabular-nums leading-[0.92] tracking-tight">
        <div style={{ fontSize: size }}>{h}</div>
        <div style={{ fontSize: size, opacity: 0.55 }}>{m}</div>
        {seconds && (
          <div style={{ fontSize: size * 0.35, opacity: 0.4 }}>
            {s}
            {meridiem && ` ${meridiem}`}
          </div>
        )}
        {!seconds && meridiem && (
          <div style={{ fontSize: size * 0.28, opacity: 0.45 }}>{meridiem}</div>
        )}
      </div>
    )
  }

  if (template === "digital-tiles") {
    const tiles = seconds ? [h, m, s] : [h, m]
    return (
      <div className="flex items-center justify-center gap-2">
        {tiles.map((value, index) => (
          <span
            key={index}
            className="font-semibold tabular-nums leading-none"
            style={{
              ...surfaceCss(page),
              borderRadius: Math.min(page.radius, 16),
              fontSize: size,
              padding: `${size * 0.25}px ${size * 0.3}px`,
            }}
          >
            {value}
          </span>
        ))}
        {meridiem && (
          <span style={{ fontSize: size * 0.35, opacity: 0.5 }}>{meridiem}</span>
        )}
      </div>
    )
  }

  if (template === "digital-mono") {
    return (
      <div
        className="font-semibold tabular-nums leading-tight"
        style={{ fontSize: size, fontFamily: FONT_STACKS.mono, letterSpacing: "0.06em" }}
      >
        {h}:{m}
        {seconds && `:${s}`}
        {meridiem && (
          <span style={{ fontSize: size * 0.3, opacity: 0.5, marginLeft: size * 0.2 }}>
            {meridiem}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="font-semibold tabular-nums leading-tight tracking-tight" style={{ fontSize: size }}>
      {formatTime(now, seconds, hour12)}
    </div>
  )
}

function AnalogClock({
  node,
  page,
  now,
}: {
  node: NodeOf<"clock">
  page: PageConfig
  now: Date
}) {
  const { template, seconds, size } = node.props
  const angles = analogAngles(now)
  const diameter = size * 3

  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: diameter, height: diameter, display: "block", margin: "0 auto" }}
      aria-hidden
    >
      <g dangerouslySetInnerHTML={{ __html: analogFaceSvg(template) }} />

      <g transform={`rotate(${angles.hour} 50 50)`}>
        <line
          x1="50"
          y1="50"
          x2="50"
          y2={50 - ANALOG_HANDS.hour.length}
          stroke="currentColor"
          strokeWidth={ANALOG_HANDS.hour.width}
          strokeLinecap="round"
        />
      </g>
      <g transform={`rotate(${angles.minute} 50 50)`}>
        <line
          x1="50"
          y1="50"
          x2="50"
          y2={50 - ANALOG_HANDS.minute.length}
          stroke="currentColor"
          strokeWidth={ANALOG_HANDS.minute.width}
          strokeLinecap="round"
        />
      </g>
      {seconds && (
        <g transform={`rotate(${angles.second} 50 50)`}>
          <line
            x1="50"
            y1="56"
            x2="50"
            y2={50 - ANALOG_HANDS.second.length}
            stroke={page.accent}
            strokeWidth={ANALOG_HANDS.second.width}
            strokeLinecap="round"
          />
        </g>
      )}
      <circle cx="50" cy="50" r="2.5" fill="currentColor" />
    </svg>
  )
}

function DateView({ node, page }: { node: NodeOf<"date">; page: PageConfig }) {
  const now = useNow(60_000)
  const { template, dateStyle, size } = node.props
  const parts = dateParts(now)

  if (template === "stacked") {
    return (
      <div className="leading-tight">
        <div style={{ fontSize: size * 0.9, opacity: 0.6 }}>{parts.weekday}</div>
        <div className="font-semibold tabular-nums" style={{ fontSize: size * 2.6 }}>
          {parts.day}
        </div>
        <div style={{ fontSize: size * 0.9, opacity: 0.6 }}>
          {parts.month} {parts.year}
        </div>
      </div>
    )
  }

  if (template === "badge") {
    return (
      <span
        className="inline-block"
        style={{
          ...surfaceCss(page),
          borderRadius: page.radius,
          fontSize: size,
          padding: `${size * 0.4}px ${size * 0.9}px`,
        }}
      >
        {formatDate(now, dateStyle)}
      </span>
    )
  }

  if (template === "calendar") {
    return (
      <div
        className="mx-auto inline-block overflow-hidden text-center"
        style={{
          ...surfaceCss(page),
          borderRadius: Math.min(page.radius, 16),
          width: size * 5,
        }}
      >
        <div
          className="font-medium uppercase tracking-wide"
          style={{
            background: page.accent,
            color: page.background,
            fontSize: size * 0.8,
            padding: `${size * 0.2}px 0`,
          }}
        >
          {parts.month}
        </div>
        <div
          className="font-semibold tabular-nums leading-none"
          style={{ fontSize: size * 2.4, padding: `${size * 0.35}px 0 ${size * 0.15}px` }}
        >
          {parts.day}
        </div>
        <div style={{ fontSize: size * 0.75, opacity: 0.6, paddingBottom: size * 0.35 }}>
          {parts.weekdayShort}
        </div>
      </div>
    )
  }

  return (
    <div className="opacity-70" style={{ fontSize: size }}>
      {formatDate(now, dateStyle)}
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
  const { template, location, temperature, unit, condition, high, low, showRange, size } =
    node.props
  const degrees = `°${unit.toUpperCase()}`
  const surface = { ...surfaceCss(page), borderRadius: Math.min(page.radius, 24) }
  const range = showRange && (
    <span className="tabular-nums opacity-50">
      H {high}° · L {low}°
    </span>
  )

  if (template === "compact") {
    return (
      <div className="flex items-center justify-center gap-2" style={{ fontSize: size }}>
        <Glyph
          svg={WEATHER_ICON_SVG[condition]}
          style={{ width: size * 1.6, height: size * 1.6, flexShrink: 0, opacity: 0.85 }}
        />
        <span className="font-semibold tabular-nums" style={{ fontSize: size * 1.4 }}>
          {temperature}
          {degrees}
        </span>
        <span className="truncate opacity-60">{location}</span>
      </div>
    )
  }

  if (template === "stacked") {
    return (
      <div
        className="flex flex-col items-center gap-1 px-5 py-4"
        style={{ ...surface, fontSize: size }}
      >
        <Glyph
          svg={WEATHER_ICON_SVG[condition]}
          style={{ width: size * 3.4, height: size * 3.4, opacity: 0.9 }}
        />
        <div className="font-semibold tabular-nums" style={{ fontSize: size * 2.2 }}>
          {temperature}
          {degrees}
        </div>
        <div className="opacity-70">{WEATHER_LABELS[condition]}</div>
        <div className="opacity-50">{location}</div>
        {range && <div style={{ fontSize: size * 0.85 }}>{range}</div>}
      </div>
    )
  }

  if (template === "detailed") {
    return (
      <div className="px-5 py-4 text-left" style={{ ...surface, fontSize: size }}>
        <div className="truncate font-medium uppercase tracking-wide opacity-50" style={{ fontSize: size * 0.8 }}>
          {location}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <Glyph
            svg={WEATHER_ICON_SVG[condition]}
            style={{ width: size * 2.6, height: size * 2.6, flexShrink: 0, opacity: 0.9 }}
          />
          <div className="min-w-0">
            <div className="font-semibold tabular-nums leading-none" style={{ fontSize: size * 2.2 }}>
              {temperature}
              {degrees}
            </div>
            <div className="mt-1 truncate opacity-70">{WEATHER_LABELS[condition]}</div>
          </div>
        </div>

        {showRange && (
          <div
            className="mt-3 flex justify-between border-t pt-2 tabular-nums opacity-60"
            style={{ borderColor: "rgba(255,255,255,0.15)", fontSize: size * 0.85 }}
          >
            <span>High {high}°</span>
            <span>Low {low}°</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 text-left"
      style={{ ...surface, fontSize: size }}
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
        {range && <div style={{ fontSize: size * 0.85 }}>{range}</div>}
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

function CountdownView({ node, page }: { node: NodeOf<"countdown">; page: PageConfig }) {
  const { template, target, label, size } = node.props
  const now = useNow(template === "units" ? 30_000 : 60_000)
  const parts = countdownParts(target, now)
  const days = parts.wholeDays
  const caption = `${days >= 0 ? "days until" : "days since"} ${label}`

  if (template === "stacked") {
    return (
      <div className="leading-tight">
        <div className="font-semibold tabular-nums" style={{ fontSize: size * 3 }}>
          {Math.abs(days)}
        </div>
        <div className="opacity-70" style={{ fontSize: size }}>
          {caption}
        </div>
      </div>
    )
  }

  if (template === "tile") {
    return (
      <div
        className="inline-block px-6 py-4"
        style={{ ...surfaceCss(page), borderRadius: Math.min(page.radius, 20), fontSize: size }}
      >
        <div className="font-semibold tabular-nums leading-none" style={{ fontSize: size * 2.8 }}>
          {Math.abs(days)}
        </div>
        <div className="mt-2 opacity-70">{caption}</div>
      </div>
    )
  }

  if (template === "units") {
    const units = [
      { value: parts.days, label: "days" },
      { value: parts.hours, label: "hrs" },
      { value: parts.minutes, label: "min" },
    ]

    return (
      <div style={{ fontSize: size }}>
        <div className="flex items-stretch justify-center gap-2">
          {units.map((unit) => (
            <div
              key={unit.label}
              className="flex-1"
              style={{
                ...surfaceCss(page),
                borderRadius: Math.min(page.radius, 14),
                padding: `${size * 0.5}px ${size * 0.3}px`,
              }}
            >
              <div className="font-semibold tabular-nums leading-none" style={{ fontSize: size * 1.8 }}>
                {String(unit.value).padStart(2, "0")}
              </div>
              <div className="mt-1 uppercase tracking-wide opacity-50" style={{ fontSize: size * 0.65 }}>
                {unit.label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 opacity-70">
          {parts.past ? "since" : "until"} {label}
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontSize: size }}>
      <span className="font-semibold tabular-nums" style={{ fontSize: size * 2 }}>
        {Math.abs(days)}
      </span>
      <span className="ml-2 opacity-70">{caption}</span>
    </div>
  )
}
