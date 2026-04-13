const test = require("node:test");
const { RuleTester } = require("eslint");
const tsParser = require("@typescript-eslint/parser");
const rule = require("../rules/validate-file-input-accept");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

test("validate-file-input-accept supports readonly string constants in TypeScript", () => {
  ruleTester.run("validate-file-input-accept", rule, {
    valid: [
      {
        filename: "test.tsx",
        code: `export const AudioAttachmentMIMEType =
  'audio/mpeg, audio/wav, audio/aac, audio/ogg, audio/webm' as const;

<input type="file" accept={AudioAttachmentMIMEType} />;`,
      },
    ],
    invalid: [
      {
        filename: "test.tsx",
        code: `const audioAttachmentMIMEType = 'audio/mpeg, audio/wav';

<input type="file" accept={audioAttachmentMIMEType} />;`,
        errors: [
          {
            message:
              "File input accept value must be a static string so it can be validated.",
          },
        ],
      },
      {
        filename: "test.tsx",
        code: `let audioAttachmentMIMEType = 'audio/mpeg, audio/wav' as const;

<input type="file" accept={audioAttachmentMIMEType} />;`,
        errors: [
          {
            message:
              "File input accept value must be a static string so it can be validated.",
          },
        ],
      },
    ],
  });
});