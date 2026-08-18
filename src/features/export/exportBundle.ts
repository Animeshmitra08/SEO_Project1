import { createZip, type ZipEntry } from "@/lib/zip"
import { generateCSS, generateHTML, generateNewtabJS } from "@/features/export/generateHtml"
import { ICON_SIZES, LOGO_SIZE, renderIcons } from "@/features/export/icons"
import { generateManifest, slugify } from "@/features/export/manifest"
import { useDesignerStore } from "@/store/useDesignerStore"

const text = (name: string, value: string): ZipEntry => ({
  name,
  data: new TextEncoder().encode(value),
})

/**
 * Assembles the unpacked-extension tree:
 *
 *   <slug>/manifest.json
 *   <slug>/newtab.html
 *   <slug>/newtab.css
 *   <slug>/newtab.js
 *   <slug>/assets/logo.png
 *   <slug>/assets/icons/icon{16,32,48,128}.png
 */
export async function buildBundle(): Promise<{ folder: string; files: ZipEntry[] }> {
  const { page, nodes, extension } = useDesignerStore.getState()
  const folder = slugify(extension.name)

  const icons = await renderIcons(extension.logo, page, extension.name)

  const files: ZipEntry[] = [
    text(`${folder}/manifest.json`, generateManifest(extension)),
    text(`${folder}/newtab.html`, generateHTML(page, nodes, extension)),
    text(`${folder}/newtab.css`, generateCSS(page)),
    text(`${folder}/newtab.js`, generateNewtabJS(nodes)),
    { name: `${folder}/assets/logo.png`, data: icons.get(LOGO_SIZE)! },
    ...ICON_SIZES.map((size) => ({
      name: `${folder}/assets/icons/icon${size}.png`,
      data: icons.get(size)!,
    })),
  ]

  return { folder, files }
}

/** Build the extension from current state and save it as <slug>.zip. */
export async function downloadExtension(): Promise<void> {
  const { folder, files } = await buildBundle()
  const blob = await createZip(files)
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${folder}.zip`
  anchor.click()

  // Revoking too early cancels the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
