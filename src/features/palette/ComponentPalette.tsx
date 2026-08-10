import type { DragEvent as ReactDragEvent } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { COMPONENT_CATALOG, DRAG_MIME, type ComponentType } from "@/lib/nodes"
import { useDesignerStore } from "@/store/useDesignerStore"

/**
 * The drag source for new components. Items can be dragged onto the canvas to
 * place them precisely, or clicked to drop one in the centre.
 */
export default function ComponentPalette() {
  const addNode = useDesignerStore((s) => s.addNode)

  function handleDragStart(event: ReactDragEvent<HTMLButtonElement>, type: ComponentType) {
    event.dataTransfer.setData(DRAG_MIME, type)
    event.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {COMPONENT_CATALOG.map(({ type, label, description, icon: Icon }) => (
        <Tooltip key={type}>
          <TooltipTrigger asChild>
            <button
              type="button"
              draggable
              onDragStart={(event) => handleDragStart(event, type)}
              onClick={() => addNode(type)}
              className="flex cursor-grab flex-col items-start gap-1.5 rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-foreground/25 hover:bg-accent active:cursor-grabbing"
            >
              <Icon className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium leading-tight">{label}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{label}</p>
            <p className="text-muted-foreground">{description}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
