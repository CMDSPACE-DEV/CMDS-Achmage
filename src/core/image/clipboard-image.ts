/**
 * Copies PNG/JPEG bytes to the system clipboard through Electron (desktop
 * only). Returns false when the Electron clipboard is unavailable (mobile) so
 * callers can fall back to a notice instead of failing the job (R-037).
 */
export function copyImageToClipboard(bytes: ArrayBuffer): boolean {
  const req = (globalThis as { require?: (id: string) => unknown }).require
  if (typeof req !== 'function') return false
  try {
    const electron = req('electron') as {
      clipboard?: { writeImage: (image: unknown) => void }
      nativeImage?: { createFromBuffer: (buffer: Uint8Array) => unknown }
    }
    if (!electron.clipboard || !electron.nativeImage) return false
    const BufferCtor = (
      globalThis as { Buffer?: { from: (b: Uint8Array) => Uint8Array } }
    ).Buffer
    const view = new Uint8Array(bytes)
    const image = electron.nativeImage.createFromBuffer(
      BufferCtor ? BufferCtor.from(view) : view,
    )
    electron.clipboard.writeImage(image)
    return true
  } catch {
    return false
  }
}
