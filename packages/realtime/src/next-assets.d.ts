/**
 * `@datarango/ui` imports images (logo, illustrations) directly. Inside an app
 * those modules are declared by Next's generated `next-env.d.ts`; a library that
 * consumes `ui` gets no such file, so typechecking this package fails on `ui`'s
 * own imports rather than on anything here.
 *
 * Referencing Next's shipped declarations rather than re-declaring `*.png` and
 * friends by hand keeps this correct if Next changes what a static import
 * resolves to.
 */
/// <reference types="next/image-types/global" />
