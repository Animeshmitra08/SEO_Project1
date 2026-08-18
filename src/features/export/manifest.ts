import type { ExtensionConfig } from "@/store/useDesignerStore"
import { ICON_SIZES } from "@/features/export/icons"

/** Chrome accepts one to four dot-separated integers, each 0–65535. */
export function normaliseVersion(version: string): string {
  const parts = version
    .split(".")
    .map((part) => part.replace(/\D/g, ""))
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => String(Math.min(Number(part), 65535)))

  return parts.length > 0 ? parts.join(".") : "1.0.0"
}

/** Folder and archive name — lowercase, hyphenated, filesystem-safe. */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "my-new-tab"
}

/** The MV3 manifest for a new-tab override. */
export function generateManifest(extension: ExtensionConfig): string {
  const icons = Object.fromEntries(
    ICON_SIZES.map((size) => [size, `assets/icons/icon${size}.png`])
  )

  const manifest: Record<string, unknown> = {
    manifest_version: 3,
    name: extension.name.trim() || "My New Tab",
    version: normaliseVersion(extension.version),
  }

  if (extension.shortName.trim()) manifest.short_name = extension.shortName.trim()
  if (extension.description.trim()) manifest.description = extension.description.trim()
  if (extension.homepageUrl.trim()) manifest.homepage_url = extension.homepageUrl.trim()

  manifest.icons = icons
  manifest.chrome_url_overrides = { newtab: "newtab.html" }

  if (extension.toolbarIcon) {
    manifest.action = {
      default_icon: icons,
      default_title: extension.name.trim() || "My New Tab",
    }
  }

  manifest.offline_enabled = true

  return `${JSON.stringify(manifest, null, 2)}\n`
}
