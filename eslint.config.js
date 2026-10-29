const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  globalIgnores(["vendor/**"]),
  expoConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["dist/*", "www/**"],
  },
]);
