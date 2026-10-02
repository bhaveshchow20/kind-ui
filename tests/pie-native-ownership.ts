import type { Locator } from "./browser";

// Fixture-only ownership oracle. It does not promise stable live-inline Chromium rasterization.
export async function pieNativeOwnership(chart: Locator) {
  return chart.evaluate(async (chartNode) => {
    const svg = chartNode instanceof SVGSVGElement ? chartNode : chartNode.querySelector("svg");
    if (!(svg instanceof SVGSVGElement)) throw Error("Expected complete Pie fixture SVG");
    const paintProperties = [
      "color",
      "fill",
      "fill-opacity",
      "fill-rule",
      "stroke",
      "stroke-opacity",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-miterlimit",
      "stroke-dasharray",
      "stroke-dashoffset",
      "opacity",
      "filter",
      "mask",
      "mask-image",
      "mask-mode",
      "mask-size",
      "mask-position",
      "mask-origin",
      "mask-clip",
      "mask-repeat",
      "mask-composite",
      "mask-type",
      "clip-path",
      "clip-rule",
      "transform",
      "transform-origin",
      "transform-box",
      "translate",
      "rotate",
      "scale",
      "perspective",
      "perspective-origin",
      "transform-style",
      "backface-visibility",
      "display",
      "visibility",
      "overflow",
      "mix-blend-mode",
      "isolation",
      "vector-effect",
      "paint-order",
      "shape-rendering",
      "color-interpolation",
      "color-interpolation-filters",
      "flood-color",
      "flood-opacity",
      "stop-color",
      "stop-opacity",
    ];
    const ids = new Map<string, string>();
    let generated = 0;
    for (const node of [svg, ...svg.querySelectorAll("[id]")]) {
      const id = node.id;
      if (!id) continue;
      if (ids.has(id)) throw Error(`Duplicate fixture ID: ${id}`);
      // Only this adapter's remount-generated source IDs vary. Consumer IDs remain exact.
      const adapterSource =
        node.localName === "g" &&
        node.children.length === 1 &&
        node.firstElementChild?.matches('[data-kind-ui="pie-sector"]') &&
        /^kind-ui-pie-.+-paint$/.test(id);
      ids.set(id, adapterSource ? `fixture-pie-source-${generated++}` : id);
    }
    if (new Set(ids.values()).size !== ids.size)
      throw Error("Conflicting fixture ID normalization");
    const reference = (value: string) => {
      const url = new URL(value, document.baseURI);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        url.search !== location.search ||
        !url.hash
      )
        throw Error(`External fixture resource: ${value}`);
      const id = decodeURIComponent(url.hash.slice(1));
      const resolved = ids.get(id);
      if (!resolved) throw Error(`Unresolved fixture resource: ${id}`);
      return `#${resolved}`;
    };
    const normalize = (value: string) =>
      value.replace(
        /url\(\s*(["']?)(.*?)\1\s*\)/g,
        (_whole, _quote, resource: string) => `url(${reference(resource)})`,
      );
    const attributes = (node: Element) =>
      Array.from(node.attributes)
        .map(({ name, value }) => [
          name,
          name === "id"
            ? (ids.get(value) ?? value)
            : name === "href" || name === "xlink:href"
              ? reference(value)
              : normalize(value),
        ])
        .sort(([a], [b]) => a.localeCompare(b));
    const resolvedPaint = (node: Element) => {
      const style = getComputedStyle(node);
      return paintProperties.map((property) => [
        property,
        normalize(style.getPropertyValue(property)),
      ]);
    };
    const matrix = (value: DOMMatrix | null) =>
      value && [value.a, value.b, value.c, value.d, value.e, value.f];
    const bounds = (node: Element) => {
      const b = node.getBoundingClientRect();
      return [b.x, b.y, b.width, b.height];
    };
    const clone = svg.cloneNode(true);
    if (!(clone instanceof SVGSVGElement)) throw Error("Expected cloned SVG");
    const originals = [svg, ...svg.querySelectorAll("*")];
    const copies = [clone, ...clone.querySelectorAll("*")];
    const tree = originals.map((node, index) => {
      const paint = resolvedPaint(node);
      const copy = copies[index];
      if (!(copy instanceof SVGElement)) throw Error("Unexpected non-SVG fixture descendant");
      for (const [name, value] of attributes(node)) copy.setAttribute(name, value);
      // CSS transform overrides the retained SVG transform attribute; it is not multiplied twice.
      for (const [name, value] of paint) copy.style.setProperty(name, value);
      return {
        name: node.localName,
        parent: node.parentElement ? originals.indexOf(node.parentElement) : -1,
        attributes: attributes(node),
        paint,
        children: Array.from(node.childNodes).map((child) =>
          child.nodeType === Node.TEXT_NODE
            ? { text: child.textContent }
            : { element: (child as Element).localName },
        ),
        bounds: bounds(node),
        ctm: node instanceof SVGGraphicsElement ? matrix(node.getCTM()) : null,
      };
    });
    const ancestors = [];
    for (let node = svg.parentElement; node; node = node.parentElement) {
      ancestors.push({
        name: node.localName,
        attributes: attributes(node),
        paint: resolvedPaint(node),
        bounds: bounds(node),
      });
    }
    const width = svg.width.baseVal.value,
      height = svg.height.baseVal.value;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width !== 300 || height !== 280)
      throw Error("Unexpected native Pie fixture viewport");
    const outer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    outer.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    outer.setAttribute("width", String(width));
    outer.setAttribute("height", String(height));
    outer.setAttribute("viewBox", `0 0 ${width} ${height}`);
    let parent: SVGElement = outer;
    // These fixed-fixture ancestors have no HTML layout/clip/perspective effects to export.
    // Their independent live-state comparison remains authoritative for ownership changes.
    for (const ancestor of [...ancestors].reverse()) {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      for (const [name, value] of ancestor.paint) group.style.setProperty(name, value);
      parent.append(group);
      parent = group;
    }
    parent.append(clone);
    const serialized = new XMLSerializer().serializeToString(outer);
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw Error("Expected fixture image decoder");
    context.drawImage(image, 0, 0, width, height);
    const rgba = context.getImageData(0, 0, width, height).data;
    let painted = 0,
      bytes = "";
    for (let i = 3; i < rgba.length; i += 4) if (rgba[i]) painted++;
    if (!painted) throw Error("Empty serialized native Pie paint");
    for (let i = 0; i < rgba.length; i += 32768)
      bytes += String.fromCharCode(...rgba.subarray(i, i + 32768));
    return {
      state: JSON.stringify({ tree, ancestors, width, height }),
      rgba: btoa(bytes),
      png: canvas.toDataURL("image/png"),
      painted,
      width,
      height,
    };
  });
}
