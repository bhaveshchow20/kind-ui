import {
  Callout,
  Document,
  DocumentContent,
  FeedbackBar,
  GeneratedImage,
  GeneratedImageContent,
  type GeneratedImageState,
  Loader,
  Markdown,
  type MarkdownProps,
  Prompt,
  PromptOption,
  PromptStep,
  Question,
  QuestionInput,
  QuestionOption,
  type QuestionValue,
  Shimmer,
  Status,
  Transcript,
  TranscriptItem,
  TranscriptTime,
} from "@kind-ui/ai";
import { Shimmer as SubpathShimmer } from "@kind-ui/ai/loader";
import { Markdown as SubpathMarkdown } from "@kind-ui/ai/markdown";
import { Status as SubpathStatus } from "@kind-ui/ai/status";

const value: QuestionValue = { selectedValues: ["one"], text: "Answer" };
const markdown: MarkdownProps = {
  children: "**Answer**",
  streaming: true,
  controls: { table: false },
};
const state: GeneratedImageState = "generating";
export const consumer = (
  <>
    <Question
      value={value}
      onValueChange={(next) => {
        next.selectedValues.includes("one");
      }}
      onSubmit={async (answer) => {
        answer.text?.trim();
      }}
    >
      <QuestionInput />
      <QuestionOption value="one" />
    </Question>
    <Prompt
      onComplete={(answers) => {
        answers.first?.trim();
      }}
    >
      <PromptStep name="first">
        <PromptOption value="yes">Yes</PromptOption>
      </PromptStep>
    </Prompt>
    <Document open>
      <DocumentContent>
        <Markdown {...markdown} />
      </DocumentContent>
    </Document>
    <GeneratedImage state={state} requestId="request-1" onCancel={async () => {}}>
      <GeneratedImageContent src="/local.png" alt="Description" />
    </GeneratedImage>
    <Transcript
      currentTime={0}
      onSeek={(seconds) => {
        seconds.toFixed(2);
      }}
    >
      <TranscriptItem start={0}>
        <TranscriptTime />
      </TranscriptItem>
    </Transcript>
    <FeedbackBar open />
    <Callout tone="warning" />
    <Loader dots />
    <Shimmer>Working</Shimmer>
    <Status state="pending" />
    <SubpathStatus state="active" />
    <SubpathMarkdown mode="static">Text</SubpathMarkdown>
    <SubpathShimmer>Working</SubpathShimmer>
  </>
);
// @ts-expect-error image alternatives are required
export const missingAlt = <GeneratedImageContent src="/local.png" />;
// @ts-expect-error lifecycle states remain explicit
export const invalidState = <GeneratedImage state="finished" />;
export const invalidMarkdown: MarkdownProps = {
  // @ts-expect-error Markdown is text, not arbitrary React nodes
  children: <span>Text</span>,
};
// @ts-expect-error Question option values remain strings
export const invalidChoice = <QuestionOption value={1} />;
// @ts-expect-error transcript playback is host-owned
export const missingPlayback = <Transcript />;
