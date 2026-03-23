const test = require("node:test");
const assert = require("node:assert/strict");
const plugin = require("../index.js");

test("plugin exports rule and configs", () => {
  assert.equal(typeof plugin, "object");
  assert.equal(typeof plugin.rules["prefer-format-over-mime"], "object");
  assert.equal(typeof plugin.rules["validate-file-input-accept"], "object");
  assert.equal(
    plugin.configs.recommended.rules["better-mime/validate-file-input-accept"],
    "error",
  );
  assert.equal(
    plugin.configs.recommended.rules["better-mime/prefer-format-over-mime"],
    undefined,
  );
  assert.equal(
    plugin.configs["flat/recommended"].rules["better-mime/validate-file-input-accept"],
    "error",
  );
  assert.equal(
    plugin.configs["flat/recommended"].rules["better-mime/prefer-format-over-mime"],
    undefined,
  );
});
