# eslint-plugin-better-mime

Standalone ESLint plugin providing the `validate-file-input-accept` rule.

## Install

```sh
npm install --save-dev eslint eslint-plugin-better-mime
```

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
    },
  },
];
```

## Usage (legacy config)

```js
module.exports = {
  plugins: ["better-mime"],
  extends: ["plugin:better-mime/recommended"],
};
```

## What the rule checks

The rule requires statically analyzable `accept` values on JSX `<input type="file" />` elements and validates their contents.

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

The rule can auto-fix safe cases such as:

- normalizing spacing
- removing empty entries
- lowercasing canonical MIME and extension tokens
- removing duplicate tokens
- preferring direct extension tokens like `.ico` over platform-sensitive MIME aliases like `image/x-icon`

## Examples

### Fails

```jsx
<input type="file" accept="IMAGE/PNG,.PNG, image/png" />
```

This reports non-canonical casing and the duplicate MIME token, and auto-fixes to `image/png, .png`.

```jsx
<input type="file" accept="image/x-icon" />
```

This reports the platform-sensitive MIME alias and auto-fixes to `.ico`.

```jsx
<input type="file" accept="example/*" />
```

This reports an invalid wildcard because `example/*` is not treated as a real upload MIME wildcard.

```jsx
<input type="file" accept={allowedTypes} />
```

This reports a non-static `accept` value because the rule cannot verify the runtime contents.

### Passes

```jsx
<input type="file" accept="image/png, .jpg, image/*" />
```

```jsx
<input type="file" accept="application/epub+zip, .epub, text/*" />
```
