// Vercel Serverless Function — proxies AI requests to Anthropic
// Deploy on Vercel and set ANTHROPIC_API_KEY as an environment variable

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();

    // Only allow specific model to prevent abuse
    const allowedModels = ['claude-3-haiku-20240307', 'claude-3-5-haiku-20241022'];
    if (!allowedModels.includes(body.model)) {
      return new Response(JSON.stringify({ error: 'Model not allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cap max_tokens to prevent abuse
    body.max_tokens = Math.min(body.max_tokens || 800, 1000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
