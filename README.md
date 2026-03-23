# eslint-plugin-better-mime

Standalone ESLint plugin providing focused rules for JSX file-input `accept` values.

## Install

```sh
npm install --save-dev eslint eslint-plugin-better-mime
```

The package ships bundled TypeScript declarations for the plugin export.

## Rules

- [`validate-file-input-accept`](./rules/validate-file-input-accept.md) validates static `accept` values, rejects malformed tokens, and normalizes canonical formatting.
- [`prefer-format-over-mime`](./rules/prefer-format-over-mime.md) prefers extension tokens such as `.ico` over less portable MIME aliases such as `image/x-icon`.

## Usage (flat config)

```js
const betterMime = require("eslint-plugin-better-mime");

module.exports = [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "better-mime": betterMime,
    },
    rules: {
      "better-mime/validate-file-input-accept": "error",
      "better-mime/prefer-format-over-mime": "warn",
    },
  },
];
```

If you only want the recommended validation rule, use `better-mime/validate-file-input-accept` alone or extend the plugin's recommended config.

## Usage (legacy config)

```js
module.exports = {
  plugins: ["better-mime"],
  extends: ["plugin:better-mime/recommended"],
  rules: {
    "better-mime/prefer-format-over-mime": "warn",
  },
};
```

## What the rules check

`validate-file-input-accept` requires statically analyzable `accept` values on JSX `<input type="file" />` elements and validates their contents.

Supported token forms:

- known MIME types like `image/png`
- known filename extensions like `.png`
- top-level wildcard forms like `application/*`, `audio/*`, `font/*`, `haptics/*`, `image/*`, `message/*`, `model/*`, `multipart/*`, `text/*`, and `video/*`

Supported static JSX forms:

- `accept="image/png, .png"`
- `accept={"image/png, .png"}`
- `accept={`image/png, .png`}`

Rejected cases:

- dynamic expressions such as `accept={fileTypes}`
- values coming from variables typed too broadly to inspect, such as `string`, `unknown`, or `any`

Still ignored cases:

- non-`file` inputs
- custom components like `<Input />`

`validate-file-input-accept` can auto-fix safe cases such as:

- normalizing spacing
- removing empty entries
- lowercasing canonical MIME and extension tokens
- removing duplicate tokens

`prefer-format-over-mime` can auto-fix platform-sensitive MIME aliases such as:

- `image/x-icon` -> `.ico`
- `application/x-rar-compressed` -> `.rar`

## Examples

### `validate-file-input-accept` fails

```jsx
// ❌
<input type="file" accept="IMAGE/PNG,.PNG, image/png" />

// ✅
<input type="file" accept="image/png, .png" />
```

This reports non-canonical casing and the duplicate MIME token.

```jsx
<input type="file" accept="example/*" />
```

This reports an invalid wildcard because `example/*` is not treated as a real upload MIME wildcard.

```jsx
<input type="file" accept={allowedTypes} />
```

This reports a non-static `accept` value because the rule cannot verify the runtime contents.

### `prefer-format-over-mime` fails

```jsx
// ❌
<input type="file" accept="image/x-icon" />

// ✅
<input type="file" accept=".ico" />
```

This reports the platform-sensitive MIME alias.

### Passes

```jsx
// ✅
<input type="file" accept="image/png, .jpg, image/*" />
```

```jsx
// ✅
<input type="file" accept="application/epub+zip, .epub, text/*" />
```

```jsx
// ✅
<input type="file" accept=".ico, .png" />
```
