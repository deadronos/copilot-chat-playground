export function trySendBeacon(url: string, data: BodyInit): boolean {
  const nav: Navigator | null = typeof navigator !== "undefined" ? (navigator as unknown as Navigator) : null
  if (!nav || typeof (nav as unknown as { sendBeacon?: unknown }).sendBeacon !== "function") return false

  try {
    const sb = (nav as unknown as { sendBeacon: (u: string, d: BodyInit) => boolean }).sendBeacon
    return !!sb.call(nav, url, data)
  } catch {
    return false
  }
}
