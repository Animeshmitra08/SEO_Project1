import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent, DragEvent as ReactDragEvent } from "react"
import NodeView from "@/features/canvas/NodeView"
import { backgroundCss, fontStack } from "@/lib/design"
import {
  DRAG_MIME,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  isComponentType,
  type CanvasNode,
} from "@/lib/nodes"
import { useDesignerStore } from "@/store/useDesignerStore"

/** Percentage distance within which a dragged node snaps to the canvas centre lines. */
const SNAP_THRESHOLD = 1.5

export default function Canvas() {
  const page = useDesignerStore((s) => s.page)
  const nodes = useDesignerStore((s) => s.nodes)
  const selectedId = useDesignerStore((s) => s.selectedId)
  const select = useDesignerStore((s) => s.select)
  const addNode = useDesignerStore((s) => s.addNode)
  const moveNode = useDesignerStore((s) => s.moveNode)
  const removeNode = useDesignerStore((s) => s.removeNode)

  const frameRef = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [isDropTarget, setIsDropTarget] = useState(false)
  const [guides, setGuides] = useState({ x: false, y: false })
  const [scale, setScale] = useState(1)

  /* Fit the fixed-size stage into whatever space the frame has. Measured in a
     layout effect so the first paint is already at the right scale. */
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    function measure() {
      const { width, height } = frame!.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setScale(Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT))
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  /* Delete removes the selection; Escape clears it — unless a field has focus. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable]")) return

      if (event.key === "Escape") select(null)
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault()
        removeNode(selectedId)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedId, select, removeNode])

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDropTarget(false)

    // Guard against arbitrary dropped payloads claiming to be a component.
    const type = event.dataTransfer.getData(DRAG_MIME)
    if (!isComponentType(type) || !surfaceRef.current) return

    const rect = surfaceRef.current.getBoundingClientRect()
    addNode(
      type,
      ((event.clientX - rect.left) / rect.width) * 100,
      ((event.clientY - rect.top) / rect.height) * 100
    )
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>, node: CanvasNode) {
    if (node.locked || event.button !== 0) return
    select(node.id)

    const surface = surfaceRef.current
    if (!surface) return

    const rect = surface.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const originX = node.x
    const originY = node.y
    let moved = false

    function onMove(moveEvent: PointerEvent) {
      const dx = ((moveEvent.clientX - startX) / rect.width) * 100
      const dy = ((moveEvent.clientY - startY) / rect.height) * 100
      if (!moved && Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) return
      moved = true

      let x = originX + dx
      let y = originY + dy
      const snapX = Math.abs(x - 50) < SNAP_THRESHOLD
      const snapY = Math.abs(y - 50) < SNAP_THRESHOLD
      if (snapX) x = 50
      if (snapY) y = 50

      setGuides({ x: snapX, y: snapY })
      moveNode(node.id, x, y)
    }

    function onUp() {
      setGuides({ x: false, y: false })
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  // Chrome drawn on top of the stage is counter-scaled so it stays legible.
  const chromeScale = { transform: `scale(${1 / scale})` }

  return (
    <div
      ref={frameRef}
      onClick={() => select(null)}
      className="grid h-full w-full place-items-center overflow-hidden bg-neutral-950"
    >
      {/* Sized to the *scaled* stage, so centring works on a box that actually
          fits the frame. The stage itself scales from its top-left corner to
          fill this wrapper exactly. */}
      <div
        className="relative"
        style={{ width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale }}
      >
        <div
          ref={surfaceRef}
          onClick={() => select(null)}
          onDragOver={(event) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = "copy"
            setIsDropTarget(true)
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDropTarget(false)
          }}
          onDrop={handleDrop}
          className="absolute left-0 top-0 isolate select-none overflow-hidden transition-[background] duration-300"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            background: backgroundCss(page),
            fontFamily: fontStack(page),
            color: page.textColor,
          }}
        >
          {page.overlay > 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: `rgba(0,0,0,${page.overlay / 100})` }}
            />
          )}

          {nodes.map((node) =>
            node.hidden ? null : (
              <div
                key={node.id}
                onPointerDown={(event) => startDrag(event, node)}
                onClick={(event) => {
                  event.stopPropagation()
                  select(node.id)
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 text-center ${
                  node.locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                } ${
                  selectedId === node.id
                    ? "outline-2 outline-offset-4 outline-sky-400"
                    : "outline-1 outline-offset-4 outline-transparent hover:outline-white/30"
                }`}
                style={{ left: `${node.x}%`, top: `${node.y}%`, width: `${node.width}%` }}
              >
                <NodeView node={node} page={page} />

                {selectedId === node.id && (
                  <span
                    className="pointer-events-none absolute -top-2 left-1/2 origin-bottom whitespace-nowrap rounded bg-sky-400 px-1.5 py-0.5 text-xs font-medium text-white"
                    style={{ transform: `translate(-50%, -100%) scale(${1 / scale})` }}
                  >
                    {node.name}
                  </span>
                )}
              </div>
            )
          )}

          {/* centre guides, shown only while a drag is snapping */}
          {guides.x && (
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-sky-400/70" />
          )}
          {guides.y && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-sky-400/70" />
          )}

          {isDropTarget && (
            <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-dashed border-sky-400/80 bg-sky-400/5" />
          )}

          {nodes.length === 0 && !isDropTarget && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p
                className="rounded-lg bg-black/40 px-4 py-2 text-sm opacity-80 backdrop-blur-sm"
                style={chromeScale}
              >
                Drag a component here to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
