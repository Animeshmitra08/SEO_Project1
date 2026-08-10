import { Layers, Shapes } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import ComponentPalette from "@/features/palette/ComponentPalette"
import LayersTree from "@/features/layers/LayersTree"

/** Left rail: the component library on top, the layer tree beneath it. */
export default function LibraryPanel() {
  return (
    <aside className="flex h-full w-[16rem] shrink-0 flex-col border-r border-border bg-background">
      <section className="shrink-0 border-b border-border">
        <SectionHeader icon={Shapes} title="Components" hint="Drag onto the canvas" />
        <div className="px-3 pb-3">
          <ComponentPalette />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <SectionHeader icon={Layers} title="Layers" hint="Front to back" />
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-2 pb-3">
            <LayersTree />
          </div>
        </ScrollArea>
      </section>
    </aside>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Layers
  title: string
  hint: string
}) {
  return (
    <header className="flex items-baseline justify-between gap-2 px-3 py-3">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
        <Icon className="size-3.5 text-muted-foreground" />
        {title}
      </h2>
      <span className="text-[10px] text-muted-foreground">{hint}</span>
    </header>
  )
}
