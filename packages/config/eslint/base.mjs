import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

/**
 * The shared lint baseline for every workspace package.
 *
 * Kept deliberately small. A rule set nobody agrees with gets disabled file by
 * file until the whole thing is noise, so this covers the errors that are
 * actually bugs — unused code, promises nobody awaited, `any` creeping back in —
 * and leaves style to Prettier, which already runs.
 *
 * There was no ESLint in this workspace at all before 2026-08-10, while the root
 * `package.json` carried a `lint` script that ran `turbo run lint` and found no
 * package defining one. It passed, always, having checked nothing.
 */
export default tseslint.config(
  {
    // Build output and dependencies. Listed first: flat config applies ignores
    // globally only when they are the sole key in the object.
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Rules-of-hooks and the exhaustive-deps warning. Included because the
    // codebase already carries `eslint-disable react-hooks/...` comments written
    // against a linter that was never actually running — without the plugin,
    // those comments name an unknown rule and ESLint errors on them, which is a
    // fair summary of how much lint coverage there was.
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Unused values are usually a half-finished edit. Underscore-prefixed
      // names stay allowed so a deliberately-ignored parameter can say so.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // `any` is sometimes the honest answer at a boundary we do not own, so
      // this warns rather than blocks — but it stays visible instead of silently
      // spreading through a file.
      "@typescript-eslint/no-explicit-any": "warn",

      // A floating promise in a React handler is a request nobody is waiting
      // for and an error nobody will see. Off by default in the recommended
      // set because it needs type information; enabled where we have it.
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
);
