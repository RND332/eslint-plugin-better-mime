const {
  VALIDATE_FILE_INPUT_ACCEPT_ISSUE_KINDS,
  analyzeAcceptValue,
  buildFixText,
  describeIssue,
  getAcceptLintTarget,
} = require("./_accept-utils");

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
        const target = getAcceptLintTarget(node, context.sourceCode);
        if (!target) {
          return;
        }

        const { acceptAttribute, acceptValue } = target;
        if (!acceptValue) {
          if (acceptAttribute && acceptAttribute.value) {
            context.report({
              node: acceptAttribute.value,
              messageId: "nonStaticAcceptValue",
            });
          }
          return;
        }

        const analysis = analyzeAcceptValue(acceptValue.value, {
          reportedIssueKinds: VALIDATE_FILE_INPUT_ACCEPT_ISSUE_KINDS,
        });
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
