// 定义 Turnstile siteverify API 的 URL
const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerificationResult {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  metadata?: {
    ephemeral_id?: string;
  };
}

/**
 * 验证 Cloudflare Turnstile 令牌。
 *
 * @param {string} token - Turnstile 客户端提供的响应令牌。
 * @param {string} ip - 访问者的 IP 地址。
 * @param {string} idempotencyKey - 用于幂等性的 UUID。
 * @returns {Promise<object>} 包含验证结果的 JSON 对象。
 */
export const verifyTurnstileToken = async (
  token: string,
  ip: string,
  idempotencyKey: string,
): Promise<TurnstileVerificationResult> => {
  // 构建请求体，使用 JSON 格式
  const body = JSON.stringify({
    secret: process.env.SECRET_KEY,
    response: token,
    remoteip: ip,
    idempotency_key: idempotencyKey,
  });

  try {
    const result = await fetch(url, {
      body: body,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return (await result.json()) as TurnstileVerificationResult;
  } catch (error) {
    console.error('Error during Turnstile verification:', error);
    throw new Error('Turnstile verification service is unavailable.');
  }
};
