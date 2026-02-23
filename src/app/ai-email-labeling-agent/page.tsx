import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, Inbox, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Email Labeling Agent',
  description:
    'Automatically label incoming Gmail messages into Sponsorship, Collaboration, Business Inquiries, or Others using an AI agent powered by Google Gemini.',
}

const labels = [
  { name: 'Sponsorship', className: 'bg-pink-50 text-pink-700 ring-pink-200' },
  { name: 'Collaboration', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
  {
    name: 'Business Inquiries',
    className: 'bg-lime-50 text-lime-800 ring-lime-200',
  },
  { name: 'Others', className: 'bg-slate-50 text-slate-700 ring-slate-200' },
] as const

const benefits = [
  {
    title: 'Time-saving triage',
    description:
      'Stop manually sorting every message. The inbox is organized the moment an email arrives.',
    icon: Clock,
  },
  {
    title: 'A structured inbox',
    description:
      'Emails are categorized consistently, making follow-ups and searching dramatically easier.',
    icon: Tag,
  },
  {
    title: 'Faster responses',
    description:
      'High-value messages (especially inquiries and partnerships) stand out instantly.',
    icon: CheckCircle2,
  },
] as const

const steps = [
  {
    title: 'Trigger: New Gmail email',
    description:
      'A new message arrives in Gmail and automatically starts the workflow.',
    icon: Inbox,
  },
  {
    title: 'AI processing: Understand intent',
    description:
      'The Labeling AI Agent (powered by Google Gemini) reads the email and identifies the sender’s intent.',
    icon: ArrowRight,
  },
  {
    title: 'Action: Apply the right label',
    description:
      'The email is categorized into one of four labels so you can prioritize what matters.',
    icon: Tag,
  },
] as const

export default function AiEmailLabelingAgentPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              AI for Business — Automation Demo
            </p>

            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              AI Email Labeling Agent
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-slate-700">
              Reduce email overload by automatically labeling incoming Gmail
              messages into Sponsorship, Collaboration, Business Inquiries, or
              Others—within seconds of arrival.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#workflow"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                See the workflow
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#benefits"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Business benefits
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {labels.map((l) => (
                <span
                  key={l.name}
                  className={[
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1',
                    l.className,
                  ].join(' ')}
                >
                  {l.name}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-white/40 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl bg-white/60 p-3 ring-1 ring-slate-200 backdrop-blur">
              <Image
                src="/images/ai-email-labeling-agent-hero.svg"
                alt="Inbox illustration showing automatic email labels"
                width={1200}
                height={800}
                className="h-auto w-full rounded-2xl"
                priority
              />
            </div>
          </div>
        </header>

        <section id="workflow" className="mt-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              The solution & workflow
            </h2>
            <p className="mt-3 text-slate-700">
              The automation is designed to be invisible to the team: every new
              email is processed and labeled before anyone even opens the inbox.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl bg-white/80 p-6 ring-1 ring-slate-200 backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-indigo-50 p-2 ring-1 ring-indigo-100">
                    <s.icon className="h-5 w-5 text-indigo-700" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {s.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="benefits" className="mt-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Business benefits
            </h2>
            <p className="mt-3 text-slate-700">
              This isn’t just “nice to have” automation—it’s a practical way to
              protect revenue opportunities and improve responsiveness.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl bg-white/80 p-6 ring-1 ring-slate-200 backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-sky-50 p-2 ring-1 ring-sky-100">
                    <b.icon className="h-5 w-5 text-sky-700" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {b.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {b.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="rounded-3xl bg-slate-900 px-8 py-10 text-white">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Turn email overload into organized action
                </h2>
                <p className="mt-3 max-w-2xl text-white/80">
                  With consistent labeling on arrival, teams spend less time
                  triaging and more time responding—especially to high-impact
                  inquiries and partnership opportunities.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  Back to home
                </Link>
                <a
                  href="#workflow"
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  Review workflow
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 pb-6 text-center text-sm text-slate-500">
          Built as a simple demo page for an AI Email Labeling Agent workflow.
        </footer>
      </div>
    </main>
  )
}
