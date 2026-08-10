import { Download, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import NodeInspector from "@/features/settings/NodeInspector"
import PageInspector from "@/features/settings/PageInspector"
import { downloadHtml } from "@/features/export/generateHtml"
import { useDesignerStore } from "@/store/useDesignerStore"

/**
 * Right-hand inspector. Shows the selected component's settings, or page-wide
 * styling when nothing is selected.
 */
export default function SettingsPanel() {
  const nodes = useDesignerStore((s) => s.nodes)
  const selectedId = useDesignerStore((s) => s.selectedId)
  const reset = useDesignerStore((s) => s.reset)

  const selected = nodes.find((node) => node.id === selectedId) ?? null

  return (
    <aside className="flex h-full w-[20rem] shrink-0 flex-col border-l border-border bg-background">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight">
            {selected ? selected.name : "Page"}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {selected ? "Component settings" : "Background and typography"}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={reset} aria-label="Reset everything">
          <RotateCcw className="size-4" />
        </Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {selected ? <NodeInspector key={selected.id} node={selected} /> : <PageInspector />}
        </div>
      </ScrollArea>

      <footer className="border-t border-border p-4">
        <Button className="w-full" onClick={downloadHtml}>
          <Download className="size-4" />
          Export newtab.html
        </Button>
      </footer>
    </aside>
  )
}
