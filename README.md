# eslint-plugin-better-mime

ESLint plugin for validating the `accept` prop on JSX `<input type="file" />` elements.

## Installation

```sh
npm install --save-dev eslint eslint-plugin-better-mime
```

## Rule

### `better-mime/validate-file-input-accept`

Checks statically analyzable `accept` values on `<input type="file" />` and validates them against `mime-types`.

Supported token forms:
- known MIME types like `image/png`
- known filename extensions like `.png`
- top-level wildcard forms like `application/*`, `audio/*`, `font/*`, `haptics/*`, `image/*`, `message/*`, `model/*`, `multipart/*`, `text/*`, and `video/*`

Supported static JSX forms:
- `accept="image/png, .png"`
- `accept={"image/png, .png"}`
- `accept={`image/png, .png`}`

Ignored cases:
- dynamic expressions such as `accept={fileTypes}`
- non-`file` inputs
- custom components like `<Input />`

The rule reports malformed, unknown, duplicate, and badly formatted tokens. When the change is unambiguous, it can auto-fix issues such as:
- trimming and normalizing spacing
- removing empty entries
- lowercasing canonical MIME and extension tokens
- removing duplicate tokens
- preferring direct extension tokens like `.ico` over platform-sensitive MIME aliases like `image/x-icon`

## Usage

### Flat config

```js
const betterMime = require("eslint-plugin-better-mime");

module.exports = [betterMime.configs["flat/recommended"]];
```

### Legacy config

```js
module.exports = {
  plugins: ["better-mime"],
  extends: ["plugin:better-mime/recommended"],
};
```

## Examples

Valid:

```jsx
<input type="file" accept="image/png, .jpg, image/*" />
```

Reported:

```jsx
<input type="file" accept="IMAGE/PNG,.PNG, image/png" />
<input type="file" accept="image/jpg" />
<input type="file" accept="png" />
```
