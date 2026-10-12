import assert from "node:assert/strict";
import ts from "typescript";

/** @typedef {{ id: string, variants?: Record<string, { source: string }> }} LoadingExample */

/**
 * Check every chart root in the public entry installed by the Docs app.
 * @param {string} publicEntrySource
 * @param {Record<string, LoadingExample>} bundles
 */
export function nativeLoadingCoverage(publicEntrySource, bundles) {
  const publicIndex = ts.createSourceFile(
    "index.js",
    publicEntrySource,
    ts.ScriptTarget.Latest,
    true,
  );
  const chartExports = publicIndex.statements.flatMap((statement) =>
    ts.isExportDeclaration(statement) &&
    statement.exportClause &&
    ts.isNamedExports(statement.exportClause)
      ? statement.exportClause.elements
          .filter(
            (entry) => !entry.isTypeOnly && /(?:Chart$|^ActivityRings$)/.test(entry.name.text),
          )
          .map((entry) => entry.name.text)
      : [],
  );
  assert.ok(chartExports.length, "Installed Docs public entry has no chart roots");
  return chartExports.map((component) => {
    const bundle = Object.values(bundles).find((example) => {
      if (!example.variants?.loading) return false;
      const source = ts.createSourceFile(
        "example.tsx",
        example.variants.loading.source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const namedImports = new Set();
      const namespaceImports = new Set();
      for (const statement of source.statements) {
        if (
          !ts.isImportDeclaration(statement) ||
          !ts.isStringLiteral(statement.moduleSpecifier) ||
          statement.moduleSpecifier.text !== "@kind-ui/charts" ||
          statement.importClause?.isTypeOnly
        )
          continue;
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings)) namespaceImports.add(bindings.name.text);
        if (bindings && ts.isNamedImports(bindings))
          for (const entry of bindings.elements)
            if (!entry.isTypeOnly && (entry.propertyName?.text ?? entry.name.text) === component)
              namedImports.add(entry.name.text);
      }
      let found = false;
      /** @param {ts.Node} node */
      function visit(node) {
        if (
          (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
          ((ts.isIdentifier(node.tagName) && namedImports.has(node.tagName.text)) ||
            (ts.isPropertyAccessExpression(node.tagName) &&
              ts.isIdentifier(node.tagName.expression) &&
              namespaceImports.has(node.tagName.expression.text) &&
              node.tagName.name.text === component)) &&
          node.attributes.properties.some(
            (attribute) =>
              ts.isJsxAttribute(attribute) && attribute.name.getText(source) === "loading",
          )
        )
          found = true;
        ts.forEachChild(node, visit);
      }
      visit(source);
      return found;
    });
    assert.ok(bundle, `${component} needs a native loading example`);
    return { component, example: bundle.id };
  });
}
