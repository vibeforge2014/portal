// trailingSlash: true 时，无斜杠的 /api/media/<id> 会被 308 重定向到带斜杠
// 地址，白付一整轮网络往返——所有媒体引用统一从这里生成，禁止手拼。
// width 交给 /api/media 路由用 sharp 缩放转 WebP（SVG/GIF 原样返回）。
export function mediaUrl(id: string, width?: number): string {
  const base = `/api/media/${encodeURIComponent(id)}/`;
  return width ? `${base}?w=${width}` : base;
}
