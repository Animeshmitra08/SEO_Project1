import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import type { TemplateDef } from "@/lib/templates"

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

/**
 * Template chooser. Entries carrying a `group` are rendered under that heading,
 * which is what gives Clock its Analog / Digital split.
 */
export function TemplatePicker<T extends string>({
  templates,
  value,
  onChange,
}: {
  templates: TemplateDef<T>[]
  value: T
  onChange: (value: T) => void
}) {
  const groups = new Map<string, TemplateDef<T>[]>()
  for (const template of templates) {
    const key = template.group ?? ""
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(template)
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-muted-foreground">Template</Label>

      {[...groups].map(([group, entries]) => (
        <div key={group} className="space-y-1.5">
          {group && (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {group}
            </p>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {entries.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onChange(template.id)}
                className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                  value === template.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:border-foreground/25 hover:bg-accent"
                }`}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ToggleRow({
  label,
  checked,
  onChange,
  muted = false,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className={muted ? "text-sm text-muted-foreground" : "text-sm"}>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <span className="relative size-9 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={label}
            className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] cursor-pointer border-0 bg-transparent p-0"
          />
        </span>
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 min-w-0 font-mono text-xs uppercase"
        />
      </div>
    </Field>
  )
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {Math.round(value)}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  )
}
