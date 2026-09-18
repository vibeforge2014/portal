// 激活码生成：15 随机字节 base64 恰好 20 字符（120bit 熵），'+'/'/' 替换为字母后按 5 位分组。
// 算法必须与 Supabase SQL generate_license_key()（chargepilot 仓库 202609160001 迁移）保持一致，
// 两条路径生成的码都由 macOS App 的同一激活入口消费。
export const LICENSE_KEY_PATTERN = /^CP-[A-Z0-9]{5}(-[A-Z0-9]{5}){3}$/;

export function generateLicenseKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const raw = btoa(binary).replace(/\+/g, "R").replace(/\//g, "x");
  return ["CP", raw.slice(0, 5), raw.slice(5, 10), raw.slice(10, 15), raw.slice(15, 20)].join("-").toUpperCase();
}
