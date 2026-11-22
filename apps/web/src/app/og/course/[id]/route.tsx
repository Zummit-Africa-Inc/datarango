import { ImageResponse } from "next/og";

import { ACCENT_HEX, accentFromKey, hashString } from "@datarango/ui/accents";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SIZES = {
  og: { width: 1200, height: 630 },
  cover: { width: 1800, height: 600 },
} as const;

// Lucide "book-open", drawn inline: next/og renders plain elements only.
const BOOK_OPEN = [
  "M12 7v14",
  "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
];

const SPARKLE = "M50 0C53 30 70 47 100 50C70 53 53 70 50 100C47 70 30 53 0 50C30 47 47 30 50 0Z";

/**
 * The generated course cover (§6.3) as a PNG, for OG/meta tags and email.
 * Seeded by the course id only: the catalogue needs a session, and the
 * fallback design carries no text, so nothing here depends on course data.
 * `?variant=cover` gives the 3:1 cover size instead of the 1.91:1 OG card.
 */
export const GET = (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  params.then(({ id }) => {
    if (!UUID.test(id)) return new Response("Not found", { status: 404 });

    const variant = new URL(request.url).searchParams.get("variant") === "cover" ? "cover" : "og";
    const { width, height } = SIZES[variant];
    const colours = ACCENT_HEX[accentFromKey(id)];
    const seed = hashString(id);
    const big = height * 0.9;
    const small = height * 0.45;
    const tile = height * 0.28;

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(90deg, ${colours.soft}, ${colours.tile})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: big,
            height: big,
            top: -big * 0.35,
            right: width * 0.04,
            borderRadius: "9999px",
            background: colours.shape,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: small,
            height: small,
            bottom: -small * 0.4,
            right: width * 0.32,
            borderRadius: seed % 2 === 0 ? "9999px" : `${small / 2}px ${small / 2}px 0 0`,
            border: `${small * 0.14}px solid ${colours.shape}`,
          }}
        />
        <svg
          width={height * 0.12}
          height={height * 0.12}
          viewBox="0 0 100 100"
          style={{ position: "absolute", top: height * 0.18, left: width * 0.42 }}
        >
          <path d={SPARKLE} fill={colours.solid} />
        </svg>
        <div
          style={{
            position: "absolute",
            left: height * 0.12,
            bottom: height * 0.12,
            width: tile,
            height: tile,
            borderRadius: tile * 0.25,
            background: colours.solid,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={tile * 0.5}
            height={tile * 0.5}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {BOOK_OPEN.map((d) => (
              <path key={d} d={d} />
            ))}
          </svg>
        </div>
      </div>,
      {
        width,
        height,
        // Same id → same image, forever.
        headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      },
    );
  });
