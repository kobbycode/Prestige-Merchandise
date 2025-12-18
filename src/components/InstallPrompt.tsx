import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

const InstallPrompt = () => {
    const { isInstallable, install, isIOS } = usePWA();
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Only show if prompt was dismissed more than 24 hours ago
        const lastDismissed = localStorage.getItem("pwa_prompt_dismissed");
        const now = new Date().getTime();

        if (lastDismissed && now - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
            return;
        }

        if (isInstallable) {
            const timer = setTimeout(() => setShow(true), 5000); // 5 second delay for better UX
            return () => clearTimeout(timer);
        }
    }, [isInstallable]);

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem("pwa_prompt_dismissed", new Date().getTime().toString());
    };

    const handleInstall = () => {
        install();
        setShow(false);
    };

    if (!show || !isInstallable) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] animate-fade-in-up max-w-sm ml-auto">
            <div className="bg-white dark:bg-slate-900 border border-primary/20 shadow-2xl rounded-2xl p-4 md:p-6 flex items-start gap-4 relative overflow-hidden group">
                {/* Accent line */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />

                {/* Icon */}
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 animate-bounce-slow">
                    <Download className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-sm md:text-base text-foreground mb-1">Install Prestige App</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        For a faster, smoother experience and easy access to genuine auto parts.
                    </p>

                    {isIOS ? (
                        <div className="mt-3 space-y-2">
                            <p className="text-[10px] font-medium text-primary uppercase tracking-wider flex items-center gap-1">
                                <Share className="h-3 w-3" /> To install on iPhone:
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                Tap the <strong>Share</strong> button and then <strong>'Add to Home Screen'</strong>
                            </p>
                            <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-7 text-[10px] px-0 hover:bg-transparent underline underline-offset-2">
                                Got it
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 mt-4">
                            <Button size="sm" onClick={handleInstall} className="h-9 rounded-full px-5 text-xs font-bold shadow-md shadow-primary/20">
                                Install Now
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-9 text-xs text-muted-foreground hover:text-foreground">
                                Maybe later
                            </Button>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label="Close prompt"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
