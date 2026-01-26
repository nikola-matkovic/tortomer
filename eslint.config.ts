import { globalIgnores } from "eslint/config";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import skipFormatting from "eslint-config-prettier/flat";

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{vue,ts,mts,tsx}"],
    rules: {
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "warn",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      camelcase: ["warn", { properties: "always" }],

      "array-element-newline": ["warn", "always"],
      "object-curly-newline": [
        "warn",
        {
          multiline: true,
          consistent: true,
        },
      ],
      "comma-dangle": ["warn", "always-multiline"],

      "vue/html-indent": ["error", 2],
      "vue/max-attributes-per-line": [
        "warn",
        {
          singleline: 1,
          multiline: 1,
        },
      ],
      "vue/singleline-html-element-content-newline": ["warn"],
      "vue/multiline-html-element-content-newline": ["warn"],
      "vue/name-property-casing": ["error", "PascalCase"],
      "vue/require-default-prop": "off",
      "vue/require-prop-types": "off",
      "vue/array-bracket-newline": ["warn", { multiline: true }],

      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "id-length": ["warn", { min: 2, exceptions: ["i", "j"] }],
      "max-len": [
        "warn",
        { code: 80, ignoreStrings: true, ignoreTemplateLiterals: true },
      ],
    },
  },

  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

  ...pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,

  skipFormatting,
);
