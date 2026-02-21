export async function resizeImage(
  srcUrl: string,
  width: number,
  quality: number = 0.7
): Promise<string> {
  // fetch image and draw onto canvas sized to given width
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = srcUrl;

  await img.decode();

  const scale = width / img.width;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  // return webp data url (most efficient) or fallback to png
  return canvas.toDataURL('image/webp', quality);
}
