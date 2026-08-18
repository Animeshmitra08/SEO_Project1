import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Field, SliderField, TemplatePicker, ToggleRow } from "@/features/settings/fields"
import {
  CLOCK_TEMPLATES,
  COUNTDOWN_TEMPLATES,
  DATE_TEMPLATES,
  WEATHER_TEMPLATES,
  isAnalog,
  type ClockTemplate,
  type CountdownTemplate,
  type DateTemplate,
  type WeatherTemplate,
} from "@/lib/templates"
import { WEATHER_CONDITIONS, WEATHER_LABELS, type WeatherCondition } from "@/lib/icons"
import {
  SEARCH_ENGINES,
  catalogEntry,
  createRecentPage,
  type CanvasNode,
  type DateStyle,
  type NodeOf,
  type SearchEngine,
  type TemperatureUnit,
} from "@/lib/nodes"
import { useDesignerStore } from "@/store/useDesignerStore"

const DATE_STYLES: { value: DateStyle; label: string }[] = [
  { value: "full", label: "Friday, 10 August 2026" },
  { value: "long", label: "10 August 2026" },
  { value: "medium", label: "10 Aug 2026" },
  { value: "short", label: "10/08/2026" },
]

export default function NodeInspector({ node }: { node: CanvasNode }) {
  const renameNode = useDesignerStore((s) => s.renameNode)
  const moveNode = useDesignerStore((s) => s.moveNode)
  const resizeNode = useDesignerStore((s) => s.resizeNode)
  const removeNode = useDesignerStore((s) => s.removeNode)

  const entry = catalogEntry(node.type)
  const Icon = entry.icon

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 p-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-background text-foreground ring-1 ring-border">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{entry.label}</p>
          <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
        </div>
      </div>

      <Field label="Name">
        <Input value={node.name} onChange={(e) => renameNode(node.id, e.target.value)} />
      </Field>

      <Separator />

      <SliderField
        label="Horizontal position"
        value={node.x}
        min={0}
        max={100}
        suffix="%"
        onChange={(x) => moveNode(node.id, x, node.y)}
      />
      <SliderField
        label="Vertical position"
        value={node.y}
        min={0}
        max={100}
        suffix="%"
        onChange={(y) => moveNode(node.id, node.x, y)}
      />
      <SliderField
        label="Width"
        value={node.width}
        min={10}
        max={100}
        suffix="%"
        onChange={(width) => resizeNode(node.id, width)}
      />

      <Separator />

      <NodeProps node={node} />

      <Separator />

      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive"
        onClick={() => removeNode(node.id)}
      >
        <Trash2 className="size-4" />
        Delete component
      </Button>
    </div>
  )
}

/** Per-type controls. The switch narrows `node`, so each editor gets typed props. */
function NodeProps({ node }: { node: CanvasNode }) {
  switch (node.type) {
    case "clock":
      return <ClockProps node={node} />
    case "date":
      return <DateProps node={node} />
    case "greeting":
      return <GreetingProps node={node} />
    case "search":
      return <SearchProps node={node} />
    case "links":
      return <LinksProps node={node} />
    case "quote":
      return <QuoteProps node={node} />
    case "note":
      return <NoteProps node={node} />
    case "countdown":
      return <CountdownProps node={node} />
    case "weather":
      return <WeatherProps node={node} />
    case "recent":
      return <RecentProps node={node} />
  }
}

function ClockProps({ node }: { node: NodeOf<"clock"> }) {
  const updateProps = useDesignerStore((s) => s.updateProps)

  const analog = isAnalog(node.props.template)

  return (
    <div className="space-y-5">
      <TemplatePicker
        templates={CLOCK_TEMPLATES}
        value={node.props.template}
        onChange={(template: ClockTemplate) => updateProps(node, { template })}
      />

      <ToggleRow
        label={analog ? "Second hand" : "Show seconds"}
        checked={node.props.seconds}
        onChange={(seconds) => updateProps(node, { seconds })}
      />
      {/* A dial has no AM/PM to show, so the toggle only applies to digital faces. */}
      {!analog && (
        <ToggleRow
          label="12-hour clock"
          checked={node.props.hour12}
          onChange={(hour12) => updateProps(node, { hour12 })}
        />
      )}
      <SliderField
        label={analog ? "Dial size" : "Font size"}
        value={node.props.size}
        min={16}
        max={140}
        suffix="px"
        onChange={(size) => updateProps(node, { size })}
      />
    </div>
  )
}

function DateProps({ node }: { node: NodeOf<"date"> }) {
  const updateProps = useDesignerStore((s) => s.updateProps)

  const usesFormat = node.props.template === "plain" || node.props.template === "badge"

  return (
    <div className="space-y-5">
      <TemplatePicker
        templates={DATE_TEMPLATES}
        value={node.props.template}
        onChange={(template: DateTemplate) => updateProps(node, { template })}
      />

      {usesFormat && (
      <Field label="Format">
        <Select
          value={node.props.dateStyle}
          onValueChange={(dateStyle) => updateProps(node, { dateStyle: dateStyle as DateStyle })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_STYLES.map((style) => (
              <SelectItem key={style.value} value={style.value}>
                {style.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      )}
      <SliderField
        label="Font size"
        value={node.props.size}
        min={10}
        max={64}
        suffix="px"
        onChange={(size) => updateProps(node, { size })}
      />
    </div>
  )
}

function GreetingProps({ node }: { node: NodeOf<"greeting"> }) {
  const updateProps = useDesignerStore((s) => s.updateProps)

  return (
    <div className="space-y-5">
      <ToggleRow
        label="Time of day"
        checked={node.props.dynamic}
        onChange={(dynamic) => updateProps(node, { dynamic })}
      />
      <Field
        label="Text"
        hint={node.props.dynamic ? "Ignored while “Time of day” is on." : undefined}
      >
        <Input
          value={node.props.text}
          disabled={node.props.dynamic}
          onChange={(e) => updateProps(node, { text: e.target.value })}
        />
      </Field>
      <SliderField
        label="Font size"
        value={node.props.size}
        min={10}
        max={64}
        suffix="px"
        onChange={(size) => updateProps(node, { size })}
      />
    </div>
  )
}

function SearchProps({ node }: { node: NodeOf<"search"> }) {
  const updateProps = useDesignerStore((s) => s.updateProps)

  return (
    <div className="space-y-5">
      <Field label="Placeholder">
        <Input
          value={node.props.placeholder}
          onChange={(e) => updateProps(node, { placeholder: e.target.value })}
        />
      </Field>
      <Field label="Search engine">
        <Select
          value={node.props.engine}
          onValueChange={(engine) => updateProps(node, { engine: engine as SearchEngine })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SEARCH_ENGINES).map(([value, engine]) => (
              <SelectItem key={value} value={value}>
                {engine.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

function LinksProps({ node }: { node: NodeOf<"links"> }) {
  const addLinkTo = useDesignerStore((s) => s.addLinkTo)
  const updateLinkIn = useDesignerStore((s) => s.updateLinkIn)
  const removeLinkFrom = useDesignerStore((s) => s.removeLinkFrom)

  return (
    <div className="space-y-2">
      {node.props.items.map((link) => (
        <div key={link.id} className="flex items-start gap-1.5">
          <div className="grid flex-1 gap-1.5">
            <Input
              value={link.label}
              placeholder="Label"
              className="h-8"
              onChange={(e) => updateLinkIn(node.id, link.id, { label: e.target.value })}
            />
            <Input
              value={link.url}
              placeholder="https://"
              className="h-8 text-xs text-muted-foreground"
              onChange={(e) => updateLinkIn(node.id, link.id, { url: e.target.value })}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => removeLinkFrom(node.id, link.id)}
            aria-label={`Remove ${link.label}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full" onClick={() => addLinkTo(node.id)}>
        <Plus className="size-4" />
        Add link
      </Button>
    </div>
  )
}

function QuoteProps({ node }: { node: NodeOf<"quote"> }) {
  const updateProps = useDesignerStore((s) => s.updateProps)

  return (
    <div className="space-y-5">
      <Field label="Quote">
        <Textarea
          rows={3}
          value={node.props.text}
          onChange={(e) => updateProps(node, { text: e.target.value })}
        />
      </Field>
      <Field label="Author">
        <Input
          value={node.props.author}
          onChange={(e) => updateProps(node, { author: e.target.value })}
        />
      </Field>
      <SliderField
        label="Font size"
        value={node.props.size}
        min={10}
        max={48}
        suffix="px"
        onChange={(size) => updateProps(node, { size })}
      />
    </div>
  )
}

function NoteProps({ node }: { node: NodeOf<"note"> }) {
  const updateProps = useDesignerStore((s) => s.updateProps)

  return (
    <div className="space-y-5">
      <Field label="Text">
        <Textarea
          rows={4}
          value={node.props.text}
          onChange={(e) => updateProps(node, { text: e.target.value })}
        />
      </Field>
      <SliderField
        label="Font size"
        value={node.props.size}
        min={10}
        max={48}
        suffix="px"
        onChange={(size) => updateProps(node, { size })}
      />
    </div>
  )
}

function WeatherProps({ node }: { node: NodeOf<"weather"> }) {
  const updateProps = useDesignerStore((s) => s.updateProps)

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted/60 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground">
        These readings are fixed values you set here — nothing is fetched. Wire them to a
        weather API later without touching the layout.
      </p>

      <TemplatePicker
        templates={WEATHER_TEMPLATES}
        value={node.props.template}
        onChange={(template: WeatherTemplate) => updateProps(node, { template })}
      />

      <Field label="Location">
        <Input
          value={node.props.location}
          onChange={(e) => updateProps(node, { location: e.target.value })}
        />
      </Field>

      <Field label="Condition">
        <Select
          value={node.props.condition}
          onValueChange={(condition) =>
            updateProps(node, { condition: condition as WeatherCondition })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEATHER_CONDITIONS.map((condition) => (
              <SelectItem key={condition} value={condition}>
                {WEATHER_LABELS[condition]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Units">
        <div className="grid grid-cols-2 gap-1.5">
          {(["c", "f"] as TemperatureUnit[]).map((unit) => (
            <Button
              key={unit}
              size="sm"
              variant={node.props.unit === unit ? "default" : "outline"}
              onClick={() => updateProps(node, { unit })}
            >
              °{unit.toUpperCase()}
            </Button>
          ))}
        </div>
      </Field>

      <SliderField
        label="Temperature"
        value={node.props.temperature}
        min={-40}
        max={130}
        suffix="°"
        onChange={(temperature) => updateProps(node, { temperature })}
      />

      <ToggleRow
        label="Show high / low"
        checked={node.props.showRange}
        onChange={(showRange) => updateProps(node, { showRange })}
      />
      {node.props.showRange && (
        <>
          <SliderField
            label="High"
            value={node.props.high}
            min={-40}
            max={130}
            suffix="°"
            onChange={(high) => updateProps(node, { high })}
          />
          <SliderField
            label="Low"
            value={node.props.low}
            min={-40}
            max={130}
            suffix="°"
            onChange={(low) => updateProps(node, { low })}
          />
        </>
      )}

      <SliderField
        label="Font size"
        value={node.props.size}
        min={10}
        max={40}
        suffix="px"
        onChange={(size) => updateProps(node, { size })}
      />
    </div>
  )
}

function RecentProps({ node }: { node: NodeOf<"recent"> }) {
  const updateProps = useDesignerStore((s) => s.updateProps)
  const { heading, items, showUrl, size } = node.props

  return (
    <div className="space-y-5">
      <p className="rounded-md bg-muted/60 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground">
        A standalone page can't read browser history, so these rows are the ones you list
        here. An extension build can swap in <code>chrome.history</code> later.
      </p>

      <Field label="Heading" hint="Leave empty to hide it.">
        <Input value={heading} onChange={(e) => updateProps(node, { heading: e.target.value })} />
      </Field>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-1.5">
            <div className="grid flex-1 gap-1.5">
              <Input
                value={item.title}
                placeholder="Page title"
                className="h-8"
                onChange={(e) =>
                  updateProps(node, {
                    items: items.map((it) =>
                      it.id === item.id ? { ...it, title: e.target.value } : it
                    ),
                  })
                }
              />
              <Input
                value={item.url}
                placeholder="https://"
                className="h-8 text-xs text-muted-foreground"
                onChange={(e) =>
                  updateProps(node, {
                    items: items.map((it) =>
                      it.id === item.id ? { ...it, url: e.target.value } : it
                    ),
                  })
                }
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() =>
                updateProps(node, { items: items.filter((it) => it.id !== item.id) })
              }
              aria-label={`Remove ${item.title}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => updateProps(node, { items: [...items, createRecentPage()] })}
        >
          <Plus className="size-4" />
          Add page
        </Button>
      </div>

      <ToggleRow
        label="Show domain"
        checked={showUrl}
        onChange={(value) => updateProps(node, { showUrl: value })}
      />

      <SliderField
        label="Font size"
        value={size}
        min={10}
        max={32}
        suffix="px"
        onChange={(value) => updateProps(node, { size: value })}
      />
    </div>
  )
}

function CountdownProps({ node }: { node: NodeOf<"countdown"> }) {
  const updateProps = useDesignerStore((s) => s.updateProps)

  return (
    <div className="space-y-5">
      <TemplatePicker
        templates={COUNTDOWN_TEMPLATES}
        value={node.props.template}
        onChange={(template: CountdownTemplate) => updateProps(node, { template })}
      />

      <Field label="Label">
        <Input
          value={node.props.label}
          onChange={(e) => updateProps(node, { label: e.target.value })}
        />
      </Field>
      <Field label="Target date">
        <Input
          type="date"
          value={node.props.target}
          onChange={(e) => updateProps(node, { target: e.target.value })}
        />
      </Field>
      <SliderField
        label="Font size"
        value={node.props.size}
        min={10}
        max={48}
        suffix="px"
        onChange={(size) => updateProps(node, { size })}
      />
    </div>
  )
}
