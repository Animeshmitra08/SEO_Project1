import { Link } from "react-router-dom"
import {
  ArrowRight,
  Blocks,
  Download,
  Eye,
  Link2,
  Palette,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react"
import { SiGithub } from "react-icons/si"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Palette,
    title: "Backgrounds that pop",
    body: "Solid colors, custom gradients with a live angle dial, or any image URL — with an adjustable dimming overlay.",
  },
  {
    icon: Search,
    title: "Real search bar",
    body: "Pick Google, Bing, or DuckDuckGo. The exported page ships a working form, not a decorative input.",
  },
  {
    icon: Link2,
    title: "Quick links",
    body: "Add, rename, and reorder the shortcuts you actually use. They render as tidy tiles under the search box.",
  },
  {
    icon: Eye,
    title: "Live preview",
    body: "Every control updates the canvas instantly. What you see is precisely what gets exported.",
  },
  {
    icon: Blocks,
    title: "Presets to start from",
    body: "Five hand-tuned themes — Midnight, Sunset, Forest, Paper, Ink — each a single click away.",
  },
  {
    icon: Download,
    title: "Zero-dependency export",
    body: "Download one self-contained HTML file. No build step, no runtime, no tracking. Just open it.",
  },
]

const steps = [
  { n: "01", title: "Pick a preset", body: "Start from a theme that already looks good, then make it yours." },
  { n: "02", title: "Tune the details", body: "Background, greeting, clock, search engine, quick links, typography." },
  { n: "03", title: "Export & install", body: "Download the zipped extension — manifest, page, and icons — and load it unpacked." },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- Nav ---------- */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
              <Wand2 className="size-4" />
            </span>
            Extension Designer
          </Link>

          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
                <SiGithub className="size-4" />
              </a>
            </Button>
            <Button asChild>
              <Link to="/designer">
                Open Designer
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[42rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 65%)" }}
        />

        <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <Badge variant="secondary" className="mb-6 gap-1.5 rounded-full px-3 py-1">
            <Sparkles className="size-3.5" />
            Design it visually, ship it as one file
          </Badge>

          <h1 className="mx-auto max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Build your perfect{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(120deg, #8b5cf6, #ec4899, #f59e0b)" }}
            >
              new tab page
            </span>{" "}
            without writing code
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
            A visual designer for browser new-tab extensions. Tweak the background, search
            bar, clock, and shortcuts on a live canvas — then export clean, standalone HTML.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/designer">
                Start designing
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <a href="#how">See how it works</a>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Free · Runs entirely in your browser · Nothing uploaded
          </p>

          <HeroPreview />
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need, nothing you don't
          </h2>
          <p className="mt-4 text-muted-foreground">
            Each control maps to something real in the exported page.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="group transition-all hover:-translate-y-0.5 hover:ring-foreground/20"
            >
              <CardContent className="space-y-3">
                <span className="grid size-10 place-items-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="scroll-mt-20 border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Three steps to a new tab
            </h2>
          </div>

          <ol className="mt-14 grid gap-10 sm:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="relative">
                <span className="text-sm font-medium tabular-nums text-muted-foreground/60">
                  {step.n}
                </span>
                <h3 className="mt-2 text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div
          className="relative overflow-hidden rounded-2xl px-8 py-16 text-center"
          style={{ background: "linear-gradient(135deg, #0f172a, #4c1d95)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, #ec4899, transparent 70%)" }}
          />
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your browser opens a new tab dozens of times a day
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/70">
            Make it a page you actually want to look at. Takes about two minutes.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-8">
            <Link to="/designer">
              Open the designer
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>Built with React, Tailwind, and shadcn/ui.</p>
          <Link to="/designer" className="transition-colors hover:text-foreground">
            Open Designer →
          </Link>
        </div>
      </footer>
    </div>
  )
}

/** A miniature, non-interactive mock of what the designer produces. */
function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl">
      <div className="overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-foreground/10">
        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/50 px-4 py-3">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
          <div className="ml-3 h-6 flex-1 rounded-md bg-background/70" />
        </div>

        {/* mock new tab */}
        <div
          className="flex aspect-[16/9] flex-col items-center justify-center gap-6 px-6"
          style={{ background: "linear-gradient(135deg, #0f172a, #4c1d95)" }}
        >
          <div className="text-center">
            <div className="text-4xl font-semibold tabular-nums text-white sm:text-5xl">9:41</div>
            <div className="mt-1 text-sm text-white/60">Good to see you</div>
          </div>

          <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-xl">
            <Search className="size-4 shrink-0 text-white/60" />
            <span className="text-sm text-white/50">Search the web...</span>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {["GitHub", "Gmail", "YouTube", "Calendar"].map((label) => (
              <span
                key={label}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
