import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Loader2, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { SiGoogle, SiZomato, SiTripadvisor } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const PLATFORM_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  google: SiGoogle,
  zomato: SiZomato,
  tripadvisor: SiTripadvisor,
};

const PLATFORM_LABEL: Record<string, string> = {
  google: "Google",
  zomato: "Zomato",
  tripadvisor: "TripAdvisor",
};

type Step = "loading" | "error" | "rate" | "feedback-form" | "feedback-done" | "redirect";

export default function FeedbackFunnel() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [step, setStep] = useState<Step>("loading");
  const [locationName, setLocationName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [platform, setPlatform] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStep("error"); return; }
    fetch(`/api/funnel/${token}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        setLocationName(data.locationName ?? "");
        setCustomerName(data.customerName ?? "");
        setPlatform(data.platform ?? "");
        setStep("rate");
      })
      .catch(() => setStep("error"));
  }, [token]);

  const handleRate = async (rating: number) => {
    setSelectedRating(rating);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/funnel/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      const data = await res.json();
      if (rating >= 4 && data.redirect) {
        setStep("redirect");
        setTimeout(() => { window.location.href = data.redirect; }, 1500);
      } else if (rating >= 4) {
        setStep("feedback-done");
      } else {
        setStep("feedback-form");
      }
    } catch {
      // still show the form even if the request failed
      if (rating < 4) setStep("feedback-form");
      else setStep("feedback-done");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/funnel/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating, feedbackText }),
      });
    } catch {
      // silently continue — the customer still sees the thank-you
    } finally {
      setSubmitting(false);
      setStep("feedback-done");
    }
  };

  const PlatformIcon = PLATFORM_ICON[platform];
  const firstName = customerName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-lg"
            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
            S
          </div>
          <span className="text-lg font-bold text-gray-800">Souklick</span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">

          {/* Loading */}
          {step === "loading" && (
            <div className="p-10 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="p-10 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <p className="font-semibold text-gray-800 mb-2">This link is no longer valid</p>
              <p className="text-sm text-gray-500">It may have expired or already been used.</p>
            </div>
          )}

          {/* Star rating step */}
          {step === "rate" && (
            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-2xl font-bold text-gray-900 mb-2">Hi {firstName}!</p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  How was your experience at <strong>{locationName}</strong>?
                </p>
              </div>

              <div className="flex justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    disabled={submitting}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => handleRate(star)}
                    className="transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    <Star
                      className="w-10 h-10 transition-colors"
                      fill={(hoveredRating || selectedRating) >= star ? "#f97316" : "none"}
                      stroke={(hoveredRating || selectedRating) >= star ? "#f97316" : "#d1d5db"}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              {submitting && (
                <div className="flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                </div>
              )}

              <p className="text-center text-xs text-gray-400">Tap a star to rate your visit</p>
            </div>
          )}

          {/* Private feedback form (unhappy customer) */}
          {step === "feedback-form" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-xl font-bold text-gray-900 mb-2">We're sorry to hear that</p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Your feedback goes directly to the team at <strong>{locationName}</strong> — not posted publicly. Help us understand what went wrong.
                </p>
              </div>

              <Textarea
                placeholder="Tell us what happened..."
                className="mb-4 resize-none"
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />

              <Button
                className="w-full"
                onClick={handleSubmitFeedback}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send feedback
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4">
                This is private and will never be posted publicly.
              </p>
            </div>
          )}

          {/* Redirect to review platform */}
          {step === "redirect" && (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                {PlatformIcon ? <PlatformIcon className="w-7 h-7 text-green-600" /> : <CheckCircle2 className="w-7 h-7 text-green-600" />}
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Wonderful! Thank you</p>
              <p className="text-gray-500 text-sm">
                Taking you to {PLATFORM_LABEL[platform] ?? platform} to leave your review...
              </p>
              <Loader2 className="w-5 h-5 animate-spin text-orange-500 mx-auto mt-4" />
            </div>
          )}

          {/* Feedback received thank-you */}
          {step === "feedback-done" && (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-orange-600" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Thank you, {firstName}</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Your feedback has been shared with the team at <strong>{locationName}</strong>. We really appreciate you taking the time.
              </p>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">Powered by Souklick</p>
      </div>
    </div>
  );
}
