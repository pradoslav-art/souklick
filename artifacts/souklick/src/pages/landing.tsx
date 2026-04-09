import { Link } from "wouter";
import { useState } from "react";
import {
  Inbox, Sparkles, Bell, MapPin, Mail, BarChart3,
  CheckCircle2, ArrowRight, Star, Menu, X,
} from "lucide-react";
import { SiGoogle, SiZomato, SiTripadvisor } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center text-white font-black shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        background: "linear-gradient(145deg, hsl(25,95%,62%), hsl(22,90%,48%))",
      }}
    >
      S
    </div>
  );
}

const features = [
  {
    icon: Inbox,
    title: "One smart inbox",
    desc: "Google, TripAdvisor, and Zomato reviews all land in one place. No more tab-switching between platforms.",
  },
  {
    icon: Sparkles,
    title: "AI responses that sound human",
    desc: "Get a personalised, on-brand draft in seconds. Read it, tweak it if needed, post it. Done.",
  },
  {
    icon: Bell,
    title: "Instant review alerts",
    desc: "Get notified by email, SMS, or WhatsApp the moment a new review comes in — before it gets buried.",
  },
  {
    icon: MapPin,
    title: "Every location covered",
    desc: "Managing 1 branch or 50, each location gets its own inbox, rating tracker, and response rate.",
  },
  {
    icon: Mail,
    title: "Request reviews from customers",
    desc: "Send a branded email that links directly to your review page — one tap for the customer to leave feedback.",
  },
  {
    icon: BarChart3,
    title: "Analytics that actually help",
    desc: "Track your average rating, response rate, and review volume. See what's working at a glance.",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect your platforms",
    desc: "Link your Google Business, TripAdvisor, and Zomato profiles in under 2 minutes. No technical setup.",
  },
  {
    number: "02",
    title: "Get alerted instantly",
    desc: "Every new review hits your inbox. You see it before you'd have found it manually.",
  },
  {
    number: "03",
    title: "Approve and post",
    desc: "The AI drafts a reply. You approve it, copy it, and post. The whole thing takes 30 seconds.",
  },
];

const pricingFeatures = [
  "All review platforms",
  "AI response generation",
  "Instant email alerts",
  "SMS & WhatsApp alerts",
  "Multi-location management",
  "Customer review requests",
  "Analytics dashboard",
  "Competitor tracking",
  "Embeddable review widget",
  "Weekly digest emails",
];

const testimonials = [
  {
    quote: "We manage 6 hotel properties and Souklick has saved our operations team hours every week. The AI responses are surprisingly good — guests can't tell the difference.",
    name: "Fatima A.",
    role: "Operations Manager, Boutique Hotel Group",
    initials: "FA",
  },
  {
    quote: "I used to dread checking our reviews. Now I actually look forward to it because responding takes no time at all. Our rating went from 3.8 to 4.6 in three months.",
    name: "Ravi M.",
    role: "Owner, Wellness & MedSpa",
    initials: "RM",
  },
  {
    quote: "Finally a tool that actually does what it says. Simple, fast, and the AI doesn't sound robotic. My team adopted it in a day.",
    name: "Sarah K.",
    role: "Marketing Lead, Retail Chain",
    initials: "SK",
  },
];

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="text-[17px] font-bold tracking-tight text-gray-900">Souklick</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm text-gray-600">Sign in</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-5">
                Start free trial
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-5 py-5 flex flex-col gap-4">
            <a href="#features" className="text-sm text-gray-600" onClick={() => setMobileOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-sm text-gray-600" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#pricing" className="text-sm text-gray-600" onClick={() => setMobileOpen(false)}>Pricing</a>
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <Link href="/login"><Button variant="outline" size="sm" className="w-full">Sign in</Button></Link>
              <Link href="/login"><Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white">Start free trial</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section
        className="pt-36 pb-28 px-5"
        style={{ background: "linear-gradient(150deg, hsl(222,22%,10%) 0%, hsl(222,18%,16%) 100%)" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-7 bg-orange-500/15 text-orange-400 border border-orange-500/25 hover:bg-orange-500/15 text-xs px-3 py-1">
            14-day free trial · No credit card required
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-[58px] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            All your customer reviews,{" "}
            <span className="text-orange-400">one smart inbox.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed">
            Souklick brings all your customer reviews into one smart inbox, so you never miss a word that matters.
          </p>
          <p className="text-base text-gray-400 mb-12 max-w-xl mx-auto">
            AI-drafted responses. Instant alerts. Every platform. Built for any business that cares about its reputation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login">
              <Button
                size="lg"
                className="h-12 px-8 text-[15px] bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-900/30 gap-2 font-semibold"
              >
                Start your free trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-[15px] border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white"
              >
                See how it works
              </Button>
            </a>
          </div>

          {/* Platform bar */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-4 bg-white/8 border border-white/10 rounded-full px-6 py-3">
              <span className="text-gray-400 text-sm">Works with</span>
              <div className="flex items-center gap-1.5">
                <SiGoogle className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Google</span>
              </div>
              <span className="text-gray-600">·</span>
              <div className="flex items-center gap-1.5">
                <SiTripadvisor className="w-4 h-4 text-[#00AF87]" />
                <span className="text-white text-sm font-medium">TripAdvisor</span>
              </div>
              <span className="text-gray-600">·</span>
              <div className="flex items-center gap-1.5">
                <SiZomato className="w-4 h-4 text-[#E23744]" />
                <span className="text-white text-sm font-medium">Zomato</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-gray-50 border-y border-gray-100 py-7 px-5">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">30 sec</p>
            <p className="text-sm text-gray-500 mt-0.5">average time to respond</p>
          </div>
          <div className="hidden sm:block w-px h-10 bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-gray-900">3 platforms</p>
            <p className="text-sm text-gray-500 mt-0.5">monitored in one inbox</p>
          </div>
          <div className="hidden sm:block w-px h-10 bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-gray-900">14 days free</p>
            <p className="text-sm text-gray-500 mt-0.5">no card, no commitment</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to own your reputation
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              No bloat. Just the tools that actually move the needle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
                  <f.icon className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-5 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-gray-500 text-lg">Three steps. No IT department required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((s, i) => (
              <div key={s.number} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-full w-8 h-px bg-gray-200 z-0" />
                )}
                <div className="text-5xl font-black text-orange-100 mb-4 leading-none select-none">{s.number}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, honest pricing</h2>
            <p className="text-gray-500 text-lg">Start free. Upgrade when you're ready. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* Free trial */}
            <div className="rounded-2xl border border-gray-200 p-7">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Free Trial</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-gray-900">$0</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">14 days, full access</p>
              <Link href="/login">
                <Button variant="outline" className="w-full mb-7">Start for free</Button>
              </Link>
              <ul className="space-y-3">
                {pricingFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Monthly — featured */}
            <div className="rounded-2xl border-2 border-orange-400 p-7 shadow-xl shadow-orange-100 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-orange-500 text-white border-none px-4 py-1 text-xs font-semibold shadow-md">
                  Most popular
                </Badge>
              </div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Monthly</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-gray-900">$29</span>
                <span className="text-gray-400 text-sm mb-1">/month</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">Billed monthly, cancel anytime</p>
              <Link href="/login">
                <Button className="w-full mb-7 bg-orange-500 hover:bg-orange-600 text-white">Get started</Button>
              </Link>
              <ul className="space-y-3">
                {pricingFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Yearly */}
            <div className="rounded-2xl border border-gray-200 p-7">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Yearly</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-gray-900">$295</span>
                <span className="text-gray-400 text-sm mb-1">/year</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Save $53 vs monthly —{" "}
                <span className="text-green-600 font-medium">2 months free</span>
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full mb-7">Get started</Button>
              </Link>
              <ul className="space-y-3">
                {pricingFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        className="py-24 px-5"
        style={{ background: "linear-gradient(150deg, hsl(222,22%,10%) 0%, hsl(222,18%,16%) 100%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Businesses love it</h2>
            <p className="text-gray-400 text-lg">Real results from real teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col"
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-orange-400 fill-orange-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-7">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-5 bg-orange-500">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start managing your reputation today
          </h2>
          <p className="text-orange-100 text-lg mb-10 leading-relaxed">
            14-day free trial. No credit card. No commitment.<br />
            Just better review management from day one.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="h-12 px-10 text-[15px] bg-white text-orange-500 hover:bg-orange-50 shadow-lg gap-2 font-semibold"
            >
              Start your free trial
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-white font-semibold text-sm">Souklick</span>
          </div>
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Souklick. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login">
              <span className="text-gray-500 text-sm hover:text-white transition-colors cursor-pointer">Sign in</span>
            </Link>
            <Link href="/login">
              <span className="text-gray-500 text-sm hover:text-white transition-colors cursor-pointer">Get started</span>
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
