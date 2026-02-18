// Vercel Edge Function — proxies TTS requests to ElevenLabs
// Streams mp3 audio back to browser. Protects API key server-side.

export const config = { runtime: 'edge' };

// Allowlisted voice IDs per character
const ALLOWED_VOICES: Record<string, string> = {
  miho: 'FGY2WhTYpPnrIDTdsKH5',      // Laura — Enthusiast, Quirky Attitude (young)
  sohee: 'cgSgspJ2msm6clMCkdW9',      // Jessica — Playful, Bright (young)
  sujin: 'BAdH0bMfq6VleQGLXj38',      // Tessa — Influencer Girl (young)
  hyunju: 'lcMyyd2HUfFzxdCaC4Ta',      // Lucy — Fresh & Casual (young)
  yuseongshin: 'N2lVS1w4EtoT3dr4eOWO', // Callum — Husky Trickster
};

const VOICE_ID_SET = new Set(Object.values(ALLOWED_VOICES));

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

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'TTS not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { text, voiceId, voiceSettings } = body as {
      text?: string;
      voiceId?: string;
      voiceSettings?: {
        stability?: number;
        similarity_boost?: number;
      };
    };

    if (!text || typeof text !== 'string' || text.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!voiceId || !VOICE_ID_SET.has(voiceId)) {
      return new Response(JSON.stringify({ error: 'Invalid voice ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cap text length to prevent abuse
    const cappedText = text.slice(0, 1000);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: cappedText,
          model_id: 'eleven_v3',
          voice_settings: {
            // v3 stability: continuous 0.0-1.0. Floor at 0.30 — below that voices
            // sound old/raspy. DO NOT snap to [0.0, 0.5, 1.0] — that kills our
            // carefully tuned emotional curves in ttsService.ts.
            stability: Math.max(0.30, Math.min(1, voiceSettings?.stability ?? 0.5)),
            similarity_boost: Math.max(0, Math.min(1, voiceSettings?.similarity_boost ?? 0.8)),
          },
        }),
      }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'TTS upstream error', status: response.status }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Stream the audio back
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'TTS proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
