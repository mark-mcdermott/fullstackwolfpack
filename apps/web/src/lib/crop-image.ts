// Cover-crop an arbitrary image to an exact target size (the poster's 2:3),
// scaling to FILL the frame — enlarging if the source is smaller — and
// center-cropping the overflow. Returns a JPEG blob. Client-only (uses canvas).

export const COVER_WIDTH = 480
export const COVER_HEIGHT = 720 // 2:3, matching the poster tile

export async function coverCropToBlob(
  file: File,
  targetW = COVER_WIDTH,
  targetH = COVER_HEIGHT,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is unavailable.')

    // "cover": the larger scale factor fills the frame; center the overflow.
    const scale = Math.max(targetW / bitmap.width, targetH / bitmap.height)
    const drawW = bitmap.width * scale
    const drawH = bitmap.height * scale
    ctx.drawImage(
      bitmap,
      (targetW - drawW) / 2,
      (targetH - drawH) / 2,
      drawW,
      drawH,
    )

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Encode failed.'))),
        'image/jpeg',
        0.85,
      )
    })
  } finally {
    bitmap.close?.()
  }
}
