const test = require("node:test");
const { RuleTester } = require("eslint");
const rule = require("../rules/prefer-format-over-mime");

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

test("prefer-format-over-mime", () => {
  ruleTester.run("prefer-format-over-mime", rule, {
    valid: [
      '<input type="file" accept="image/png, .png" />',
      '<input type="file" accept=".ico" />',
      '<input type={"file"} accept={".rar"} />',
      '<input type={`file`} accept={`.ico, .png`} />',
      '<input type="file" accept={allowedTypes} />',
      '<input type="file" accept="image/jpg" />',
      '<input type="text" accept="image/x-icon" />',
      '<Input type="file" accept="image/x-icon" />',
    ],
    invalid: [
      {
        code: '<input type="file" accept="image/x-icon" />',
        output: '<input type="file" accept=".ico" />',
        errors: [
          {
            message:
              'Prefer extension tokens over MIME aliases: prefer extension token ".ico" over MIME token "image/x-icon" for broader platform compatibility.',
          },
        ],
      },
      {
        code: '<input type="file" accept="application/x-rar-compressed" />',
        output: '<input type="file" accept=".rar" />',
        errors: [
          {
            message:
              'Prefer extension tokens over MIME aliases: prefer extension token ".rar" over MIME token "application/x-rar-compressed" for broader platform compatibility.',
          },
        ],
      },
      {
        code: '<input type="file" accept="image/x-icon, .ico" />',
        output: '<input type="file" accept=".ico" />',
        errors: [
          {
            message:
              'Prefer extension tokens over MIME aliases: prefer extension token ".ico" over MIME token "image/x-icon" for broader platform compatibility.',
          },
        ],
      },
      {
        code: '<input type="file" accept={"IMAGE/X-ICON"} />',
        output: '<input type="file" accept={".ico"} />',
        errors: [
          {
            message:
              'Prefer extension tokens over MIME aliases: prefer extension token ".ico" over MIME token "IMAGE/X-ICON" for broader platform compatibility.',
          },
        ],
      },
      {
        code: '<input type="file" accept={`application/x-rar-compressed, .rar`} />',
        output: '<input type="file" accept={".rar"} />',
        errors: [
          {
            message:
              'Prefer extension tokens over MIME aliases: prefer extension token ".rar" over MIME token "application/x-rar-compressed" for broader platform compatibility.',
          },
        ],
      },
    ],
  });
});
