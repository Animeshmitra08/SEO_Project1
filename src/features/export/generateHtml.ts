import { backgroundCss, fontStack, surfaceCss } from "@/lib/design"
import { SVG_ATTRS, WEATHER_ICON_SVG, WEATHER_LABELS } from "@/lib/icons"
import {
  SEARCH_ENGINES,
  hostnameOf,
  initialOf,
  type CanvasNode,
  type NodeOf,
} from "@/lib/nodes"
import { useDesignerStore, type PageConfig } from "@/store/useDesignerStore"

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

/** Neutralise characters that would let a URL break out of a CSS url() literal. */
const escapeCssUrl = (value: string) => value.replace(/[\\"')(]/g, "\\$&")

/** Drop anything that isn't plain http(s) so an exported link can't run script. */
function safeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "#"
  } catch {
    return "#"
  }
}

/** surfaceCss() as a CSS declaration string, with the vendor-prefixed blur browsers still want. */
function surfaceDeclarations(page: PageConfig, indent = "      "): string {
  const surface = surfaceCss(page)
  return [
    `background: ${surface.background}`,
    `border: ${surface.border}`,
    `-webkit-backdrop-filter: ${surface.backdropFilter}`,
    `backdrop-filter: ${surface.backdropFilter}`,
  ].join(`;\n${indent}`)
}

/* ---------------- per-node markup ---------------- */

function clockHtml(node: NodeOf<"clock">): string {
  return `<div class="clock" data-kind="clock" data-seconds="${node.props.seconds ? 1 : 0}" data-hour12="${node.props.hour12 ? 1 : 0}" style="font-size:${node.props.size}px"></div>`
}

function dateHtml(node: NodeOf<"date">): string {
  return `<div class="muted" data-kind="date" data-style="${node.props.dateStyle}" style="font-size:${node.props.size}px"></div>`
}

function greetingHtml(node: NodeOf<"greeting">): string {
  // Static text is baked in; the dynamic variant is filled by the runtime script.
  const initial = node.props.dynamic ? "" : escapeHtml(node.props.text)
  return `<div class="muted" data-kind="greeting" data-dynamic="${node.props.dynamic ? 1 : 0}" style="font-size:${node.props.size}px">${initial}</div>`
}

function searchHtml(node: NodeOf<"search">): string {
  const engine = SEARCH_ENGINES[node.props.engine]
  return `<form class="search" action="${engine.action}" method="GET" role="search">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input type="text" name="${engine.param}" placeholder="${escapeHtml(node.props.placeholder)}" autocomplete="off" aria-label="Search the web" />
      </form>`
}

function linksHtml(node: NodeOf<"links">): string {
  if (node.props.items.length === 0) return ""
  const anchors = node.props.items
    .map((link) => `<a href="${escapeHtml(safeUrl(link.url))}">${escapeHtml(link.label)}</a>`)
    .join("\n        ")
  return `<nav class="links">\n        ${anchors}\n      </nav>`
}

function quoteHtml(node: NodeOf<"quote">): string {
  const caption = node.props.author
    ? `\n        <figcaption style="font-size:${Math.round(node.props.size * 0.8)}px">— ${escapeHtml(node.props.author)}</figcaption>`
    : ""
  return `<figure class="quote">
        <blockquote style="font-size:${node.props.size}px">“${escapeHtml(node.props.text)}”</blockquote>${caption}
      </figure>`
}

function noteHtml(node: NodeOf<"note">): string {
  return `<p class="note" style="font-size:${node.props.size}px">${escapeHtml(node.props.text)}</p>`
}

function countdownHtml(node: NodeOf<"countdown">): string {
  return `<div data-kind="countdown" data-target="${escapeHtml(node.props.target)}" data-label="${escapeHtml(node.props.label)}" style="font-size:${node.props.size}px">
        <span class="count" data-count style="font-size:${node.props.size * 2}px"></span>
        <span class="muted" data-count-label></span>
      </div>`
}

function weatherHtml(node: NodeOf<"weather">): string {
  const { location, temperature, unit, condition, high, low, showRange, size } = node.props
  const iconSize = Math.round(size * 3)
  const range = showRange
    ? `\n          <div class="weather-range" style="font-size:${Math.round(size * 0.85)}px">H ${high}° · L ${low}°</div>`
    : ""

  return `<div class="widget weather" style="font-size:${size}px">
        <svg class="weather-icon" ${SVG_ATTRS} style="width:${iconSize}px;height:${iconSize}px">${WEATHER_ICON_SVG[condition]}</svg>
        <div class="weather-body">
          <div class="weather-temp" style="font-size:${size * 2}px">${temperature}°${unit.toUpperCase()}</div>
          <div class="weather-condition">${escapeHtml(WEATHER_LABELS[condition])}</div>
          <div class="weather-location">${escapeHtml(location)}</div>${range}
        </div>
      </div>`
}

function recentHtml(node: NodeOf<"recent">): string {
  const { heading, items, showUrl, size } = node.props
  if (items.length === 0 && !heading) return ""

  const title = heading
    ? `\n        <div class="recent-heading" style="font-size:${Math.round(size * 0.8)}px">${escapeHtml(heading)}</div>`
    : ""

  const rows = items
    .map((item) => {
      const host = showUrl
        ? `\n            <span class="recent-host" style="font-size:${Math.round(size * 0.8)}px">${escapeHtml(hostnameOf(item.url))}</span>`
        : ""
      return `<a class="recent-item" href="${escapeHtml(safeUrl(item.url))}">
          <span class="recent-avatar" style="width:${Math.round(size * 1.9)}px;height:${Math.round(size * 1.9)}px;font-size:${Math.round(size * 0.85)}px">${escapeHtml(initialOf(item.url))}</span>
          <span class="recent-text">
            <span class="recent-title">${escapeHtml(item.title)}</span>${host}
          </span>
        </a>`
    })
    .join("\n        ")

  return `<div class="widget recent" style="font-size:${size}px">${title}
        ${rows}
      </div>`
}

function nodeBodyHtml(node: CanvasNode): string {
  switch (node.type) {
    case "clock":
      return clockHtml(node)
    case "date":
      return dateHtml(node)
    case "greeting":
      return greetingHtml(node)
    case "search":
      return searchHtml(node)
    case "links":
      return linksHtml(node)
    case "quote":
      return quoteHtml(node)
    case "note":
      return noteHtml(node)
    case "countdown":
      return countdownHtml(node)
    case "weather":
      return weatherHtml(node)
    case "recent":
      return recentHtml(node)
  }
}

/* ---------------- runtime script ---------------- */

/** Only emitted when the page actually contains something time-dependent. */
function runtimeScript(nodes: CanvasNode[]): string {
  const needsClock = nodes.some((n) => n.type === "clock")
  const needsDate = nodes.some((n) => n.type === "date")
  const needsGreeting = nodes.some((n) => n.type === "greeting" && n.props.dynamic)
  const needsCountdown = nodes.some((n) => n.type === "countdown")
  if (!needsClock && !needsDate && !needsGreeting && !needsCountdown) return ""

  const tickMs = nodes.some((n) => n.type === "clock" && n.props.seconds) ? 1000 : 15000

  return `<script>
    (function () {
      var live = document.querySelectorAll("[data-kind]");

      function greeting(hour) {
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
      }

      function render() {
        var now = new Date();

        for (var i = 0; i < live.length; i++) {
          var el = live[i];
          var kind = el.getAttribute("data-kind");

          if (kind === "clock") {
            var opts = { hour: "2-digit", minute: "2-digit", hour12: el.getAttribute("data-hour12") === "1" };
            if (el.getAttribute("data-seconds") === "1") opts.second = "2-digit";
            el.textContent = now.toLocaleTimeString([], opts);
          } else if (kind === "date") {
            el.textContent = now.toLocaleDateString([], { dateStyle: el.getAttribute("data-style") });
          } else if (kind === "greeting") {
            if (el.getAttribute("data-dynamic") === "1") el.textContent = greeting(now.getHours());
          } else if (kind === "countdown") {
            var end = new Date(el.getAttribute("data-target") + "T00:00:00");
            var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            var days = isNaN(end.getTime()) ? 0 : Math.round((end - startOfToday) / 86400000);
            el.querySelector("[data-count]").textContent = String(Math.abs(days));
            el.querySelector("[data-count-label]").textContent =
              (days >= 0 ? " days until " : " days since ") + el.getAttribute("data-label");
          }
        }
      }

      render();
      setInterval(render, ${tickMs});
    })();
  </script>`
}

/* ---------------- page ---------------- */

export function generateHTML(
  page: PageConfig = useDesignerStore.getState().page,
  nodes: CanvasNode[] = useDesignerStore.getState().nodes
): string {
  const background = backgroundCss({
    ...page,
    backgroundImage: escapeCssUrl(page.backgroundImage),
  })

  const visible = nodes.filter((node) => !node.hidden)

  const placed = visible
    .map((node) => {
      const body = nodeBodyHtml(node)
      if (!body) return ""
      return `<div class="node" style="left:${node.x}%; top:${node.y}%; width:${node.width}%">
      ${body}
    </div>`
    })
    .filter(Boolean)
    .join("\n    ")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New Tab</title>
  <style>
    * { box-sizing: border-box; }

    html, body { height: 100%; }

    body {
      margin: 0;
      background: ${background};
      font-family: ${fontStack(page)};
      color: ${page.textColor};
      -webkit-font-smoothing: antialiased;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, ${page.overlay / 100});
      pointer-events: none;
    }

    .stage { position: relative; height: 100%; width: 100%; }

    /* Nodes are centred on their stored percentage coordinates. */
    .node {
      position: absolute;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .clock { font-weight: 600; letter-spacing: -0.025em; font-variant-numeric: tabular-nums; line-height: 1.1; }
    .muted { opacity: 0.7; }
    .count { font-weight: 600; font-variant-numeric: tabular-nums; }

    .quote { margin: 0; }
    .quote blockquote { margin: 0; font-style: italic; line-height: 1.6; }
    .quote figcaption { margin-top: 0.5rem; opacity: 0.6; }

    .note { margin: 0; opacity: 0.8; line-height: 1.6; white-space: pre-wrap; }

    .search {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.875rem 1.25rem;
      border-radius: ${page.radius}px;
      ${surfaceDeclarations(page)};
      transition: box-shadow 0.2s ease;
    }

    .search:focus-within { box-shadow: 0 0 0 3px ${page.accent}59; }

    .search-icon { width: 1.25rem; height: 1.25rem; flex-shrink: 0; opacity: 0.6; }

    .search input {
      flex: 1;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 1rem;
    }

    .search input::placeholder { color: currentColor; opacity: 0.5; }

    /* Surfaced widgets: weather and recent pages. */
    .widget {
      text-align: left;
      border-radius: ${Math.min(page.radius, 24)}px;
      ${surfaceDeclarations(page)};
    }

    .weather { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; }
    .weather-icon { flex-shrink: 0; opacity: 0.9; }
    .weather-body { min-width: 0; flex: 1; }
    .weather-temp { font-weight: 600; font-variant-numeric: tabular-nums; }
    .weather-condition { opacity: 0.7; }
    .weather-location { opacity: 0.5; }
    .weather-range { opacity: 0.5; font-variant-numeric: tabular-nums; }

    .recent { padding: 0.75rem 1rem; }
    .recent-heading {
      margin-bottom: 0.5rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.5;
    }

    .recent-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.25rem 0;
      color: inherit;
      text-decoration: none;
      border-radius: 6px;
      transition: opacity 0.15s ease;
    }

    .recent-item:hover { opacity: 0.75; }

    .recent-avatar {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      border-radius: 4px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.14);
    }

    .recent-text { min-width: 0; flex: 1; }
    .recent-title { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .recent-host { display: block; opacity: 0.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .links { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.625rem; }

    .links a {
      padding: 0.5rem 1rem;
      border-radius: ${Math.min(page.radius, 16)}px;
      ${surfaceDeclarations(page, "      ")};
      color: inherit;
      font-size: 0.875rem;
      text-decoration: none;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }

    .links a:hover { transform: translateY(-1px); border-color: ${page.accent}; }
  </style>
</head>
<body>
  ${page.overlay > 0 ? `<div class="overlay"></div>` : ""}

  <main class="stage">
    ${placed}
  </main>

  ${runtimeScript(visible)}
</body>
</html>
`
}

/** Build the page from current state and save it as newtab.html. */
export function downloadHtml(): void {
  const blob = new Blob([generateHTML()], { type: "text/html" })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "newtab.html"
  anchor.click()

  URL.revokeObjectURL(url)
}
