declare module "*.png" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.svg" {
  const src: import("next/image").StaticImageData;
  export default src;
}
