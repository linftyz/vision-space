import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ViewerShell } from "@/components/viewer/viewer-shell";

export default function App() {
  return (
    <ToastProvider position="bottom-right">
      <TooltipProvider>
        <ViewerShell />
      </TooltipProvider>
    </ToastProvider>
  );
}
