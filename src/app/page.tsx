"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  Leaf,
  ArrowRight,
  Utensils,
  Users,
  Truck,
  ShieldCheck,
  Bell,
  Brain,
  Zap,
  Heart,
  ChevronRight,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";

const roleHome: Record<string, string> = {
  ngo: "/ngo",
  restaurant: "/restaurant",
  volunteer: "/volunteer",
  admin: "/admin",
  beneficiary: "/beneficiary",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function NavBar() {
  const { user, appUser } = useAuth();
  const dashboardHref = appUser ? roleHome[appUser.role] : "/login";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-[#1D9E75] text-lg">
          <div className="h-8 w-8 rounded-xl bg-[#1D9E75] flex items-center justify-center">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          ZeroHunger
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <a href="#how-it-works" className="hover:text-slate-900 transition">How it works</a>
          <a href="#agents" className="hover:text-slate-900 transition">Agents</a>
          <a href="#roles" className="hover:text-slate-900 transition">Who it's for</a>
          <a href="#impact" className="hover:text-slate-900 transition">Impact</a>
        </nav>
        <div className="flex items-center gap-3">
          {user && appUser ? (
            <Link
              href={dashboardHref}
              className="flex items-center gap-1.5 bg-[#1D9E75] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#178a63] transition"
            >
              Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition">
                Sign in
              </Link>
              <Link
                href="/login"
                className="bg-[#1D9E75] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#178a63] transition"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-bold text-[#1D9E75]">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  desc,
  color,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="h-0.5 w-8 bg-slate-200 hidden md:block absolute translate-x-32" />
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Step {step}
        </p>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1.5 max-w-xs">{desc}</p>
      </div>
    </div>
  );
}

function AgentCard({
  icon,
  name,
  role,
  features,
  color,
}: {
  icon: React.ReactNode;
  name: string;
  role: string;
  features: string[];
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900">{name}</h3>
      <p className="text-xs text-slate-500 mt-0.5 mb-4">{role}</p>
      <ul className="space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-[#1D9E75] flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  desc,
  actions,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  actions: string[];
  href: string;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:border-[#1D9E75]/30 hover:shadow-md transition-all">
      <div className="h-12 w-12 rounded-xl bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-4">{desc}</p>
      <ul className="space-y-1.5 mb-5">
        {actions.map((a) => (
          <li key={a} className="flex items-center gap-2 text-sm text-slate-600">
            <ChevronRight className="h-3.5 w-3.5 text-[#EF9F27]" />
            {a}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1D9E75] group-hover:gap-2.5 transition-all"
      >
        Join as {title} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 bg-gradient-to-b from-[#f0faf6] to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#1D9E75]/10 text-[#1D9E75] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="h-3.5 w-3.5" />
            AI-powered food redistribution · Live in India
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
            Surplus food finds its way{" "}
            <span className="text-[#1D9E75]">to those who need it</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            ZeroHunger connects restaurants with surplus food to NGOs and beneficiaries — automatically,
            in real time, with zero waste and zero friction.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-[#1D9E75] text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-[#178a63] transition text-base w-full sm:w-auto justify-center"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 border border-slate-200 text-slate-700 font-medium px-8 py-3.5 rounded-2xl hover:bg-slate-50 transition text-base w-full sm:w-auto justify-center"
            >
              See how it works
            </a>
          </div>

          {/* Trust bar */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            {["Phone OTP login", "Real-time matching", "Multi-role platform", "Zero-waste mission"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1D9E75]" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className="max-w-3xl mx-auto mt-16 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="bg-[#1D9E75] px-6 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              {["bg-red-400","bg-yellow-400","bg-green-400"].map(c=><div key={c} className={`h-3 w-3 rounded-full ${c}`}/>)}
            </div>
            <span className="text-white/70 text-xs ml-2 font-mono">zerohunger.app — Live flow</span>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4">
            {[
              { label: "New request", sub: "Asha Foundation · 80 servings", color: "bg-blue-50 border-blue-100", dot: "bg-blue-400", status: "Pending" },
              { label: "Match found!", sub: "Hotel Taj · 100 servings · 2km", color: "bg-amber-50 border-amber-100", dot: "bg-[#EF9F27]", status: "Matched" },
              { label: "Delivered ✓", sub: "Volunteer Rahul · 14 min", color: "bg-emerald-50 border-emerald-100", dot: "bg-[#1D9E75]", status: "Done" },
            ].map((card) => (
              <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-2 w-2 rounded-full ${card.dot}`} />
                  <span className="text-xs font-semibold text-slate-700">{card.status}</span>
                </div>
                <p className="text-sm font-medium text-slate-900">{card.label}</p>
                <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6">
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#1D9E75]/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-[#1D9E75]" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700">Coordinator agent</p>
                <p className="text-xs text-slate-400">Matched request → listing in 1.2s · Dispatch triggered</p>
              </div>
              <div className="ml-auto h-2 w-2 rounded-full bg-[#1D9E75] animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="impact" className="py-16 px-4 sm:px-6 bg-[#1D9E75]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "10,000+", label: "Meals redistributed" },
            { value: "< 15 min", label: "Average delivery time" },
            { value: "200+", label: "Partner restaurants" },
            { value: "50+", label: "NGOs onboarded" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-white/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#EF9F27] uppercase tracking-widest mb-2">The flow</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">From surplus to served in 4 steps</h2>
            <p className="text-slate-500 mt-3 text-lg">Fully automated. No calls, no paperwork, no waste.</p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-10">
            {[
              {
                step: "1", icon: <Utensils className="h-7 w-7 text-[#EF9F27]" />,
                color: "bg-amber-50",
                title: "Restaurant posts surplus",
                desc: "Add your leftover food in 30 seconds — quantity, type, expiry time.",
              },
              {
                step: "2", icon: <Brain className="h-7 w-7 text-[#1D9E75]" />,
                color: "bg-emerald-50",
                title: "AI matches instantly",
                desc: "The Coordinator agent finds the highest-priority NGO and creates a match.",
              },
              {
                step: "3", icon: <Bell className="h-7 w-7 text-blue-500" />,
                color: "bg-blue-50",
                title: "One-tap approval",
                desc: "Restaurant gets notified and approves with a single tap. SLA: 5 minutes.",
              },
              {
                step: "4", icon: <Truck className="h-7 w-7 text-violet-500" />,
                color: "bg-violet-50",
                title: "Volunteer delivers",
                desc: "Nearest volunteer is dispatched. Food reaches beneficiaries in under 15 minutes.",
              },
            ].map((s) => (
              <StepCard key={s.step} {...s} />
            ))}
          </div>
          {/* Connector line */}
          <div className="hidden md:block absolute w-3/4 h-0.5 bg-gradient-to-r from-amber-200 via-emerald-200 to-violet-200 left-1/2 -translate-x-1/2 mt-8 pointer-events-none" />
        </div>
      </section>

      {/* ── Agents ── */}
      <section id="agents" className="py-20 px-4 sm:px-6 bg-[#f8faf9]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1D9E75] uppercase tracking-widest mb-2">Under the hood</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Six AI agents, one mission</h2>
            <p className="text-slate-500 mt-3 text-lg max-w-xl mx-auto">
              Each agent handles one job, does it perfectly, and hands off to the next.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AgentCard
              icon={<Brain className="h-6 w-6 text-[#1D9E75]" />}
              color="bg-emerald-50"
              name="Coordinator Agent"
              role="The central brain"
              features={[
                "Routes requests to best supply match",
                "Manages agent-to-agent messaging",
                "Handles timeouts and fallback escalation",
                "Logs every decision with full audit trail",
              ]}
            />
            <AgentCard
              icon={<Utensils className="h-6 w-6 text-amber-500" />}
              color="bg-amber-50"
              name="Supply Agent"
              role="Monitors all food listings"
              features={[
                "Real-time inventory of all surplus",
                "Scores listings by expiry and quantity",
                "Pings restaurant for approval",
                "Auto-alerts before food expires",
              ]}
            />
            <AgentCard
              icon={<Users className="h-6 w-6 text-blue-500" />}
              color="bg-blue-50"
              name="Demand Agent"
              role="Manages NGO requests"
              features={[
                "Queues and ranks requests by urgency",
                "Splits large requests across sources",
                "Sends confirmation to requesting NGO",
                "Tracks fulfilment rate per NGO",
              ]}
            />
            <AgentCard
              icon={<Bell className="h-6 w-6 text-violet-500" />}
              color="bg-violet-50"
              name="Notification Agent"
              role="Multi-channel comms"
              features={[
                "In-app real-time notifications",
                "WhatsApp for donors & NGOs (Phase 2)",
                "Voice calls for urgent confirmations",
                "SMS/USSD for low-data beneficiaries",
              ]}
            />
            <AgentCard
              icon={<Truck className="h-6 w-6 text-teal-500" />}
              color="bg-teal-50"
              name="Dispatch Agent"
              role="Volunteer coordination"
              features={[
                "Geo-matches volunteer to pickup",
                "Sends route via WhatsApp",
                "Live ETA tracking",
                "Auto-reassigns if volunteer cancels",
              ]}
            />
            <AgentCard
              icon={<ShieldCheck className="h-6 w-6 text-red-500" />}
              color="bg-red-50"
              name="Escalation Agent"
              role="Safety net for failures"
              features={[
                "Watches SLA timers per workflow step",
                "Escalates to admin with one-tap actions",
                "Finds alternative NGO if first declines",
                "Post-mortem logging for every failure",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section id="roles" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#EF9F27] uppercase tracking-widest mb-2">Roles</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Built for everyone in the chain</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <RoleCard
              icon={<Utensils className="h-5 w-5" />}
              title="Restaurant"
              desc="Turn your daily surplus into impact. Takes 30 seconds to post."
              actions={["Post surplus in 30s", "One-tap approve requests", "Track your donations"]}
              href="/login"
            />
            <RoleCard
              icon={<Heart className="h-5 w-5" />}
              title="NGO"
              desc="Request food for your beneficiaries and get matched instantly."
              actions={["Submit food requests", "Track live deliveries", "View fulfilment history"]}
              href="/login"
            />
            <RoleCard
              icon={<Truck className="h-5 w-5" />}
              title="Volunteer"
              desc="Pick up and deliver food on your schedule. See open pickups nearby."
              actions={["Accept open deliveries", "Navigate with Google Maps", "Build impact streak"]}
              href="/login"
            />
            <RoleCard
              icon={<Brain className="h-5 w-5" />}
              title="Admin"
              desc="Monitor the whole network. Resolve escalations, view analytics."
              actions={["Live escalation console", "Unmatched request queue", "System health overview"]}
              href="/login"
            />
          </div>
        </div>
      </section>

      {/* ── Testimonial / Mission ── */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-[#1D9E75] to-[#178a63]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-white/10 items-center justify-center mb-6">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <blockquote className="text-2xl sm:text-3xl font-medium text-white leading-relaxed">
            "1/3 of all food produced globally is wasted — while 800 million people go hungry every day.
            We built ZeroHunger to close that gap, one meal at a time."
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-1">
            {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-[#EF9F27] text-[#EF9F27]" />)}
          </div>
          <p className="text-white/60 text-sm mt-2">ZeroHunger Mission Statement</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Ready to end food waste in your city?
          </h2>
          <p className="text-slate-500 mt-4 text-lg">
            Join restaurants, NGOs, and volunteers already using ZeroHunger.
            Sign up in 60 seconds — just your phone number.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-[#1D9E75] text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-[#178a63] transition text-base w-full sm:w-auto justify-center"
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 border border-slate-200 text-slate-700 font-medium px-8 py-3.5 rounded-2xl hover:bg-slate-50 transition text-base w-full sm:w-auto justify-center"
            >
              Sign in
            </Link>
          </div>
          <p className="text-slate-400 text-xs mt-5">
            No app download required · Works on any device · Phone OTP only
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-10 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-[#1D9E75]">
            <div className="h-7 w-7 rounded-lg bg-[#1D9E75] flex items-center justify-center">
              <Leaf className="h-3.5 w-3.5 text-white" />
            </div>
            ZeroHunger
          </div>
          <p className="text-sm text-slate-400 text-center">
            Built with Next.js · Firebase · Claude AI · Deployed with love
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link href="/login" className="hover:text-slate-900 transition">Sign in</Link>
            <a href="#how-it-works" className="hover:text-slate-900 transition">How it works</a>
            <a href="#roles" className="hover:text-slate-900 transition">Roles</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
