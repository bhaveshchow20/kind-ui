import assert from "node:assert/strict";
import test from "node:test";
import * as K from "@kind-ui/ai";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

// The same public-export tests can be copied into an isolated packed consumer.
test("section subpaths resolve to the same public components", async () => {
  for (const [path, symbol, expected] of [
    ["attachments", "Attachment", K.Attachment],
    ["uploader", "Uploader", K.Uploader],
    ["sources", "Sources", K.Sources],
    ["inline-citation", "InlineCitation", K.InlineCitation],
    ["context", "Context", K.Context],
    ["selection", "Selection", K.Selection],
  ]) {
    assert.equal((await import(`@kind-ui/ai/${path}`))[symbol], expected);
  }
});

test("attachment identity, zero progress and indeterminate progress remain distinct", () => {
  const data = {
    type: "file",
    id: "brief",
    filename: "brief.pdf",
    mediaType: "application/pdf",
    url: "/brief.pdf",
  };
  assert.equal(K.getMediaCategory(data), "document");
  assert.equal(K.getAttachmentLabel(data), "brief.pdf");
  assert.equal(K.getMediaCategory({ type: "source-document", id: "source" }), "source");
  const attachment = (progress) =>
    render(
      h(
        K.Attachment,
        { data, progress, onRemove() {} },
        h(K.AttachmentRemove),
        h(K.AttachmentProgress),
      ),
    );
  assert.match(attachment(0), /aria-valuenow="0"/);
  assert.match(attachment(130), /aria-valuenow="100"/);
  assert.doesNotMatch(attachment(Number.NaN), /aria-valuenow=/);
  assert.match(attachment(0), /aria-label="Remove brief.pdf"/);
  assert.throws(() => render(h(K.AttachmentProgress)), /within <Attachment>/);
});

test("sources and citation URLs keep safe anchors and reject script protocols", () => {
  // biome-ignore lint/security/noScriptUrl: Deliberate rejected-protocol regression input.
  const unsafe = render(h(K.Source, { href: "javascript:alert(1)", title: "Unsafe" }));
  assert.doesNotMatch(unsafe, /href=/);
  const safe = render(h(K.Source, { href: "/paper", title: "Paper" }));
  assert.match(safe, /href="\/paper"/);
  assert.match(safe, /rel="noopener noreferrer"/);
  const citation = render(
    h(K.InlineCitationSource, { url: "javascript:alert(1)", title: "Reference" }),
  );
  assert.doesNotMatch(citation, /<a/);
  assert.match(citation, /Reference/);
  assert.throws(() => render(h(K.InlineCitationCarouselNext)), /inside InlineCitationCarousel/);
});

test("context reports explicit zero and unknown amounts without fabricated usage", () => {
  const content = (props) =>
    render(
      h(
        K.Context,
        { usedTokens: 0, maxTokens: 100, ...props },
        h(K.ContextContentHeader),
        h(K.ContextInputUsage),
        h(K.ContextContentFooter),
      ),
    );
  const zero = content({ usage: { inputTokens: 0 }, costs: { total: 0 } });
  assert.match(zero, /0%/);
  assert.match(zero, /context-input-usage/);
  assert.match(zero, /\$0\.00/);
  const missing = content({ usedTokens: Number.NaN, maxTokens: 0 });
  assert.match(missing, /Usage unavailable/);
  assert.doesNotMatch(missing, /context-input-usage/);
  assert.doesNotMatch(missing, /NaN|Infinity/);
  assert.match(render(h(K.UsageBar, { value: 90, max: 100 })), /data-state="over"/);
  assert.match(render(h(K.UsageBar, { value: 25, max: 100 })), /data-state="under"/);
  assert.throws(() => render(h(K.ContextTrigger)), /inside Context/);
});

test("selection and uploader parts require their owning providers", () => {
  assert.throws(() => render(h(K.SelectionContent)), /within <Selection>/);
  assert.throws(() => render(h(K.SelectionButton)), /within <Selection>/);
  assert.throws(() => render(h(K.UploaderTrigger)), /within <Uploader>/);
  const markup = render(h(K.Uploader, { disabled: true }, h(K.UploaderDropzone)));
  assert.match(markup, /type="file"/);
  assert.match(markup, /aria-disabled="true"/);
  assert.match(markup, /Choose files/);
});

class FakeXhr {
  static instances = [];
  upload = {};
  status = 200;
  responseText = '{"url":"/uploaded"}';
  requestHeaders = {};
  constructor() {
    FakeXhr.instances.push(this);
  }
  open(method, url) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name, value) {
    this.requestHeaders[name] = value;
  }
  send(body) {
    this.body = body;
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}

function installXhr(t) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "XMLHttpRequest");
  Object.defineProperty(globalThis, "XMLHttpRequest", {
    configurable: true,
    writable: true,
    value: FakeXhr,
  });
  FakeXhr.instances = [];
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "XMLHttpRequest", original);
    else delete globalThis.XMLHttpRequest;
  });
}

test("XHR transport is lazy, reports progress, settles once, and cleans listeners", async (t) => {
  installXhr(t);
  const upload = K.createXhrUploader({ url: "/upload", headers: { "X-Test": "yes" } });
  assert.equal(FakeXhr.instances.length, 0);
  const progress = [];
  const pending = upload({
    file: new File(["data"], "test.txt"),
    signal: new AbortController().signal,
    onProgress: (value) => progress.push(value),
  });
  const xhr = FakeXhr.instances.at(-1);
  assert.equal(xhr.url, "/upload");
  assert.equal(xhr.requestHeaders["X-Test"], "yes");
  xhr.upload.onprogress({ lengthComputable: true, loaded: 1, total: 4 });
  xhr.onload();
  assert.deepEqual(await pending, { url: "/uploaded" });
  assert.deepEqual(progress, [25]);
  assert.equal(xhr.onload, null);
  assert.equal(xhr.upload.onprogress, null);
});

test("XHR rejects invalid endpoints, cancellation, HTTP failures and timeout", async (t) => {
  installXhr(t);
  const input = (signal = new AbortController().signal) => ({
    file: new File(["data"], "test.txt"),
    signal,
    onProgress() {},
  });
  await assert.rejects(K.createXhrUploader({ url: "javascript:alert(1)" })(input()), {
    code: "invalid_url",
  });
  const controller = new AbortController();
  const pending = K.createXhrUploader({ url: "/upload" })(input(controller.signal));
  const canceled = FakeXhr.instances.at(-1);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(canceled.aborted, true);
  assert.equal(canceled.onload, null);
  const count = FakeXhr.instances.length;
  await assert.rejects(K.createXhrUploader({ url: "/upload" })(input(controller.signal)), {
    name: "AbortError",
  });
  assert.equal(FakeXhr.instances.length, count);
  const failed = K.createXhrUploader({ url: "/upload" })(input());
  const http = FakeXhr.instances.at(-1);
  http.status = 413;
  http.onload();
  await assert.rejects(failed, { code: "http_413" });
  const timedOut = K.createXhrUploader({ url: "/upload", timeout: 10 })(input());
  FakeXhr.instances.at(-1).ontimeout();
  await assert.rejects(timedOut, { code: "timeout" });
});
