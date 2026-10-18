import { Loader, type LoaderProps, Shimmer, type TextShimmerProps } from "@kind-ui/ai";
import { Loader as SubpathLoader, Shimmer as SubpathShimmer } from "@kind-ui/ai/loader";
import { createRef } from "react";

const spanRef = createRef<HTMLSpanElement>();
const paragraphRef = createRef<HTMLParagraphElement>();
const loaderProps: LoaderProps = {
  variant: null,
  duration: Number.NaN,
  spread: Number.POSITIVE_INFINITY,
  "aria-label": undefined,
  role: "note",
};
const shimmerProps: TextShimmerProps = { children: "Kind", duration: 2, spread: 0 };

export const consumer = (
  <>
    <Loader {...loaderProps} ref={spanRef} onClick={(event) => event.preventDefault()}>
      <strong>Searching</strong>
    </Loader>
    <SubpathLoader dots duration={1.5} spread={40} ref={spanRef}>
      {0}
    </SubpathLoader>
    <Loader render={<button type="button" />} role="button" aria-label="Host action" />
    <Shimmer {...shimmerProps} ref={paragraphRef} onClick={(event) => event.preventDefault()} />
    <SubpathShimmer as="span" aria-label="Host shimmer" title="Host title">
      Searching
    </SubpathShimmer>
  </>
);

// @ts-expect-error Loader retains its finite set of visual variants.
export const invalidVariant = <Loader variant="typing" />;
// @ts-expect-error Loader duration remains a numeric value in seconds.
export const invalidDuration = <SubpathLoader duration="2s" />;
// @ts-expect-error Shimmer retains its string-only content contract.
export const invalidChildren = <Shimmer>{42}</Shimmer>;
// @ts-expect-error Shimmer spread remains numeric.
export const invalidSpread = <SubpathShimmer spread="wide">Text</SubpathShimmer>;
