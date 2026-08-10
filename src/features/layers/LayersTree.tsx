import { useState } from "react"
import type { DragEvent as ReactDragEvent, ReactNode } from "react"
import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Lock,
  LockOpen,
  Trash2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { catalogEntry, LAYER_DRAG_MIME, type CanvasNode } from "@/lib/nodes"
import { useDesignerStore } from "@/store/useDesignerStore"

type DropTarget = { index: number; edge: "before" | "after" }

/**
 * Tree of everything placed on the canvas, front-most first. Rows can be
 * dragged to change paint order, renamed, hidden, locked, duplicated, deleted.
 */
export default function LayersTree() {
  const nodes = useDesignerStore((s) => s.nodes)
  const selectedId = useDesignerStore((s) => s.selectedId)
  const select = useDesignerStore((s) => s.select)
  const reorderNode = useDesignerStore((s) => s.reorderNode)

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  // Front-most renders last, so show the array reversed.
  const rows = [...nodes].reverse()
  const toArrayIndex = (displayIndex: number) => nodes.length - 1 - displayIndex

  function handleDragOver(event: ReactDragEvent<HTMLDivElement>, displayIndex: number) {
    if (dragIndex === null) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"

    const rect = event.currentTarget.getBoundingClientRect()
    const edge = event.clientY < rect.top + rect.height / 2 ? "before" : "after"
    setDropTarget({ index: displayIndex, edge })
  }

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (dragIndex === null || !dropTarget) return

    // "before" means visually higher, which is further forward in paint order.
    const base = toArrayIndex(dropTarget.index)
    reorderNode(dragIndex, dropTarget.edge === "before" ? base + 1 : base)

    setDragIndex(null)
    setDropTarget(null)
  }

  return (
    <div className="space-y-0.5" onDragEnd={() => { setDragIndex(null); setDropTarget(null) }}>
      {/* root */}
      <button
        type="button"
        onClick={() => select(null)}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
          selectedId === null ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
        }`}
      >
        <ChevronDown className="size-3.5 text-muted-foreground" />
        <Layers className="size-3.5 text-muted-foreground" />
        New Tab Page
        <span className="ml-auto text-[10px] font-normal text-muted-foreground">
          {nodes.length}
        </span>
      </button>

      {/* children */}
      <div className="ml-[13px] border-l border-border pl-2">
        {rows.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Nothing placed yet — drag a component onto the canvas.
          </p>
        )}

        {rows.map((node, displayIndex) => (
          <LayerRow
            key={node.id}
            node={node}
            selected={selectedId === node.id}
            dragging={dragIndex === toArrayIndex(displayIndex)}
            dropEdge={dropTarget?.index === displayIndex ? dropTarget.edge : null}
            onSelect={() => select(node.id)}
            onDragStart={(event) => {
              const index = toArrayIndex(displayIndex)
              event.dataTransfer.setData(LAYER_DRAG_MIME, String(index))
              event.dataTransfer.effectAllowed = "move"
              setDragIndex(index)
            }}
            onDragOver={(event) => handleDragOver(event, displayIndex)}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  )
}

function LayerRow({
  node,
  selected,
  dragging,
  dropEdge,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  node: CanvasNode
  selected: boolean
  dragging: boolean
  dropEdge: "before" | "after" | null
  onSelect: () => void
  onDragStart: (event: ReactDragEvent<HTMLDivElement>) => void
  onDragOver: (event: ReactDragEvent<HTMLDivElement>) => void
  onDrop: (event: ReactDragEvent<HTMLDivElement>) => void
}) {
  const renameNode = useDesignerStore((s) => s.renameNode)
  const removeNode = useDesignerStore((s) => s.removeNode)
  const duplicateNode = useDesignerStore((s) => s.duplicateNode)
  const toggleHidden = useDesignerStore((s) => s.toggleHidden)
  const toggleLocked = useDesignerStore((s) => s.toggleLocked)

  const [draft, setDraft] = useState<string | null>(null)
  const Icon = catalogEntry(node.type).icon

  function commitRename() {
    if (draft !== null && draft.trim()) renameNode(node.id, draft.trim())
    setDraft(null)
  }

  return (
    <div
      draggable={draft === null}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      onDoubleClick={() => setDraft(node.name)}
      className={`group relative flex items-center gap-1 rounded-md py-1 pl-1 pr-1 text-xs transition-colors ${
        selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
      } ${dragging ? "opacity-40" : ""} ${
        dropEdge === "before"
          ? "before:absolute before:inset-x-0 before:-top-px before:h-0.5 before:rounded-full before:bg-sky-400"
          : dropEdge === "after"
            ? "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-sky-400"
            : ""
      }`}
    >
      <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground/50" />
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />

      {draft === null ? (
        <span className={`min-w-0 flex-1 truncate ${node.hidden ? "opacity-40" : ""}`}>
          {node.name}
        </span>
      ) : (
        <Input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitRename()
            if (event.key === "Escape") setDraft(null)
          }}
          onClick={(event) => event.stopPropagation()}
          className="h-6 flex-1 px-1 py-0 text-xs"
        />
      )}

      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 has-[button:focus-visible]:opacity-100">
        <RowAction label="Duplicate" onClick={() => duplicateNode(node.id)}>
          <Copy className="size-3" />
        </RowAction>
        <RowAction label={node.locked ? "Unlock" : "Lock"} onClick={() => toggleLocked(node.id)}>
          {node.locked ? <Lock className="size-3" /> : <LockOpen className="size-3" />}
        </RowAction>
        <RowAction label="Delete" onClick={() => removeNode(node.id)} danger>
          <Trash2 className="size-3" />
        </RowAction>
      </div>

      {/* visibility stays visible so hidden layers are obvious at a glance */}
      <RowAction
        label={node.hidden ? "Show" : "Hide"}
        onClick={() => toggleHidden(node.id)}
        className={node.hidden ? "" : "opacity-0 group-hover:opacity-100"}
      >
        {node.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </RowAction>
    </div>
  )
}

function RowAction({
  label,
  onClick,
  children,
  danger = false,
  className = "",
}: {
  label: string
  onClick: () => void
  children: ReactNode
  danger?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={`grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-background ${
        danger ? "hover:text-destructive" : "hover:text-foreground"
      } ${className}`}
    >
      {children}
    </button>
  )
}
