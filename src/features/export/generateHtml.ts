import { FONT_STACKS, backgroundCss, fontStack, surfaceCss } from "@/lib/design"
import { SVG_ATTRS, WEATHER_ICON_SVG, WEATHER_LABELS } from "@/lib/icons"
import {
  SEARCH_ENGINES,
  hostnameOf,
  initialOf,
  type CanvasNode,
  type NodeOf,
} from "@/lib/nodes"
import { ANALOG_HANDS, analogFaceSvg, isAnalog } from "@/lib/templates"
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

function clockHtml(node: NodeOf<"clock">, page: PageConfig): string {
  const { template, seconds, hour12, size } = node.props
  const attrs = `data-kind="clock" data-seconds="${seconds ? 1 : 0}" data-hour12="${hour12 ? 1 : 0}"`

  if (isAnalog(template)) {
    const diameter = Math.round(size * 3)
    const hand = (key: keyof typeof ANALOG_HANDS, color: string, tail = 50) =>
      `<g data-hand="${key}"><line x1="50" y1="${tail}" x2="50" y2="${50 - ANALOG_HANDS[key].length}" stroke="${color}" stroke-width="${ANALOG_HANDS[key].width}" stroke-linecap="round" /></g>`

    return `<div ${attrs} data-analog="1">
        <svg viewBox="0 0 100 100" style="width:${diameter}px;height:${diameter}px;display:block;margin:0 auto">
          ${analogFaceSvg(template)}
          ${hand("hour", "currentColor")}
          ${hand("minute", "currentColor")}
          ${seconds ? hand("second", page.accent, 56) : ""}
          <circle cx="50" cy="50" r="2.5" fill="currentColor" />
        </svg>
      </div>`
  }

  if (template === "digital-stacked") {
    const tail = seconds
      ? `<div style="font-size:${Math.round(size * 0.35)}px;opacity:0.4"><span data-slot="s"></span> <span data-slot="meridiem"></span></div>`
      : hour12
        ? `<div style="font-size:${Math.round(size * 0.28)}px;opacity:0.45" data-slot="meridiem"></div>`
        : ""
    return `<div ${attrs} class="clock-stacked" style="font-size:${size}px">
        <div data-slot="h"></div>
        <div style="opacity:0.55" data-slot="m"></div>${tail ? `\n        ${tail}` : ""}
      </div>`
  }

  if (template === "digital-tiles") {
    const pad = `${(size * 0.25).toFixed(1)}px ${(size * 0.3).toFixed(1)}px`
    const tile = (slot: string) =>
      `<span class="clock-tile" style="padding:${pad}" data-slot="${slot}"></span>`
    return `<div ${attrs} class="clock-tiles" style="font-size:${size}px">
        ${tile("h")}
        ${tile("m")}
        ${seconds ? `${tile("s")}\n        ` : ""}${hour12 ? `<span style="font-size:${Math.round(size * 0.35)}px;opacity:0.5" data-slot="meridiem"></span>` : ""}
      </div>`
  }

  if (template === "digital-mono") {
    const meridiem = hour12
      ? `<span style="font-size:${Math.round(size * 0.3)}px;opacity:0.5;margin-left:${(size * 0.2).toFixed(1)}px" data-slot="meridiem"></span>`
      : ""
    return `<div ${attrs} class="clock clock-mono" style="font-size:${size}px"><span data-slot="hm"></span>${meridiem}</div>`
  }

  return `<div ${attrs} class="clock" style="font-size:${size}px"><span data-slot="time"></span></div>`
}

function dateHtml(node: NodeOf<"date">, page: PageConfig): string {
  const { template, dateStyle, size } = node.props
  const attrs = `data-kind="date" data-style="${dateStyle}"`

  if (template === "stacked") {
    return `<div ${attrs} class="date-stacked">
        <div style="font-size:${Math.round(size * 0.9)}px;opacity:0.6" data-slot="weekday"></div>
        <div class="date-big" style="font-size:${Math.round(size * 2.6)}px" data-slot="day"></div>
        <div style="font-size:${Math.round(size * 0.9)}px;opacity:0.6"><span data-slot="month"></span> <span data-slot="year"></span></div>
      </div>`
  }

  if (template === "badge") {
    return `<span ${attrs} class="date-badge" style="font-size:${size}px;padding:${(size * 0.4).toFixed(1)}px ${(size * 0.9).toFixed(1)}px" data-slot="full"></span>`
  }

  if (template === "calendar") {
    return `<div ${attrs} class="date-cal" style="width:${Math.round(size * 5)}px">
        <div class="date-cal-head" style="font-size:${Math.round(size * 0.8)}px;padding:${(size * 0.2).toFixed(1)}px 0;background:${page.accent};color:${page.background}" data-slot="month"></div>
        <div class="date-big" style="font-size:${Math.round(size * 2.4)}px;padding:${(size * 0.35).toFixed(1)}px 0 ${(size * 0.15).toFixed(1)}px" data-slot="day"></div>
        <div style="font-size:${Math.round(size * 0.75)}px;opacity:0.6;padding-bottom:${(size * 0.35).toFixed(1)}px" data-slot="weekdayShort"></div>
      </div>`
  }

  return `<div ${attrs} class="muted" style="font-size:${size}px" data-slot="full"></div>`
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
  const { template, target, label, size } = node.props
  const attrs = `data-kind="countdown" data-target="${escapeHtml(target)}" data-label="${escapeHtml(label)}"`

  if (template === "stacked") {
    return `<div ${attrs} style="font-size:${size}px;line-height:1.15">
        <div class="count" style="font-size:${Math.round(size * 3)}px" data-slot="count"></div>
        <div class="muted" data-slot="countLabel"></div>
      </div>`
  }

  if (template === "tile") {
    return `<div ${attrs} class="cd-tile" style="font-size:${size}px">
        <div class="count" style="font-size:${Math.round(size * 2.8)}px;line-height:1" data-slot="count"></div>
        <div class="muted" style="margin-top:0.5rem" data-slot="countLabel"></div>
      </div>`
  }

  if (template === "units") {
    const unit = (slot: string, caption: string) =>
      `<div class="cd-unit" style="padding:${(size * 0.5).toFixed(1)}px ${(size * 0.3).toFixed(1)}px">
          <div class="cd-unit-value" style="font-size:${Math.round(size * 1.8)}px" data-slot="${slot}"></div>
          <div class="cd-unit-label" style="font-size:${Math.round(size * 0.65)}px">${caption}</div>
        </div>`
    return `<div ${attrs} style="font-size:${size}px">
        <div class="cd-units">
          ${unit("days", "days")}
          ${unit("hours", "hrs")}
          ${unit("minutes", "min")}
        </div>
        <div class="muted" style="margin-top:0.5rem" data-slot="untilLabel"></div>
      </div>`
  }

  return `<div ${attrs} style="font-size:${size}px">
        <span class="count" style="font-size:${size * 2}px" data-slot="count"></span>
        <span class="muted" data-slot="countLabel"></span>
      </div>`
}

function weatherHtml(node: NodeOf<"weather">): string {
  const { template, location, temperature, unit, condition, high, low, showRange, size } =
    node.props
  const icon = (scale: number) =>
    `<svg class="weather-icon" ${SVG_ATTRS} style="width:${Math.round(size * scale)}px;height:${Math.round(size * scale)}px">${WEATHER_ICON_SVG[condition]}</svg>`
  const temp = `${temperature}°${unit.toUpperCase()}`
  const label = escapeHtml(WEATHER_LABELS[condition])
  const place = escapeHtml(location)

  if (template === "compact") {
    return `<div class="weather-compact" style="font-size:${size}px">
        ${icon(1.6)}
        <span class="weather-temp" style="font-size:${Math.round(size * 1.4)}px">${temp}</span>
        <span style="opacity:0.6">${place}</span>
      </div>`
  }

  if (template === "stacked") {
    const range = showRange
      ? `\n        <div class="weather-range" style="font-size:${Math.round(size * 0.85)}px">H ${high}° · L ${low}°</div>`
      : ""
    return `<div class="widget weather-stacked" style="font-size:${size}px">
        ${icon(3.4)}
        <div class="weather-temp" style="font-size:${Math.round(size * 2.2)}px">${temp}</div>
        <div style="opacity:0.7">${label}</div>
        <div style="opacity:0.5">${place}</div>${range}
      </div>`
  }

  if (template === "detailed") {
    const range = showRange
      ? `\n        <div class="weather-split" style="font-size:${Math.round(size * 0.85)}px"><span>High ${high}°</span><span>Low ${low}°</span></div>`
      : ""
    return `<div class="widget weather-detailed" style="font-size:${size}px">
        <div class="weather-eyebrow" style="font-size:${Math.round(size * 0.8)}px">${place}</div>
        <div class="weather-headline">
          ${icon(2.6)}
          <div>
            <div class="weather-temp" style="font-size:${Math.round(size * 2.2)}px;line-height:1">${temp}</div>
            <div style="opacity:0.7;margin-top:0.25rem">${label}</div>
          </div>
        </div>${range}
      </div>`
  }

  const range = showRange
    ? `\n          <div class="weather-range" style="font-size:${Math.round(size * 0.85)}px">H ${high}° · L ${low}°</div>`
    : ""

  return `<div class="widget weather" style="font-size:${size}px">
        ${icon(3)}
        <div class="weather-body">
          <div class="weather-temp" style="font-size:${size * 2}px">${temp}</div>
          <div class="weather-condition">${label}</div>
          <div class="weather-location">${place}</div>${range}
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

function nodeBodyHtml(node: CanvasNode, page: PageConfig): string {
  switch (node.type) {
    case "clock":
      return clockHtml(node, page)
    case "date":
      return dateHtml(node, page)
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
  const live = nodes.filter(
    (n) =>
      n.type === "clock" ||
      n.type === "date" ||
      n.type === "countdown" ||
      (n.type === "greeting" && n.props.dynamic)
  )
  if (live.length === 0) return ""

  // A moving second hand or a seconds readout needs a per-second tick.
  const needsSeconds = nodes.some((n) => n.type === "clock" && n.props.seconds)

  return `<script>
    (function () {
      var live = document.querySelectorAll("[data-kind]");

      function pad(value) { return String(value).padStart(2, "0"); }

      function greeting(hour) {
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
      }

      /* Mirrors clockParts() in src/lib/templates.ts. */
      function clockParts(date, hour12) {
        var hours = date.getHours();
        var meridiem = hours < 12 ? "AM" : "PM";
        if (hour12) { hours = hours % 12; if (hours === 0) hours = 12; }
        return {
          h: pad(hours),
          m: pad(date.getMinutes()),
          s: pad(date.getSeconds()),
          meridiem: hour12 ? meridiem : ""
        };
      }

      /* Mirrors countdownParts() in src/lib/templates.ts. */
      function countdownParts(target, now) {
        var end = new Date(target + "T00:00:00");
        if (isNaN(end.getTime())) return { wholeDays: 0, days: 0, hours: 0, minutes: 0, past: false };
        var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var diff = end.getTime() - now.getTime();
        var abs = Math.abs(diff);
        return {
          wholeDays: Math.round((end.getTime() - startOfToday.getTime()) / 86400000),
          days: Math.floor(abs / 86400000),
          hours: Math.floor(abs / 3600000) % 24,
          minutes: Math.floor(abs / 60000) % 60,
          past: diff < 0
        };
      }

      /* Templates expose only the slots they use; missing ones are skipped. */
      function fill(root, slot, text) {
        var el = root.querySelector('[data-slot="' + slot + '"]');
        if (el) el.textContent = text;
      }

      function render() {
        var now = new Date();

        for (var i = 0; i < live.length; i++) {
          var el = live[i];
          var kind = el.getAttribute("data-kind");

          if (kind === "clock") {
            var hour12 = el.getAttribute("data-hour12") === "1";
            var withSeconds = el.getAttribute("data-seconds") === "1";

            if (el.getAttribute("data-analog") === "1") {
              var s = now.getSeconds(), m = now.getMinutes(), h = now.getHours() % 12;
              var angles = { hour: h * 30 + m * 0.5, minute: m * 6 + s * 0.1, second: s * 6 };
              var hands = el.querySelectorAll("[data-hand]");
              for (var j = 0; j < hands.length; j++) {
                var name = hands[j].getAttribute("data-hand");
                hands[j].setAttribute("transform", "rotate(" + angles[name] + " 50 50)");
              }
            } else {
              var parts = clockParts(now, hour12);
              var opts = { hour: "2-digit", minute: "2-digit", hour12: hour12 };
              if (withSeconds) opts.second = "2-digit";
              fill(el, "time", now.toLocaleTimeString([], opts));
              fill(el, "hm", parts.h + ":" + parts.m + (withSeconds ? ":" + parts.s : ""));
              fill(el, "h", parts.h);
              fill(el, "m", parts.m);
              fill(el, "s", parts.s);
              fill(el, "meridiem", parts.meridiem);
            }
          } else if (kind === "date") {
            fill(el, "full", now.toLocaleDateString([], { dateStyle: el.getAttribute("data-style") }));
            fill(el, "weekday", now.toLocaleDateString([], { weekday: "long" }));
            fill(el, "weekdayShort", now.toLocaleDateString([], { weekday: "short" }));
            fill(el, "day", String(now.getDate()));
            fill(el, "month", now.toLocaleDateString([], { month: "long" }));
            fill(el, "monthShort", now.toLocaleDateString([], { month: "short" }));
            fill(el, "year", String(now.getFullYear()));
          } else if (kind === "greeting") {
            if (el.getAttribute("data-dynamic") === "1") el.textContent = greeting(now.getHours());
          } else if (kind === "countdown") {
            var label = el.getAttribute("data-label");
            var cd = countdownParts(el.getAttribute("data-target"), now);
            fill(el, "count", String(Math.abs(cd.wholeDays)));
            fill(el, "countLabel", (cd.wholeDays >= 0 ? " days until " : " days since ") + label);
            fill(el, "days", pad(cd.days));
            fill(el, "hours", pad(cd.hours));
            fill(el, "minutes", pad(cd.minutes));
            fill(el, "untilLabel", (cd.past ? "since " : "until ") + label);
          }
        }
      }

      render();
      setInterval(render, ${needsSeconds ? 1000 : 15000});
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
      const body = nodeBodyHtml(node, page)
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

    /* --- clock templates --- */
    .clock-stacked {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
      line-height: 0.92;
    }

    .clock-tiles { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

    .clock-tile {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      border-radius: ${Math.min(page.radius, 16)}px;
      ${surfaceDeclarations(page)};
    }

    .clock-mono {
      font-family: ${FONT_STACKS.mono};
      letter-spacing: 0.06em;
    }

    /* --- date templates --- */
    .date-stacked { line-height: 1.15; }
    .date-big { font-weight: 600; font-variant-numeric: tabular-nums; line-height: 1; }

    .date-badge {
      display: inline-block;
      border-radius: ${page.radius}px;
      ${surfaceDeclarations(page)};
    }

    .date-cal {
      display: inline-block;
      overflow: hidden;
      text-align: center;
      border-radius: ${Math.min(page.radius, 16)}px;
      ${surfaceDeclarations(page)};
    }

    .date-cal-head { font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

    /* --- countdown templates --- */
    .cd-tile {
      display: inline-block;
      padding: 1rem 1.5rem;
      border-radius: ${Math.min(page.radius, 20)}px;
      ${surfaceDeclarations(page)};
    }

    .cd-units { display: flex; align-items: stretch; justify-content: center; gap: 0.5rem; }

    .cd-unit {
      flex: 1;
      border-radius: ${Math.min(page.radius, 14)}px;
      ${surfaceDeclarations(page)};
    }

    .cd-unit-value { font-weight: 600; font-variant-numeric: tabular-nums; line-height: 1; }
    .cd-unit-label {
      margin-top: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.5;
    }

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
    .weather-compact { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

    .weather-stacked {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 1rem 1.25rem;
      text-align: center;
    }

    .weather-detailed { padding: 1rem 1.25rem; }
    .weather-headline { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; }
    .weather-eyebrow {
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.5;
    }

    .weather-split {
      display: flex;
      justify-content: space-between;
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      font-variant-numeric: tabular-nums;
      opacity: 0.6;
    }
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
