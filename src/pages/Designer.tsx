import { Link } from "react-router-dom"
import { ArrowLeft, Wand2 } from "lucide-react"
import Canvas from "@/features/canvas/Canvas"
import LibraryPanel from "@/features/panels/LibraryPanel"
import SettingsPanel from "@/features/settings/SettingsPanel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function Designer() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <span className="h-5 w-px bg-border" />
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid size-6 place-items-center rounded-md bg-foreground text-background">
              <Wand2 className="size-3.5" />
            </span>
            Extension Designer
          </span>
        </div>

        <Badge variant="secondary" className="hidden sm:inline-flex">
          Live preview
        </Badge>
      </header>

      <div className="flex min-h-0 flex-1">
        <LibraryPanel />

        <main className="min-w-0 flex-1 p-4">
          <div className="h-full w-full overflow-hidden rounded-xl shadow-sm ring-1 ring-border">
            <Canvas />
          </div>
        </main>

        <SettingsPanel />
      </div>
    </div>
  )
}
