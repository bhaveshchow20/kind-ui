import ts from "typescript";

// Inspect fixture expressions only. No JavaScript evaluation, imports or arbitrary calls.
export function extractHeatmapData(source) {
  const parsed = ts.createSourceFile("example.tsx", source, ts.ScriptTarget.Latest, true);
  const scope = new Map();
  let steps = 0;
  function value(node, bindings) {
    if (++steps > 10000) throw new Error("Heatmap fixture exceeds inspection limit");
    if (ts.isParenthesizedExpression(node)) return value(node.expression, bindings);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isIdentifier(node) && bindings.has(node.text)) return bindings.get(node.text);
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken)
      return -value(node.operand, bindings);
    if (ts.isArrayLiteralExpression(node)) {
      if (node.elements.length > 1024) throw new Error("Heatmap fixture array is too large");
      return node.elements.map((item) => value(item, bindings));
    }
    if (ts.isObjectLiteralExpression(node))
      return Object.fromEntries(
        node.properties.map((property) => {
          if (ts.isShorthandPropertyAssignment(property))
            return [property.name.text, value(property.name, bindings)];
          if (!ts.isPropertyAssignment(property) || ts.isComputedPropertyName(property.name))
            throw new Error("Unsupported Heatmap fixture property");
          return [property.name.text, value(property.initializer, bindings)];
        }),
      );
    if (ts.isBinaryExpression(node)) {
      const left = value(node.left, bindings),
        right = value(node.right, bindings);
      if (
        node.operatorToken.kind === ts.SyntaxKind.PlusToken &&
        typeof left === "number" &&
        typeof right === "number"
      )
        return left + right;
      if (
        node.operatorToken.kind === ts.SyntaxKind.PercentToken &&
        typeof left === "number" &&
        typeof right === "number" &&
        right > 0
      )
        return left % right;
    }
    if (ts.isTemplateExpression(node))
      return (
        node.head.text +
        node.templateSpans
          .map((span) => {
            const item = value(span.expression, bindings);
            if (typeof item !== "string" && typeof item !== "number")
              throw new Error("Unsupported Heatmap fixture template value");
            return `${item}${span.literal.text}`;
          })
          .join("")
      );
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const { expression: receiver, name } = node.expression;
      let items, callback;
      if (ts.isIdentifier(receiver) && receiver.text === "Array" && name.text === "from") {
        if (node.arguments.length !== 2) throw new Error("Unsupported Array.from fixture");
        const options = value(node.arguments[0], bindings);
        if (
          Object.keys(options).join() !== "length" ||
          !Number.isInteger(options.length) ||
          options.length < 0 ||
          options.length > 52
        )
          throw new Error("Unsupported Array.from fixture length");
        items = Array(options.length).fill(undefined);
        callback = node.arguments[1];
      } else if (name.text === "map" || name.text === "flatMap") {
        if (node.arguments.length !== 1) throw new Error("Unsupported fixture map arguments");
        items = value(receiver, bindings);
        callback = node.arguments[0];
      } else throw new Error("Unsupported Heatmap fixture call");
      if (
        !Array.isArray(items) ||
        items.length > 1024 ||
        !ts.isArrowFunction(callback) ||
        callback.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) ||
        ts.isBlock(callback.body) ||
        callback.parameters.length > 2 ||
        callback.parameters.some(
          (parameter) =>
            !ts.isIdentifier(parameter.name) || parameter.initializer || parameter.dotDotDotToken,
        )
      )
        throw new Error("Unsupported Heatmap fixture callback");
      const mapped = items.map((item, index) => {
        const local = new Map(bindings);
        callback.parameters.forEach((parameter, i) => {
          local.set(parameter.name.text, i === 0 ? item : index);
        });
        return value(callback.body, local);
      });
      const result = name.text === "flatMap" ? mapped.flat() : mapped;
      if (result.length > 1024) throw new Error("Heatmap fixture array is too large");
      return result;
    }
    throw new Error(`Unsupported Heatmap fixture expression: ${node.getText(parsed)}`);
  }
  for (const statement of parsed.statements.filter(ts.isVariableStatement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        !["rows", "columns", "data"].includes(declaration.name.text)
      )
        continue;
      if (!declaration.initializer || scope.has(declaration.name.text))
        throw new Error("Invalid Heatmap fixture declaration");
      scope.set(declaration.name.text, value(declaration.initializer, scope));
    }
  }
  for (const name of ["rows", "columns", "data"])
    if (!Array.isArray(scope.get(name))) throw new Error(`Missing Heatmap fixture ${name}`);
  return Object.fromEntries(scope);
}
