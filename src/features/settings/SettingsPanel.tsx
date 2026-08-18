import { useState } from "react"
import { Download, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import NodeInspector from "@/features/settings/NodeInspector"
import PageInspector from "@/features/settings/PageInspector"
import { downloadExtension } from "@/features/export/exportBundle"
import { useDesignerStore } from "@/store/useDesignerStore"

/**
 * Right-hand inspector. Shows the selected component's settings, or page-wide
 * styling when nothing is selected.
 */
export default function SettingsPanel() {
  const nodes = useDesignerStore((s) => s.nodes)
  const selectedId = useDesignerStore((s) => s.selectedId)
  const reset = useDesignerStore((s) => s.reset)

  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState("")

  const selected = nodes.find((node) => node.id === selectedId) ?? null

  // Icon rendering is async, so the button reports its own progress and failures.
  async function exportExtension() {
    setExporting(true)
    setError("")
    try {
      await downloadExtension()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export failed")
    } finally {
      setExporting(false)
    }
  }

  return (
    <aside className="flex h-full w-[20rem] shrink-0 flex-col border-l border-border bg-background">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight">
            {selected ? selected.name : "Page"}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {selected ? "Component settings" : "Background, style, and manifest"}
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

      <footer className="space-y-2 border-t border-border p-4">
        <Button className="w-full" onClick={exportExtension} disabled={exporting}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {exporting ? "Packaging…" : "Export extension (.zip)"}
        </Button>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <p className="text-center text-[11px] text-muted-foreground">
            Unzip, then load it via chrome://extensions → Load unpacked
          </p>
        )}
      </footer>
    </aside>
  )
}
