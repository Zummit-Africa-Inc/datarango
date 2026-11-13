// Static image imports, typed the way next/image's loader resolves them.
//
// Next.js declares these in each app's generated next-env.d.ts, but that file
// is gitignored and only exists after `next dev` / `next build` has run once.
// In a fresh checkout (CI runs `pnpm -r typecheck` before any build) the apps
// typecheck this package's source without it, so the package declares the
// formats it imports itself, and every app's tsconfig includes this file.

declare module "*.png" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.avif" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.jpg" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.webp" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.svg" {
  const src: import("next/image").StaticImageData;
  export default src;
}
