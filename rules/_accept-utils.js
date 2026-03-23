const mime = require("mime-types");

const VALID_WILDCARDS = new Set([
  "application/*",
  "audio/*",
  "font/*",
  "haptics/*",
  "image/*",
  "message/*",
  "model/*",
  "multipart/*",
  "text/*",
  "video/*",
]);

const MIME_TYPE_PATTERN = /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/;
const WILDCARD_PATTERN = /^([A-Za-z0-9!#$&^_.+-]+)\/\*$/;

const VALIDATE_FILE_INPUT_ACCEPT_ISSUE_KINDS = new Set([
  "canonical",
  "duplicate",
  "empty",
  "formatting",
  "invalid-extension",
  "invalid-mime",
  "invalid-token",
  "invalid-wildcard",
]);

const PREFER_FORMAT_OVER_MIME_ISSUE_KINDS = new Set(["prefer-extension"]);

function isInputElement(node) {
  return node.name && node.name.type === "JSXIdentifier" && node.name.name === "input";
}

function getAttribute(node, name) {
  return node.attributes.find(
    (attribute) =>
      attribute.type === "JSXAttribute" &&
      attribute.name &&
      attribute.name.type === "JSXIdentifier" &&
      attribute.name.name === name,
  );
}

function getStaticStringValue(attribute) {
  if (!attribute || !attribute.value) {
    return null;
  }

  if (attribute.value.type === "Literal" && typeof attribute.value.value === "string") {
    return {
      value: attribute.value.value,
      valueNode: attribute.value,
      canFix: true,
    };
  }

  if (attribute.value.type !== "JSXExpressionContainer") {
    return null;
  }

  const { expression } = attribute.value;

  if (expression.type === "Literal" && typeof expression.value === "string") {
    return {
      value: expression.value,
      valueNode: attribute.value,
      canFix: true,
    };
  }

  if (expression.type === "TemplateLiteral" && expression.expressions.length === 0) {
    return {
      value: expression.quasis[0].value.cooked ?? expression.quasis[0].value.raw,
      valueNode: attribute.value,
      canFix: true,
    };
  }

  return null;
}

function getAcceptLintTarget(node) {
  if (!isInputElement(node)) {
    return null;
  }

  const typeAttribute = getAttribute(node, "type");
  const typeValue = getStaticStringValue(typeAttribute);
  if (!typeValue || typeValue.value.toLowerCase() !== "file") {
    return null;
  }

  const acceptAttribute = getAttribute(node, "accept");

  return {
    acceptAttribute,
    acceptValue: getStaticStringValue(acceptAttribute),
  };
}

function getPreferredExtensionToken(normalizedMimeType) {
  const extension = mime.extension(normalizedMimeType);
  if (!extension) {
    return null;
  }

  const extensionToken = `.${extension}`;
  const extensionMimeType = mime.lookup(extensionToken);
  if (
    extensionMimeType &&
    extensionMimeType.toLowerCase() !== normalizedMimeType
  ) {
    return extensionToken;
  }

  return null;
}

function classifyToken(token) {
  const normalizedToken = token.toLowerCase();

  if (token.startsWith(".")) {
    if (mime.lookup(normalizedToken)) {
      return {
        kind: "extension",
        canonical: normalizedToken,
      };
    }

    return { kind: "invalid-extension" };
  }

  const wildcardMatch = WILDCARD_PATTERN.exec(token);
  if (wildcardMatch) {
    if (VALID_WILDCARDS.has(normalizedToken)) {
      return {
        kind: "wildcard",
        canonical: normalizedToken,
      };
    }

    return { kind: "invalid-wildcard" };
  }

  if (token.includes("*")) {
    return { kind: "invalid-wildcard" };
  }

  if (MIME_TYPE_PATTERN.test(token)) {
    if (mime.extension(normalizedToken)) {
      return {
        kind: "mime",
        canonical: normalizedToken,
        preferExtension: getPreferredExtensionToken(normalizedToken),
      };
    }

    return { kind: "invalid-mime" };
  }

  return { kind: "invalid-token" };
}

function describeIssue(issue) {
  switch (issue.kind) {
    case "canonical":
      return `use canonical token "${issue.to}" instead of "${issue.from}"`;
    case "duplicate":
      return `remove duplicate token "${issue.token}"`;
    case "empty":
      return "remove empty accept entries";
    case "formatting":
      return "normalize spacing between accept tokens";
    case "invalid-extension":
      return `"${issue.token}" is not a known file extension`;
    case "invalid-mime":
      return `"${issue.token}" is not a known MIME type`;
    case "invalid-token":
      return `"${issue.token}" is not a valid accept token`;
    case "invalid-wildcard":
      return `"${issue.token}" is not a supported top-level media wildcard`;
    case "prefer-extension":
      return `prefer extension token "${issue.to}" over MIME token "${issue.from}" for broader platform compatibility`;
    default:
      return issue.kind;
  }
}

function analyzeAcceptValue(
  value,
  {
    preferExtension = false,
    reportedIssueKinds = VALIDATE_FILE_INPUT_ACCEPT_ISSUE_KINDS,
  } = {},
) {
  const issues = [];
  const normalizedTokens = [];
  const seenTokens = new Set();
  let hasUnfixableIssue = false;

  for (const rawSegment of value.split(",")) {
    const token = rawSegment.trim();

    if (token === "") {
      if (reportedIssueKinds.has("empty")) {
        issues.push({ kind: "empty" });
      }
      continue;
    }

    const classification = classifyToken(token);

    if (classification.kind.startsWith("invalid-")) {
      hasUnfixableIssue = true;
      if (reportedIssueKinds.has(classification.kind)) {
        issues.push({ kind: classification.kind, token });
      }
      continue;
    }

    const normalizedToken =
      preferExtension && classification.preferExtension
        ? classification.preferExtension
        : classification.canonical;

    if (classification.preferExtension && reportedIssueKinds.has("prefer-extension")) {
      issues.push({
        kind: "prefer-extension",
        from: token,
        to: classification.preferExtension,
      });
    } else if (
      normalizedToken !== token &&
      reportedIssueKinds.has("canonical")
    ) {
      issues.push({
        kind: "canonical",
        from: token,
        to: normalizedToken,
      });
    }

    if (seenTokens.has(normalizedToken)) {
      if (reportedIssueKinds.has("duplicate")) {
        issues.push({
          kind: "duplicate",
          token: normalizedToken,
        });
      }
      continue;
    }

    seenTokens.add(normalizedToken);
    normalizedTokens.push(normalizedToken);
  }

  const normalizedValue = normalizedTokens.join(", ");

  if (
    reportedIssueKinds.has("formatting") &&
    !hasUnfixableIssue &&
    issues.length === 0 &&
    normalizedValue !== value
  ) {
    issues.push({ kind: "formatting" });
  }

  return {
    issues,
    normalizedValue,
    canFix:
      !hasUnfixableIssue &&
      normalizedTokens.length > 0 &&
      normalizedValue !== value,
  };
}

function buildFixText(attributeValue, normalizedValue) {
  if (attributeValue.type === "Literal") {
    return JSON.stringify(normalizedValue);
  }

  return `{${JSON.stringify(normalizedValue)}}`;
}

module.exports = {
  PREFER_FORMAT_OVER_MIME_ISSUE_KINDS,
  VALIDATE_FILE_INPUT_ACCEPT_ISSUE_KINDS,
  analyzeAcceptValue,
  buildFixText,
  describeIssue,
  getAcceptLintTarget,
};
