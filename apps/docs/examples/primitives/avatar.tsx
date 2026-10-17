"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kind-ui/primitives/avatar";
import { Button } from "@kind-ui/primitives/button";
import { useState } from "react";

const portrait = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#e7e3dc"/><path d="M10 80a30 30 0 0 1 60 0" fill="#68786b"/><circle cx="40" cy="33" r="16" fill="#b97f62"/><path d="M24 32c-5-24 37-27 33 0-5-1-8-6-9-10-6 7-15 9-24 10" fill="#34332f"/></svg>',
)}`;

export default function AvatarExample() {
  const [showImage, setShowImage] = useState(true);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-background p-6">
      <div className="flex items-center gap-3">
        <Avatar
          key={showImage ? "portrait" : "initials"}
          size="lg"
          role="img"
          aria-label="Maya Chen"
        >
          {showImage && <AvatarImage src={portrait} alt="" />}
          <AvatarFallback>MC</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-foreground">Maya Chen</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Product designer</p>
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        A familiar face, with initials when no image is available.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => setShowImage((current) => !current)}
      >
        {showImage ? "Show initials" : "Show portrait"}
      </Button>
    </div>
  );
}
