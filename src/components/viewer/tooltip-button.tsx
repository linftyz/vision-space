import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function TooltipButton({
  buttonClassName,
  children,
  className,
  label,
  onClick,
  shortcut,
  size = "icon",
}: {
  buttonClassName?: string;
  children: ReactNode;
  className?: string;
  label: string;
  onClick: () => void;
  shortcut?: string;
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  return (
    <span className={className}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-label={label}
              className={cn("shrink-0", buttonClassName)}
              onClick={onClick}
              size={size}
              variant="ghost"
            />
          }
        >
          {children}
        </TooltipTrigger>
        <TooltipPopup>
          <span className="inline-flex items-center gap-2">
            {label}
            {shortcut && <Kbd>{shortcut}</Kbd>}
          </span>
        </TooltipPopup>
      </Tooltip>
    </span>
  );
}
