/**
 * Browser and window utilities
 */

export function getBrowserInfo() {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  return {
    isChrome: ua.includes("Chrome"),
    isFirefox: ua.includes("Firefox"),
    isSafari: ua.includes("Safari"),
    isEdge: ua.includes("Edge"),
    isMobile: /Android|iPhone|iPad|iPod/i.test(ua),
    isIOS: /iPhone|iPad|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
    platform: navigator.platform,
  };
}

export function getViewportSize() {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function getScrollPosition() {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  return {
    x: window.scrollX,
    y: window.scrollY,
  };
}

export function scrollTo(position: { x?: number; y?: number; }, smooth = true) {
  if (typeof window === "undefined") return;
  window.scrollTo({
    left: position.x,
    top: position.y,
    behavior: smooth ? "smooth" : "auto",
  });
}

export function getElementPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    height: rect.height,
    width: rect.width,
  };
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  const result = document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve(result);
}

export function downloadFile(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export function openWindow(url: string, target = "_blank") {
  window.open(url, target, "noopener,noreferrer");
}

export function reload() {
  window.location.reload();
}

export function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getLanguage() {
  return navigator.language || "es-CO";
}