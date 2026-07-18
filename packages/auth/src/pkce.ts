const base64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/**
 * Generates an OAuth PKCE verifier/challenge pair (S256). WebCrypto only —
 * safe in browsers, Node and edge runtimes.
 *
 * @returns The verifier (kept in an httpOnly cookie) and its S256 challenge.
 * @example const { verifier, challenge } = await createPkcePair();
 */
export const createPkcePair = async (): Promise<{ verifier: string; challenge: string }> => {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
};

/** Random URL-safe state parameter for the authorization request. */
export const randomState = (): string => base64url(crypto.getRandomValues(new Uint8Array(16)));
