import { useState, useEffect } from "react";
import { X, Share, Download } from "lucide-react";

const DISMISSED_KEY = "souklick_pwa_dismissed";

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    if (isIos()) {
      setShowIos(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-primary/10 text-sm">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
        style={{ background: "linear-gradient(145deg, hsl(25,95%,62%), hsl(22,90%,48%))" }}>
        S
      </div>

      {showIos ? (
        <p className="flex-1 text-[13px] text-foreground/80">
          Install Souklick — tap{" "}
          <Share className="inline w-3.5 h-3.5 mx-0.5 text-primary" />
          {" "}then <strong>Add to Home Screen</strong>
        </p>
      ) : (
        <p className="flex-1 text-[13px] text-foreground/80">
          Install Souklick for quick access from your home screen
        </p>
      )}

      {!showIos && (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium shrink-0 hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
      )}

      <button
        onClick={dismiss}
        className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
