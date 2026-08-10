import next from "@next/eslint-plugin-next";

import base from "./base.mjs";

/**
 * The app baseline: everything in `base`, plus Next's own checks.
 *
 * `core-web-vitals` is the set worth having — it catches the things that
 * silently cost real users (an `<img>` where `next/image` belongs, a sync script
 * blocking hydration) rather than restating stylistic preferences Prettier
 * already settles.
 */
export default [
  ...base,
  {
    plugins: { "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },
];
