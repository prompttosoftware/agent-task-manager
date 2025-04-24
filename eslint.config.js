// @ts-check

import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

// mimic CommonJS variables -- needed for FlatCompat
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FlatCompat helps bridge the gap with legacy config formats
const compat = new FlatCompat({
    baseDirectory: __dirname,
    resolvePluginsRelativeTo: __dirname
});

export default tseslint.config(
    // Global ignores
    {
        ignores: [
            "node_modules/",
            "dist/",            // Common build output directory
            "coverage/",        // Common code coverage directory
            "eslint.config.js", // Ignore the config file itself
            // Add other patterns like build artifacts, logs, etc.
            // "**/build/",
            // "*.log",
        ],
    },

    // Base JS configuration (apply common settings globally first)
    {
        // Apply language options to all relevant files initially
        // Specific configurations later can override parts if needed
        files: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest", // Use the latest ECMAScript features
            sourceType: "module",  // Use ES modules by default
            globals: {
                ...globals.node,   // Define Node.js global variables
                ...globals.es2021, // Define ES2021+ globals
                // Add any other global variables your project uses:
                // myGlobal: "readonly",
            }
        },
        // Optional: Configure settings shared across plugins (e.g., import resolver)
        // settings: {
        //     'import/resolver': {
        //         node: true,
        //         typescript: {}, // If using eslint-import-resolver-typescript
        //     },
        // }
    },

    // ESLint recommended rules (apply to all applicable files)
    js.configs.recommended,

    // StandardJS configuration using FlatCompat (for JavaScript files only)
    ...compat.extends("eslint-config-standard").map(config => ({
        ...config,
        files: ["**/*.{js,cjs,mjs}"], // IMPORTANT: Scope StandardJS rules to JS files
        // StandardJS might have rules (like no-unused-vars) that conflict
        // with how TypeScript handles things. Scoping it to JS avoids this.
    })),

    // TypeScript specific configurations
    // This block applies TypeScript parsing and rules specifically to TS/TSX files.
    {
        // Target TypeScript files explicitly
        files: ["**/*.{ts,cts,mts,tsx}"],
        // Apply the recommended TypeScript configurations.
        // This automatically includes:
        // - @typescript-eslint/parser: Sets the correct parser for TypeScript.
        // - @typescript-eslint/eslint-plugin: Adds TypeScript-specific rules.
        // - Recommended rules: Enables a curated set of rules for TS projects.
        ...tseslint.configs.recommended,
        // Optional: For rules requiring type information (more thorough checks)
        // Replace `tseslint.configs.recommended` above with this or add it:
        // ...tseslint.configs.recommendedTypeChecked,
        languageOptions: {
            // Ensure the parser is explicitly set for clarity, though `recommended` does this
            parser: tseslint.parser,
            parserOptions: {
                // project: true, // Uncomment to enable type-aware linting
                                 // Requires tsconfig.json to be found
                // tsconfigRootDir: import.meta.dirname, // Specify root if not project root
            },
        },
        // Optional: Override or disable specific TypeScript rules
        // rules: {
        //     "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
        //     "@typescript-eslint/no-explicit-any": "off", // Example: disable a rule
        // }
    },

    // Optional: Further override rules for specific file types (e.g., tests)
    // {
    //     files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"], // Target test files
    //     rules: {
    //         // Relax or change rules specific to tests
    //         // '@typescript-eslint/no-non-null-assertion': 'off', // Example
    //     },
    // },

    // Optional: Global rule overrides (apply last, affecting all matched files)
    // {
    //     rules: {
    //          // Globally override or disable specific rules if needed
    //          // This affects all files unless overridden by more specific configs
    //          // 'no-console': 'warn', // Example: allow console.warn/error but not .log
    //     }
    // }
);