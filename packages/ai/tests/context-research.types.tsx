import { Attachment, type AttachmentData, AttachmentProgress } from "@kind-ui/ai/attachments";
import { Context, ContextInputUsage, type ContextUsage, UsageBar } from "@kind-ui/ai/context";
import { InlineCitationCardTrigger, InlineCitationCarousel } from "@kind-ui/ai/inline-citation";
import { Selection, SelectionButton } from "@kind-ui/ai/selection";
import { Source } from "@kind-ui/ai/sources";
import { Uploader, UploaderDropzone, type UploaderFn } from "@kind-ui/ai/uploader";
import { createRef } from "react";

const data: AttachmentData = { type: "file", id: "file", url: "/file", filename: "file.txt" };
const usage: ContextUsage = { inputTokens: 0 };
const transport: UploaderFn = async ({ file, signal, onProgress }) => {
  signal.throwIfAborted();
  onProgress(50);
  return { filename: file.name };
};
const div = createRef<HTMLDivElement>();
const svg = createRef<SVGSVGElement>();
export const section = (
  <>
    <Attachment data={data} ref={div}>
      <AttachmentProgress ref={svg} />
    </Attachment>
    <Context usedTokens={0} maxTokens={100} usage={usage}>
      <ContextInputUsage />
    </Context>
    <UsageBar value={5} max={10} ref={div} warningThreshold={0.8} />
    <Uploader uploader={transport}>
      <UploaderDropzone ref={div} />
    </Uploader>
    <Source render={<a href="/paper" />} href="/paper" />
    <InlineCitationCarousel orientation="vertical" opts={{ loop: true }} />
    <InlineCitationCardTrigger sources={["https://example.com"]} />
    <Selection>
      <SelectionButton onSelect={(text) => text.toUpperCase()} />
    </Selection>
  </>
);
// @ts-expect-error Files require an id and a safe-url-shaped string field.
export const missingIdentity: AttachmentData = { type: "file", url: "/file" };
// @ts-expect-error Uploader transport must return a promise.
export const invalidTransport: UploaderFn = () => "done";
// @ts-expect-error UsageBar requires its consumer-owned maximum.
export const missingMaximum = <UsageBar value={2} />;
