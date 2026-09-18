import "server-only";

//
// 阿里云邮件推送（DirectMail）SingleSendMail 客户端。
// RPC V1 签名（HMAC-SHA1），仅依赖 WebCrypto（Node 22 全局可用）。
// 与 chargepilot 仓库 site/supabase/functions/_shared/directmail.ts 保持同一实现，
// 修改签名参数时两处同步。发信地址等凭据来自服务器环境变量，不进 Git。
//
// 环境变量：DIRECTMAIL_ACCESS_KEY_ID / DIRECTMAIL_ACCESS_KEY_SECRET /
//   DIRECTMAIL_ACCOUNT_NAME（控制台创建的发信地址）/ DIRECTMAIL_FROM_ALIAS（可选）
//

const ENDPOINT = "https://dm.aliyuncs.com/";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export class DirectMailError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

/// RFC3986 百分号编码：encodeURIComponent 基础上补编码 ! ' ( ) *
function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

async function hmacSha1Base64(key: string, content: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(content));
  let binary = "";
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function sendDirectMail(message: MailMessage): Promise<void> {
  const parameters = new Map<string, string>([
    ["AccessKeyId", required("DIRECTMAIL_ACCESS_KEY_ID")],
    ["AccountName", required("DIRECTMAIL_ACCOUNT_NAME")],
    ["Action", "SingleSendMail"],
    ["AddressType", "1"],
    ["Format", "JSON"],
    // 发件人显示名统一用 ZenSoft（邮件通道是多产品共用的），产品身份放在邮件主题里
    ["FromAlias", process.env.DIRECTMAIL_FROM_ALIAS || "ZenSoft"],
    ["HtmlBody", message.html],
    ["ReplyToAddress", "true"],
    ["SignatureMethod", "HMAC-SHA1"],
    ["SignatureNonce", crypto.randomUUID()],
    ["SignatureVersion", "1.0"],
    ["Subject", message.subject],
    ["Timestamp", new Date().toISOString().replace(/\.\d+Z$/, "Z")],
    ["ToAddress", message.to],
    ["Version", "2015-11-23"]
  ]);

  // RPC V1：参数名升序 percentEncode 拼接 → POST&%2F&<encoded canonical>，HMAC-SHA1 签名
  const canonical = Array.from(parameters.entries())
    .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
    .sort()
    .join("&");
  const stringToSign = `POST&${percentEncode("/")}&${percentEncode(canonical)}`;
  const signature = await hmacSha1Base64(`${required("DIRECTMAIL_ACCESS_KEY_SECRET")}&`, stringToSign);

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: `${canonical}&${percentEncode("Signature")}=${percentEncode(signature)}`
  });
  if (!response.ok) {
    const text = await response.text();
    let code = `HTTP_${response.status}`;
    try {
      const payload = JSON.parse(text);
      if (typeof payload.Code === "string") code = payload.Code;
    } catch {
      // 保留 HTTP 状态码作为错误码
    }
    throw new DirectMailError(code, `DirectMail 发送失败（${code}）`);
  }
}
