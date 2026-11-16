import assert from "node:assert/strict";
import ts from "typescript";

/** @typedef {{id:string, variants?: Record<string, {source:string}>}} LoadingExample */

/** @param {string} component @param {string} sourceText */
export function hasNativeLoading(component, sourceText) {
  const source = ts.createSourceFile(
    "example.tsx",
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  /** @type {Set<string>} */
  const namedImports = new Set();
  /** @type {Set<string>} */
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
  /** @param {import("typescript").Node} node */
  function visit(node) {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ((ts.isIdentifier(node.tagName) && namedImports.has(node.tagName.text)) ||
        (ts.isPropertyAccessExpression(node.tagName) &&
          ts.isIdentifier(node.tagName.expression) &&
          namespaceImports.has(node.tagName.expression.text) &&
          node.tagName.name.text === component)) &&
      node.attributes.properties.some(
        (attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === "loading",
      )
    )
      found = true;
    ts.forEachChild(node, visit);
  }
  visit(source);
  return found;
}

/**
 * @param {{components:readonly string[], documentedFamilies:readonly string[], bundles:Readonly<Record<string, LoadingExample>>, readCoreFixture:(path:string)=>string}} options
 */
export function loadingCoverageFor({ components, documentedFamilies, bundles, readCoreFixture }) {
  return components.map((component) => {
    if (component === "TreemapChart" && !documentedFamilies.includes("treemap")) {
      const path = "../../tests/fixtures/treemap/host.tsx";
      assert.ok(
        hasNativeLoading(component, readCoreFixture(path)),
        "TreemapChart packed Core fixture must provide native loading",
      );
      return { component, source: "core-fixture", fixture: "tests/fixtures/treemap/host.tsx" };
    }
    const examples =
      component === "TreemapChart"
        ? bundles.treemap
          ? [bundles.treemap]
          : []
        : Object.values(bundles);
    const bundle = examples.find(
      (example) =>
        example.variants?.loading && hasNativeLoading(component, example.variants.loading.source),
    );
    assert.ok(bundle, `${component} needs a native loading example`);
    return { component, source: "docs", example: bundle.id };
  });
}
