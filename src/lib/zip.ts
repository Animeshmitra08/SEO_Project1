/**
 * Minimal ZIP writer — enough of the spec to produce an archive Chrome and the
 * OS unpacker both accept, without pulling in a dependency.
 *
 * Entries are deflated when the browser exposes CompressionStream, and stored
 * verbatim otherwise.
 */

export type ZipEntry = {
  /** Path inside the archive, using forward slashes. */
  name: string
  data: Uint8Array
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let value = i
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[i] = value >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

async function deflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") return null
  try {
    const stream = new Blob([data as BlobPart]).stream().pipeThrough(
      new CompressionStream("deflate-raw")
    )
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

/** MS-DOS timestamp: seconds have 2s resolution and years start at 1980. */
function dosStamp(date: Date): { time: number; date: number } {
  return {
    time:
      (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f),
    date:
      ((Math.max(date.getFullYear(), 1980) - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  }
}

class ByteWriter {
  private chunks: Uint8Array[] = []
  length = 0

  bytes(data: Uint8Array) {
    this.chunks.push(data)
    this.length += data.length
  }

  u16(value: number) {
    this.bytes(new Uint8Array([value & 0xff, (value >>> 8) & 0xff]))
  }

  u32(value: number) {
    this.bytes(
      new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])
    )
  }

  toBlob(type: string) {
    return new Blob(this.chunks as BlobPart[], { type })
  }
}

export async function createZip(entries: ZipEntry[]): Promise<Blob> {
  const encoder = new TextEncoder()
  const stamp = dosStamp(new Date())

  const body = new ByteWriter()
  const central = new ByteWriter()

  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const compressed = await deflateRaw(entry.data)
    const payload = compressed ?? entry.data
    const method = compressed ? 8 : 0
    const checksum = crc32(entry.data)
    const offset = body.length

    // Local file header
    body.u32(0x04034b50)
    body.u16(20) // version needed
    body.u16(0x0800) // UTF-8 filenames
    body.u16(method)
    body.u16(stamp.time)
    body.u16(stamp.date)
    body.u32(checksum)
    body.u32(payload.length)
    body.u32(entry.data.length)
    body.u16(name.length)
    body.u16(0) // extra field length
    body.bytes(name)
    body.bytes(payload)

    // Matching central directory record
    central.u32(0x02014b50)
    central.u16(20) // version made by
    central.u16(20) // version needed
    central.u16(0x0800)
    central.u16(method)
    central.u16(stamp.time)
    central.u16(stamp.date)
    central.u32(checksum)
    central.u32(payload.length)
    central.u32(entry.data.length)
    central.u16(name.length)
    central.u16(0) // extra
    central.u16(0) // comment
    central.u16(0) // disk number
    central.u16(0) // internal attrs
    central.u32(0) // external attrs
    central.u32(offset)
    central.bytes(name)
  }

  const centralOffset = body.length
  const centralSize = central.length

  // End of central directory
  const end = new ByteWriter()
  end.u32(0x06054b50)
  end.u16(0) // this disk
  end.u16(0) // disk with central directory
  end.u16(entries.length)
  end.u16(entries.length)
  end.u32(centralSize)
  end.u32(centralOffset)
  end.u16(0) // comment length

  return new Blob(
    [body.toBlob("application/zip"), central.toBlob("application/zip"), end.toBlob("application/zip")],
    { type: "application/zip" }
  )
}
