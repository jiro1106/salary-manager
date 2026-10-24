import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Masthead from "./Masthead";

interface SubScreenProps {
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
}

/**
 * A screen off the home tabs: the masthead as brand rather than title
 * (each sub-screen names itself with its own h1), then a back link.
 */
export default function SubScreen({ backLabel, onBack, children }: SubScreenProps) {
  return (
    <div className="mx-auto w-full max-w-content px-page-x pb-page-b">
      <Masthead />
      <main>
        <button
          type="button"
          onClick={onBack}
          className={[
            // The 44px target already leaves ~13px under the label, so the
            // margin only has to top that up. The return and the title it
            // returns from are one group, not two bands.
            "mb-0.5 inline-flex min-h-hit items-center gap-2 rounded-control px-1 text-meta font-semibold",
            "text-ink-soft transition-colors duration-fast ease-paper hover:text-ink",
          ].join(" ")}
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          {backLabel}
        </button>
        {children}
      </main>
    </div>
  );
}
