/**
 * Google Vertex AI access for Supabase edge functions.
 *
 * Vertex authenticates with a service account rather than an API key, and the
 * usual Node path to that (google-auth-library / Application Default
 * Credentials) does not exist in Deno: there is no gcloud, no ADC file, no
 * filesystem to read a key from. So the OAuth2 token is minted here directly —
 * sign a JWT assertion with Web Crypto, exchange it for an access token.
 *
 * Required secrets:
 *   GCP_SERVICE_ACCOUNT_JSON  the full service-account key document
 *   GCP_PROJECT_ID            optional; defaults to project_id in the document
 *   GCP_LOCATION              optional; defaults to us-central1
 */

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform'

/**
 * The two models this app runs on. Named rather than inlined so moving a
 * function between tiers is a one-identifier change at the call site.
 *
 * MODEL_MAIN  candidate work — resume extraction and match scoring, where the
 *             accuracy of everything downstream is set.
 * MODEL_LITE  job-description reformatting and extraction: structured, lower
 *             stakes, and cheap for a user to re-run.
 */
export const MODEL_MAIN = 'gemini-3.6-flash'
export const MODEL_LITE = 'gemini-3.5-flash-lite'

// Refresh this far before the token actually expires, so a request that starts
// just under the wire doesn't arrive at Vertex with a dead token.
const EXPIRY_SKEW_SECONDS = 60

interface ServiceAccount {
  client_email: string
  private_key: string
  project_id?: string
}

let cachedAccount: ServiceAccount | null = null

function serviceAccount(): ServiceAccount {
  if (cachedAccount) return cachedAccount

  const raw = Deno.env.get('GCP_SERVICE_ACCOUNT_JSON')
  if (!raw) {
    throw new Error(
      'GCP_SERVICE_ACCOUNT_JSON is not set. Add the service-account key document ' +
        'with: supabase secrets set GCP_SERVICE_ACCOUNT_JSON="$(cat key.json)"'
    )
  }

  let parsed: ServiceAccount
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('GCP_SERVICE_ACCOUNT_JSON is not valid JSON')
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      'GCP_SERVICE_ACCOUNT_JSON is missing client_email or private_key'
    )
  }

  // Secret managers frequently store the document with the newlines in
  // private_key escaped a second time; unescape so the PEM parses.
  parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')

  cachedAccount = parsed
  return parsed
}

export function vertexProject(): string {
  const project = Deno.env.get('GCP_PROJECT_ID') || serviceAccount().project_id
  if (!project) {
    throw new Error(
      'No GCP project. Set GCP_PROJECT_ID, or use a service-account document ' +
        'that carries project_id.'
    )
  }
  return project
}

/**
 * Defaults to "global" because that is where the models this app runs on are
 * actually served: gemini-3.6-flash and gemini-3.5-flash-lite both 404 in
 * us-central1. Override only if a newer region starts carrying them.
 */
export function vertexLocation(): string {
  return Deno.env.get('GCP_LOCATION') || 'global'
}

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlJson(value: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(value)))
}

/** PEM (PKCS#8) text to the raw DER bytes crypto.subtle.importKey wants. */
function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '')
  const binary = atob(body)
  const der = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(der)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return der
}

let cachedToken: { value: string; expiresAt: number } | null = null

/**
 * A cloud-platform access token for the service account.
 *
 * Cached at module scope: an edge function instance serves many requests, and
 * a token is good for an hour, so re-minting per request would add a second
 * round trip to every call for nothing.
 */
export async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt - EXPIRY_SKEW_SECONDS > now) {
    return cachedToken.value
  }

  const account = serviceAccount()
  const claims = {
    iss: account.client_email,
    scope: SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  }

  const unsigned = `${base64urlJson({ alg: 'RS256', typ: 'JWT' })}.${base64urlJson(claims)}`
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned)
  )
  const assertion = `${unsigned}.${base64url(new Uint8Array(signature))}`

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `Vertex token exchange failed (${response.status}): ${detail}`
    )
  }

  const token = await response.json()
  if (!token.access_token) {
    throw new Error('Vertex token exchange returned no access_token')
  }

  cachedToken = {
    value: token.access_token,
    expiresAt: now + (token.expires_in ?? 3600),
  }
  return cachedToken.value
}

export interface VertexPart {
  text?: string
  inline_data?: { mime_type: string; data: string }
}

export interface VertexRequest {
  model: string
  contents: Array<{ role?: string; parts: VertexPart[] }>
  generationConfig?: Record<string, unknown>
  systemInstruction?: { parts: VertexPart[] }
  safetySettings?: Array<{ category: string; threshold: string }>
}

function endpoint(model: string): string {
  const location = vertexLocation()
  // The multi-region "global" endpoint is not host-prefixed the way the
  // regional ones are.
  const host =
    location === 'global'
      ? 'https://aiplatform.googleapis.com'
      : `https://${location}-aiplatform.googleapis.com`
  return (
    `${host}/v1/projects/${vertexProject()}/locations/${location}` +
    `/publishers/google/models/${model}:generateContent`
  )
}

/** Raw generateContent call. Throws on a non-2xx response. */
export async function generateContent(
  request: VertexRequest
): Promise<any> {
  const { model, contents, ...rest } = request
  // Vertex rejects a content entry with no role ("Please use a valid role:
  // user, model"), where the Gemini Developer API quietly defaulted it to
  // user. Defaulted here so no call site has to remember.
  const body = {
    ...rest,
    contents: contents.map((entry) => ({ ...entry, role: entry.role ?? 'user' })),
  }
  const response = await fetch(endpoint(model), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('Vertex AI error:', detail)
    throw new Error(`Vertex AI error: ${response.status}`)
  }

  return await response.json()
}

/**
 * generateContent, reduced to the generated text.
 *
 * An empty response is thrown rather than returned: it almost always means a
 * safety block or a MAX_TOKENS finish, and surfacing that reason beats a caller
 * downstream failing to parse "" as JSON.
 */
export async function generateText(request: VertexRequest): Promise<string> {
  const data = await generateContent(request)

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (text) return text

  const blockReason = data.promptFeedback?.blockReason
  const finishReason = data.candidates?.[0]?.finishReason
  const detail = blockReason
    ? `prompt blocked: ${blockReason}`
    : finishReason
      ? `no text (finishReason: ${finishReason})`
      : 'empty response'
  throw new Error(`Vertex/${request.model}: ${detail}`)
}
