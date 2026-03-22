const validateFileInputAccept = require("./rules/validate-file-input-accept");
const packageJson = require("./package.json");

const plugin = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
  },
  rules: {
    "validate-file-input-accept": validateFileInputAccept,
  },
  configs: {},
};

plugin.configs.recommended = {
  plugins: ["better-mime"],
  rules: {
    "better-mime/validate-file-input-accept": "error",
  },
};

plugin.configs["flat/recommended"] = {
  name: "better-mime/flat/recommended",
  plugins: {
    "better-mime": plugin,
  },
  rules: {
    "better-mime/validate-file-input-accept": "error",
  },
};

module.exports = plugin;
