import { useRef, useState } from "react"
import { ImagePlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Field, ToggleRow } from "@/features/settings/fields"
import { normaliseVersion, slugify } from "@/features/export/manifest"
import { useDesignerStore } from "@/store/useDesignerStore"

/** Chrome rejects anything larger, and store listings cap the summary here too. */
const DESCRIPTION_LIMIT = 132
const LOGO_LIMIT_BYTES = 2 * 1024 * 1024

/** manifest.json fields plus the logo the icon set is rendered from. */
export default function ExtensionInspector() {
  const extension = useDesignerStore((s) => s.extension)
  const setExtension = useDesignerStore((s) => s.setExtension)
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")

  function pickLogo(file: File | undefined) {
    if (!file) return
    setError("")

    if (!file.type.startsWith("image/")) {
      setError("Pick a PNG, JPG, SVG, or WebP file.")
      return
    }
    if (file.size > LOGO_LIMIT_BYTES) {
      setError("That image is over 2 MB — try a smaller one.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setExtension("logo", String(reader.result))
      setExtension("logoName", file.name)
    }
    reader.onerror = () => setError("Could not read that file.")
    reader.readAsDataURL(file)
  }

  function clearLogo() {
    setExtension("logo", "")
    setExtension("logoName", "")
    setError("")
    if (fileInput.current) fileInput.current.value = ""
  }

  return (
    <div className="space-y-5">
      <Field label="Logo" hint="Square art works best. Icons are resized to 16, 32, 48, and 128px.">
        <div className="flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-md bg-muted ring-1 ring-border">
            {extension.logo ? (
              <img src={extension.logo} alt="Extension logo" className="size-full object-contain" />
            ) : (
              <ImagePlus className="size-5 text-muted-foreground" />
            )}
          </span>

          <div className="min-w-0 flex-1 space-y-1.5">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => fileInput.current?.click()}
            >
              {extension.logo ? "Replace" : "Upload logo"}
            </Button>
            <p className="truncate text-[11px] text-muted-foreground">
              {extension.logoName || "Auto-generated from your accent colour"}
            </p>
          </div>

          {extension.logo && (
            <Button variant="ghost" size="icon" onClick={clearLogo} aria-label="Remove logo">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => pickLogo(event.target.files?.[0])}
        />

        {error && <p className="text-xs text-destructive">{error}</p>}
      </Field>

      <Separator />

      <Field label="Name" hint={`Exports to ${slugify(extension.name)}/`}>
        <Input
          value={extension.name}
          maxLength={45}
          placeholder="My New Tab"
          onChange={(event) => setExtension("name", event.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Short name">
          <Input
            value={extension.shortName}
            maxLength={12}
            placeholder="Optional"
            onChange={(event) => setExtension("shortName", event.target.value)}
          />
        </Field>
        <Field label="Version" hint={`Reads as ${normaliseVersion(extension.version)}`}>
          <Input
            value={extension.version}
            placeholder="1.0.0"
            className="font-mono text-xs"
            onChange={(event) => setExtension("version", event.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Description"
        hint={`${extension.description.length}/${DESCRIPTION_LIMIT} characters`}
      >
        <Textarea
          value={extension.description}
          maxLength={DESCRIPTION_LIMIT}
          rows={3}
          placeholder="What your new tab page does."
          onChange={(event) => setExtension("description", event.target.value)}
        />
      </Field>

      <Field label="Homepage URL" hint="Optional link shown on the extensions page.">
        <Input
          value={extension.homepageUrl}
          placeholder="https://example.com"
          onChange={(event) => setExtension("homepageUrl", event.target.value)}
        />
      </Field>

      <Separator />

      <ToggleRow
        label="Toolbar icon"
        checked={extension.toolbarIcon}
        onChange={(value) => setExtension("toolbarIcon", value)}
      />
    </div>
  )
}
