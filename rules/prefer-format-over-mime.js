const {
  PREFER_FORMAT_OVER_MIME_ISSUE_KINDS,
  analyzeAcceptValue,
  buildFixText,
  describeIssue,
  getAcceptLintTarget,
} = require("./_accept-utils");

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer extension tokens over less portable MIME aliases in file input accept values.",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferFormatOverMime: "Prefer extension tokens over MIME aliases: {{details}}.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const target = getAcceptLintTarget(node);
        if (!target) {
          return;
        }

        const { acceptAttribute, acceptValue } = target;
        if (!acceptAttribute || !acceptValue) {
          return;
        }

        const analysis = analyzeAcceptValue(acceptValue.value, {
          preferExtension: true,
          reportedIssueKinds: PREFER_FORMAT_OVER_MIME_ISSUE_KINDS,
        });
        if (analysis.issues.length === 0) {
          return;
        }

        context.report({
          node: acceptValue.valueNode,
          messageId: "preferFormatOverMime",
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
