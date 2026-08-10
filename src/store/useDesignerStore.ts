import { create } from "zustand"
import {
  createNode,
  createQuickLink,
  newId,
  type CanvasNode,
  type ComponentType,
  type NodeOf,
  type NodePropsMap,
} from "@/lib/nodes"

export type BackgroundKind = "solid" | "gradient" | "image"
export type FontChoice = "sans" | "serif" | "mono"

/** Page-level styling. Everything else lives on individual canvas nodes. */
export type PageConfig = {
  /* Background */
  backgroundKind: BackgroundKind
  background: string
  gradientFrom: string
  gradientTo: string
  gradientAngle: number
  backgroundImage: string
  overlay: number

  /* Typography + shape */
  font: FontChoice
  textColor: string
  accent: string
  radius: number
  glass: boolean
}

type DesignerActions = {
  setPage: <K extends keyof PageConfig>(key: K, value: PageConfig[K]) => void
  applyPreset: (name: PresetName) => void
  reset: () => void

  /* Node lifecycle */
  select: (id: string | null) => void
  addNode: (type: ComponentType, x?: number, y?: number) => void
  removeNode: (id: string) => void
  duplicateNode: (id: string) => void
  renameNode: (id: string, name: string) => void
  moveNode: (id: string, x: number, y: number) => void
  resizeNode: (id: string, width: number) => void
  toggleHidden: (id: string) => void
  toggleLocked: (id: string) => void
  /** Move a node within the paint order. Later in the array renders in front. */
  reorderNode: (from: number, to: number) => void
  updateProps: <K extends ComponentType>(
    node: NodeOf<K>,
    patch: Partial<NodePropsMap[K]>
  ) => void

  /* Quick-link helpers, scoped to a links node */
  addLinkTo: (nodeId: string) => void
  updateLinkIn: (nodeId: string, linkId: string, patch: { label?: string; url?: string }) => void
  removeLinkFrom: (nodeId: string, linkId: string) => void
}

export type DesignerState = {
  page: PageConfig
  nodes: CanvasNode[]
  selectedId: string | null
} & DesignerActions

const defaultPage: PageConfig = {
  backgroundKind: "gradient",
  background: "#0f172a",
  gradientFrom: "#0f172a",
  gradientTo: "#4c1d95",
  gradientAngle: 135,
  backgroundImage: "",
  overlay: 0,

  font: "sans",
  textColor: "#f8fafc",
  accent: "#8b5cf6",
  radius: 999,
  glass: true,
}

/** The starting layout: a centred clock / greeting / search / links stack. */
const defaultNodes = (): CanvasNode[] => [
  createNode("clock", 50, 30),
  createNode("greeting", 50, 40),
  createNode("search", 50, 52),
  createNode("links", 50, 64),
]

export const PRESETS = {
  midnight: {
    label: "Midnight",
    swatch: "linear-gradient(135deg, #0f172a, #4c1d95)",
    config: {
      backgroundKind: "gradient",
      gradientFrom: "#0f172a",
      gradientTo: "#4c1d95",
      gradientAngle: 135,
      textColor: "#f8fafc",
      accent: "#8b5cf6",
      glass: true,
      radius: 999,
    },
  },
  sunset: {
    label: "Sunset",
    swatch: "linear-gradient(135deg, #fb7185, #f59e0b)",
    config: {
      backgroundKind: "gradient",
      gradientFrom: "#be123c",
      gradientTo: "#f59e0b",
      gradientAngle: 120,
      textColor: "#fffbeb",
      accent: "#f59e0b",
      glass: true,
      radius: 999,
    },
  },
  forest: {
    label: "Forest",
    swatch: "linear-gradient(135deg, #064e3b, #10b981)",
    config: {
      backgroundKind: "gradient",
      gradientFrom: "#022c22",
      gradientTo: "#047857",
      gradientAngle: 160,
      textColor: "#ecfdf5",
      accent: "#10b981",
      glass: true,
      radius: 16,
    },
  },
  paper: {
    label: "Paper",
    swatch: "#f5f5f4",
    config: {
      backgroundKind: "solid",
      background: "#f5f5f4",
      textColor: "#1c1917",
      accent: "#1c1917",
      glass: false,
      radius: 12,
    },
  },
  ink: {
    label: "Ink",
    swatch: "#0a0a0a",
    config: {
      backgroundKind: "solid",
      background: "#0a0a0a",
      textColor: "#fafafa",
      accent: "#fafafa",
      glass: false,
      radius: 8,
    },
  },
} satisfies Record<string, { label: string; swatch: string; config: Partial<PageConfig> }>

export type PresetName = keyof typeof PRESETS

/** Apply `patch` to whichever node matches `id`, leaving the rest untouched. */
const patchNode = (
  nodes: CanvasNode[],
  id: string,
  patch: (node: CanvasNode) => CanvasNode
) => nodes.map((node) => (node.id === id ? patch(node) : node))

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const useDesignerStore = create<DesignerState>((set) => ({
  page: defaultPage,
  nodes: defaultNodes(),
  selectedId: null,

  setPage: (key, value) => set((state) => ({ page: { ...state.page, [key]: value } })),

  applyPreset: (name) =>
    set((state) => ({ page: { ...state.page, ...PRESETS[name].config } })),

  reset: () => set({ page: defaultPage, nodes: defaultNodes(), selectedId: null }),

  select: (id) => set({ selectedId: id }),

  addNode: (type, x = 50, y = 50) =>
    set((state) => {
      const node = createNode(type, clamp(x, 2, 98), clamp(y, 2, 98))
      return { nodes: [...state.nodes, node], selectedId: node.id }
    }),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  duplicateNode: (id) =>
    set((state) => {
      const index = state.nodes.findIndex((node) => node.id === id)
      if (index === -1) return state
      const source = state.nodes[index]
      const copy = {
        ...structuredClone(source),
        id: newId(),
        name: `${source.name} copy`,
        x: clamp(source.x + 4, 2, 98),
        y: clamp(source.y + 4, 2, 98),
      } as CanvasNode
      const nodes = [...state.nodes]
      nodes.splice(index + 1, 0, copy)
      return { nodes, selectedId: copy.id }
    }),

  renameNode: (id, name) =>
    set((state) => ({ nodes: patchNode(state.nodes, id, (node) => ({ ...node, name })) })),

  moveNode: (id, x, y) =>
    set((state) => ({
      nodes: patchNode(state.nodes, id, (node) => ({
        ...node,
        x: clamp(x, 0, 100),
        y: clamp(y, 0, 100),
      })),
    })),

  resizeNode: (id, width) =>
    set((state) => ({
      nodes: patchNode(state.nodes, id, (node) => ({
        ...node,
        width: clamp(width, 10, 100),
      })),
    })),

  toggleHidden: (id) =>
    set((state) => ({
      nodes: patchNode(state.nodes, id, (node) => ({ ...node, hidden: !node.hidden })),
    })),

  toggleLocked: (id) =>
    set((state) => ({
      nodes: patchNode(state.nodes, id, (node) => ({ ...node, locked: !node.locked })),
    })),

  reorderNode: (from, to) =>
    set((state) => {
      if (from === to || from < 0 || from >= state.nodes.length) return state
      const nodes = [...state.nodes]
      const [moved] = nodes.splice(from, 1)
      // `to` indexes the original array, so account for the gap left by the splice.
      nodes.splice(clamp(from < to ? to - 1 : to, 0, nodes.length), 0, moved)
      return { nodes }
    }),

  updateProps: (node, patch) =>
    set((state) => ({
      nodes: patchNode(state.nodes, node.id, (current) => ({
        ...current,
        props: { ...current.props, ...patch },
      }) as CanvasNode),
    })),

  addLinkTo: (nodeId) =>
    set((state) => ({
      nodes: patchNode(state.nodes, nodeId, (node) =>
        node.type === "links"
          ? { ...node, props: { items: [...node.props.items, createQuickLink()] } }
          : node
      ),
    })),

  updateLinkIn: (nodeId, linkId, patch) =>
    set((state) => ({
      nodes: patchNode(state.nodes, nodeId, (node) =>
        node.type === "links"
          ? {
              ...node,
              props: {
                items: node.props.items.map((link) =>
                  link.id === linkId ? { ...link, ...patch } : link
                ),
              },
            }
          : node
      ),
    })),

  removeLinkFrom: (nodeId, linkId) =>
    set((state) => ({
      nodes: patchNode(state.nodes, nodeId, (node) =>
        node.type === "links"
          ? { ...node, props: { items: node.props.items.filter((l) => l.id !== linkId) } }
          : node
      ),
    })),
}))
