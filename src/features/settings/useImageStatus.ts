import { useEffect, useState } from "react"
import { useDebounceValue } from "usehooks-ts"

export type ImageStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok"; width: number; height: number }
  | { state: "error"; hint: string }

/** Hosts that hand out page links people mistake for image links. */
const SHARE_HOSTS: [RegExp, string][] = [
  [/drive\.google\.com/, "Google Drive share links point at a viewer page, not the file itself."],
  [/dropbox\.com/, "Dropbox share links open a preview page — swap ?dl=0 for ?raw=1."],
  [/unsplash\.com\/photos/, "That's the photo's page. Use Download, then copy the images.unsplash.com link."],
  [/pinterest\./, "Pinterest pins are pages. Open the image itself and copy its address."],
  [/google\.[a-z.]+\/(imgres|search)/, "That's a Google Images result page, not the image."],
]

function hintFor(url: string): string {
  if (/^file:/i.test(url) || /^[/~]/.test(url)) {
    return "Local file paths can't be loaded by a web page — upload the image somewhere first."
  }
  if (!/^https?:\/\//i.test(url)) return "The address needs to start with http:// or https://."

  for (const [pattern, hint] of SHARE_HOSTS) {
    if (pattern.test(url)) return hint
  }
  return "Open the image on its own and copy that address — it should end in .jpg, .png, or .webp."
}

/**
 * Loads `url` off-screen so the inspector can say whether the canvas will
 * actually be able to paint it. A failed background is otherwise invisible:
 * the stage just goes dark.
 */
export function useImageStatus(url: string): ImageStatus {
  const [debounced] = useDebounceValue(url.trim(), 400)
  const [status, setStatus] = useState<ImageStatus>({ state: "idle" })

  useEffect(() => {
    if (!debounced) {
      setStatus({ state: "idle" })
      return
    }

    setStatus({ state: "checking" })
    const image = new Image()
    let cancelled = false

    image.onload = () => {
      if (!cancelled) setStatus({ state: "ok", width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      if (!cancelled) setStatus({ state: "error", hint: hintFor(debounced) })
    }
    image.src = debounced

    return () => {
      cancelled = true
      image.src = ""
    }
  }, [debounced])

  return status
}
