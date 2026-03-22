const test = require("node:test");
const { RuleTester } = require("eslint");
const rule = require("../rules/validate-file-input-accept");

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

test("validate-file-input-accept", () => {
  ruleTester.run("validate-file-input-accept", rule, {
    valid: [
      '<input type="file" accept="image/png" />',
      '<input type="file" accept=".png, image/jpeg, image/*" />',
      '<input type="file" accept="application/*, audio/*, font/*, haptics/*, image/*, message/*, model/*, multipart/*, text/*, video/*" />',
      '<input type={"file"} accept={"image/png, .png"} />',
      '<input type={`file`} accept={`image/png, .png`} />',
      '<input type="file" accept="application/atom+xml, .atom" />',
      '<input type="file" accept="application/epub+zip, .epub" />',
      '<input type="file" accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document, .docx" />',
      '<input type="file" accept="font/woff2, .woff2, image/avif, .avif" />',
      '<input type="file" accept="image/vnd.microsoft.icon, .ico" />',
      '<input type="file" accept="image/svg+xml, .svgz, application/vnd.apple.mpegurl, .m3u8" />',
      '<input type="file" accept="video/webm, .webm, video/3gpp, .3gp" />',
      '<input type="text" accept="image/png" />',
      '<Input type="file" accept="image/png" />',
      '<input type="file" accept={allowedTypes} />',
    ],
    invalid: [
      {
        code: '<input type="file" accept="image/jpg" />',
        errors: [
          {
            message:
              'Invalid file input accept value: "image/jpg" is not a known MIME type.',
          },
        ],
      },
      {
        code: '<input type="file" accept="png" />',
        errors: [
          {
            message:
              'Invalid file input accept value: "png" is not a valid accept token.',
          },
        ],
      },
      {
        code: '<input type="file" accept="image/png," />',
        output: '<input type="file" accept="image/png" />',
        errors: [
          {
            message:
              'Invalid file input accept value: remove empty accept entries.',
          },
        ],
      },
      {
        code: '<input type="file" accept="IMAGE/PNG,.PNG, image/png" />',
        output: '<input type="file" accept="image/png, .png" />',
        errors: [
          {
            message:
              'Invalid file input accept value: use canonical token "image/png" instead of "IMAGE/PNG"; use canonical token ".png" instead of ".PNG"; remove duplicate token "image/png".',
          },
        ],
      },
      {
        code: '<input type="file" accept="chemical/*" />',
        errors: [
          {
            message:
              'Invalid file input accept value: "chemical/*" is not a supported top-level media wildcard.',
          },
        ],
      },
      {
        code: '<input type="file" accept="example/*" />',
        errors: [
          {
            message:
              'Invalid file input accept value: "example/*" is not a supported top-level media wildcard.',
          },
        ],
      },
      {
        code: '<input type="file" accept="*/example" />',
        errors: [
          {
            message:
              'Invalid file input accept value: "*/example" is not a supported top-level media wildcard.',
          },
        ],
      },
      {
        code: '<input type="file" accept="TEXT/*" />',
        output: '<input type="file" accept="text/*" />',
        errors: [
          {
            message:
              'Invalid file input accept value: use canonical token "text/*" instead of "TEXT/*".',
          },
        ],
      },
      {
        code: '<input type="file" accept="application/alto-costmap+json" />',
        errors: [
          {
            message:
              'Invalid file input accept value: "application/alto-costmap+json" is not a known MIME type.',
          },
        ],
      },
      {
        code: '<input type="file" accept="image/x-icon" />',
        output: '<input type="file" accept=".ico" />',
        errors: [
          {
            message:
              'Invalid file input accept value: prefer extension token ".ico" over MIME token "image/x-icon" for broader platform compatibility.',
          },
        ],
      },
      {
        code: '<input type="file" accept="application/x-rar-compressed" />',
        output: '<input type="file" accept=".rar" />',
        errors: [
          {
            message:
              'Invalid file input accept value: prefer extension token ".rar" over MIME token "application/x-rar-compressed" for broader platform compatibility.',
          },
        ],
      },
      {
        code: '<input type="file" accept="image/x-icon, .ico" />',
        output: '<input type="file" accept=".ico" />',
        errors: [
          {
            message:
              'Invalid file input accept value: prefer extension token ".ico" over MIME token "image/x-icon" for broader platform compatibility; remove duplicate token ".ico".',
          },
        ],
      },
      {
        code: '<input type="file" accept="image/png,.png" />',
        output: '<input type="file" accept="image/png, .png" />',
        errors: [
          {
            message:
              'Invalid file input accept value: normalize spacing between accept tokens.',
          },
        ],
      },
      {
        code: '<input type={"file"} accept={"image/png,"} />',
        output: '<input type={"file"} accept={"image/png"} />',
        errors: [
          {
            message:
              'Invalid file input accept value: remove empty accept entries.',
          },
        ],
      },
      {
        code: '<input type="file" accept={`IMAGE/PNG,.PNG, image/png`} />',
        output: '<input type="file" accept={"image/png, .png"} />',
        errors: [
          {
            message:
              'Invalid file input accept value: use canonical token "image/png" instead of "IMAGE/PNG"; use canonical token ".png" instead of ".PNG"; remove duplicate token "image/png".',
          },
        ],
      },
    ],
  });
});
