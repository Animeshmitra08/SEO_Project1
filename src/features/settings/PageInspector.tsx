import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ExtensionInspector from "@/features/settings/ExtensionInspector"
import { useImageStatus } from "@/features/settings/useImageStatus"
import { ColorField, Field, SliderField, ToggleRow } from "@/features/settings/fields"
import {
  PRESETS,
  useDesignerStore,
  type BackgroundKind,
  type FontChoice,
  type PresetName,
} from "@/store/useDesignerStore"

const BACKGROUND_KINDS: { value: BackgroundKind; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Image" },
]

const FONTS: { value: FontChoice; label: string }[] = [
  { value: "sans", label: "Sans — Geist" },
  { value: "serif", label: "Serif — Georgia" },
  { value: "mono", label: "Mono — SF Mono" },
]

/** Radii at or above this are treated as fully rounded "pill" corners. */
const PILL_RADIUS = 999

/** A background that fails to load leaves the stage blank, so say so explicitly. */
function BackgroundImageField() {
  const backgroundImage = useDesignerStore((s) => s.page.backgroundImage)
  const setPage = useDesignerStore((s) => s.setPage)
  const status = useImageStatus(backgroundImage)

  return (
    <Field label="Image URL" hint="Any direct link to a .jpg, .png, or .webp file.">
      <Input
        value={backgroundImage}
        placeholder="https://images.example.com/wallpaper.jpg"
        onChange={(e) => setPage("backgroundImage", e.target.value)}
      />

      {status.state === "checking" && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Checking the image…
        </p>
      )}

      {status.state === "ok" && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          Loaded — {status.width} × {status.height}
        </p>
      )}

      {status.state === "error" && (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          <span>
            This image can&apos;t be loaded. {status.hint}
          </span>
        </p>
      )}
    </Field>
  )
}

export default function PageInspector() {
  const page = useDesignerStore((s) => s.page)
  const setPage = useDesignerStore((s) => s.setPage)
  const applyPreset = useDesignerStore((s) => s.applyPreset)

  return (
    <div className="space-y-6">
      <Field label="Presets">
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(PRESETS) as PresetName[]).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => applyPreset(name)}
              title={PRESETS[name].label}
              className="group space-y-1.5 text-left"
            >
              <span
                className="block h-10 w-full rounded-md ring-1 ring-border transition-all group-hover:ring-2 group-hover:ring-foreground/30"
                style={{ background: PRESETS[name].swatch }}
              />
              <span className="block truncate text-[10px] text-muted-foreground">
                {PRESETS[name].label}
              </span>
            </button>
          ))}
        </div>
      </Field>

      <Separator />

      <Tabs defaultValue="background">
        <TabsList className="w-full">
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="extension">Extension</TabsTrigger>
        </TabsList>

        <TabsContent value="background" className="space-y-5 pt-4">
          <Field label="Type">
            <div className="grid grid-cols-3 gap-1.5">
              {BACKGROUND_KINDS.map((kind) => (
                <Button
                  key={kind.value}
                  size="sm"
                  variant={page.backgroundKind === kind.value ? "default" : "outline"}
                  onClick={() => setPage("backgroundKind", kind.value)}
                >
                  {kind.label}
                </Button>
              ))}
            </div>
          </Field>

          {page.backgroundKind === "solid" && (
            <ColorField
              label="Color"
              value={page.background}
              onChange={(v) => setPage("background", v)}
            />
          )}

          {page.backgroundKind === "gradient" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="From"
                  value={page.gradientFrom}
                  onChange={(v) => setPage("gradientFrom", v)}
                />
                <ColorField
                  label="To"
                  value={page.gradientTo}
                  onChange={(v) => setPage("gradientTo", v)}
                />
              </div>
              <SliderField
                label="Angle"
                value={page.gradientAngle}
                min={0}
                max={360}
                step={5}
                suffix="°"
                onChange={(v) => setPage("gradientAngle", v)}
              />
            </>
          )}

          {page.backgroundKind === "image" && <BackgroundImageField />}

          <SliderField
            label="Dim overlay"
            value={page.overlay}
            min={0}
            max={90}
            step={5}
            suffix="%"
            onChange={(v) => setPage("overlay", v)}
          />
        </TabsContent>

        <TabsContent value="style" className="space-y-5 pt-4">
          <Field label="Font">
            <Select value={page.font} onValueChange={(v) => setPage("font", v as FontChoice)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Text"
              value={page.textColor}
              onChange={(v) => setPage("textColor", v)}
            />
            <ColorField label="Accent" value={page.accent} onChange={(v) => setPage("accent", v)} />
          </div>

          <Separator />

          <ToggleRow
            label="Pill corners"
            checked={page.radius >= PILL_RADIUS}
            onChange={(v) => setPage("radius", v ? PILL_RADIUS : 16)}
          />
          {page.radius < PILL_RADIUS && (
            <SliderField
              label="Corner radius"
              value={page.radius}
              min={0}
              max={32}
              suffix="px"
              onChange={(v) => setPage("radius", v)}
            />
          )}

          <Separator />

          <ToggleRow
            label="Frosted glass"
            checked={page.glass}
            onChange={(v) => setPage("glass", v)}
          />
        </TabsContent>

        <TabsContent value="extension" className="pt-4">
          <ExtensionInspector />
        </TabsContent>
      </Tabs>
    </div>
  )
}
