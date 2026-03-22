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
        normalized: normalizedToken,
      };
    }

    return { kind: "invalid-extension" };
  }

  const wildcardMatch = WILDCARD_PATTERN.exec(token);
  if (wildcardMatch) {
    if (VALID_WILDCARDS.has(normalizedToken)) {
      return {
        kind: "wildcard",
        normalized: normalizedToken,
      };
    }

    return { kind: "invalid-wildcard" };
  }

  if (token.includes("*")) {
    return { kind: "invalid-wildcard" };
  }

  if (MIME_TYPE_PATTERN.test(token)) {
    if (mime.extension(normalizedToken)) {
      const preferredExtension = getPreferredExtensionToken(normalizedToken);
      return {
        kind: "mime",
        normalized: preferredExtension ?? normalizedToken,
        preferExtension: preferredExtension,
      };
    }

    return { kind: "invalid-mime" };
  }

  return { kind: "invalid-token" };
}

function describeIssue(issue) {
  switch (issue.kind) {
    case "canonical":
      return `use canonical token \"${issue.to}\" instead of \"${issue.from}\"`;
    case "duplicate":
      return `remove duplicate token \"${issue.token}\"`;
    case "empty":
      return "remove empty accept entries";
    case "formatting":
      return "normalize spacing between accept tokens";
    case "invalid-extension":
      return `\"${issue.token}\" is not a known file extension`;
    case "invalid-mime":
      return `\"${issue.token}\" is not a known MIME type`;
    case "invalid-token":
      return `\"${issue.token}\" is not a valid accept token`;
    case "invalid-wildcard":
      return `\"${issue.token}\" is not a supported top-level media wildcard`;
    case "prefer-extension":
      return `prefer extension token \"${issue.to}\" over MIME token \"${issue.from}\" for broader platform compatibility`;
    default:
      return issue.kind;
  }
}

function analyzeAcceptValue(value) {
  const issues = [];
  const normalizedTokens = [];
  const seenTokens = new Set();
  let hasUnfixableIssue = false;

  for (const rawSegment of value.split(",")) {
    const token = rawSegment.trim();

    if (token === "") {
      issues.push({ kind: "empty" });
      continue;
    }

    const classification = classifyToken(token);

    if (classification.kind.startsWith("invalid-")) {
      issues.push({ kind: classification.kind, token });
      hasUnfixableIssue = true;
      continue;
    }

    if (classification.preferExtension) {
      issues.push({
        kind: "prefer-extension",
        from: token,
        to: classification.preferExtension,
      });
    } else if (classification.normalized !== token) {
      issues.push({
        kind: "canonical",
        from: token,
        to: classification.normalized,
      });
    }

    if (seenTokens.has(classification.normalized)) {
      issues.push({
        kind: "duplicate",
        token: classification.normalized,
      });
      continue;
    }

    seenTokens.add(classification.normalized);
    normalizedTokens.push(classification.normalized);
  }

  const normalizedValue = normalizedTokens.join(", ");

  if (!hasUnfixableIssue && issues.length === 0 && normalizedValue !== value) {
    issues.push({ kind: "formatting" });
  }

  return {
    issues,
    normalizedValue,
    canFix: !hasUnfixableIssue && normalizedValue !== value,
  };
}

function buildFixText(attributeValue, normalizedValue) {
  if (attributeValue.type === "Literal") {
    return JSON.stringify(normalizedValue);
  }

  return `{${JSON.stringify(normalizedValue)}}`;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Validate accept values on file input elements.",
    },
    fixable: "code",
    schema: [],
    messages: {
      invalidAcceptValue: "Invalid file input accept value: {{details}}.",
      nonStaticAcceptValue:
        "File input accept value must be a static string so it can be validated.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (!isInputElement(node)) {
          return;
        }

        const typeAttribute = getAttribute(node, "type");
        const typeValue = getStaticStringValue(typeAttribute);
        if (!typeValue || typeValue.value.toLowerCase() !== "file") {
          return;
        }

        const acceptAttribute = getAttribute(node, "accept");
        const acceptValue = getStaticStringValue(acceptAttribute);
        if (!acceptValue) {
          if (acceptAttribute && acceptAttribute.value) {
            context.report({
              node: acceptAttribute.value,
              messageId: "nonStaticAcceptValue",
            });
          }
          return;
        }

        const analysis = analyzeAcceptValue(acceptValue.value);
        if (analysis.issues.length === 0) {
          return;
        }

        context.report({
          node: acceptValue.valueNode,
          messageId: "invalidAcceptValue",
          data: {
            details: analysis.issues.map(describeIssue).join("; "),
          },
          fix:
            analysis.canFix && acceptValue.canFix
              ? (fixer) =>
                  fixer.replaceText(
                    acceptAttribute.value,
                    buildFixText(acceptAttribute.value, analysis.normalizedValue),
                  )
              : null,
        });
      },
    };
  },
};
