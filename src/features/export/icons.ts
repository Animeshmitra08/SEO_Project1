import type { PageConfig } from "@/store/useDesignerStore"

/** Sizes Chrome asks for in `manifest.icons`, plus the standalone logo. */
export const ICON_SIZES = [16, 32, 48, 128] as const
export const LOGO_SIZE = 256

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not read that image"))
    image.src = src
  })
}

function canvasBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Could not encode the icon"))
      blob.arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer)), reject)
    }, "image/png")
  })
}

function roundedPath(ctx: CanvasRenderingContext2D, size: number) {
  const radius = size * 0.22
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.arcTo(size, 0, size, size, radius)
  ctx.arcTo(size, size, 0, size, radius)
  ctx.arcTo(0, size, 0, 0, radius)
  ctx.arcTo(0, 0, size, 0, radius)
  ctx.closePath()
}

/**
 * Fallback mark for designs that never uploaded a logo: the extension's initial
 * on a rounded tile tinted with the page accent.
 */
function drawDefaultIcon(ctx: CanvasRenderingContext2D, size: number, page: PageConfig, initial: string) {
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, page.accent)
  gradient.addColorStop(1, page.backgroundKind === "gradient" ? page.gradientTo : page.background)

  roundedPath(ctx, size)
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.fillStyle = page.textColor
  ctx.font = `600 ${Math.round(size * 0.56)}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(initial, size / 2, size * 0.54)
}

/** Letterbox the uploaded logo into a square so non-square art isn't stretched. */
function drawLogo(ctx: CanvasRenderingContext2D, size: number, image: HTMLImageElement) {
  const scale = Math.min(size / image.width, size / image.height)
  const width = image.width * scale
  const height = image.height * scale
  ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
}

/**
 * Renders `assets/logo.png` and every `assets/icons/icon<size>.png` from the
 * uploaded logo, falling back to a generated mark when there isn't one.
 */
export async function renderIcons(
  logo: string,
  page: PageConfig,
  name: string
): Promise<Map<number, Uint8Array>> {
  const image = logo ? await loadImage(logo) : null
  const initial = (name.trim()[0] ?? "N").toUpperCase()

  const rendered = new Map<number, Uint8Array>()
  for (const size of [...ICON_SIZES, LOGO_SIZE]) {
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas is unavailable in this browser")

    if (image) drawLogo(ctx, size, image)
    else drawDefaultIcon(ctx, size, page, initial)

    rendered.set(size, await canvasBytes(canvas))
  }
  return rendered
}
