import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {

  React.useEffect(() => {
    const growers = document.querySelectorAll(".grow-wrap");

    growers.forEach((grower) => {
      const textarea = grower.querySelector("textarea");
      if (!textarea) return;
      grower.dataset.replicatedValue = textarea.value;
      textarea.addEventListener("input", () => {
        grower.dataset.replicatedValue = textarea.value;
      });
    });
  })

  return (
    (<textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:bg-muted",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
