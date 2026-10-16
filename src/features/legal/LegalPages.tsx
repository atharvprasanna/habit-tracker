import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export const CONTACT_EMAIL = "atharvprasanna24@gmail.com";
const UPDATED = "16 October 2026";

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to app
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 mb-6 text-xs text-muted-foreground">Last updated: {UPDATED}</p>
        <div className="space-y-5 text-sm leading-relaxed [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <Page title="Privacy Policy">
      <p>Habits Tracker ("the app") helps you track daily habits. This page explains what data we keep and why.</p>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Your name and email address, and a password (stored only as a secure hash by our login provider; we never see it).</li>
          <li>The habits you create and the days you check them off.</li>
          <li>Your display settings, stored on your own device.</li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <p>Only to run the app: to sign you in, show your habits and streaks, and send account emails (email confirmation and password reset). We do not sell your data, show ads, or share it for marketing.</p>
      </section>

      <section>
        <h2>Where it is stored</h2>
        <p>Your data is stored with Supabase (database and login). The website is hosted on Vercel, and account emails are sent through Resend. These providers process data on our behalf. Each user can only access their own rows.</p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>We use browser storage only to keep you signed in and remember your settings. We do not use advertising or tracking cookies.</p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>You can export your habits as a CSV from Settings. To delete your account and all data, email us at the address below and we will remove it.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>Questions or requests: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      </section>
    </Page>
  );
}

export function TermsOfService() {
  return (
    <Page title="Terms of Service">
      <p>By creating an account or using Habits Tracker ("the app"), you agree to these terms.</p>

      <section>
        <h2>Using the app</h2>
        <p>The app is provided free of charge for personal use. You are responsible for keeping your password secure and for activity on your account. You must provide a valid email address.</p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>Do not misuse the service: no attempts to access other users' data, disrupt the service, or use automated means to create accounts or overload it.</p>
      </section>

      <section>
        <h2>Your data</h2>
        <p>Your habit data belongs to you. See the <Link href="/privacy" className="underline">Privacy Policy</Link> for how it is handled.</p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>The app is provided "as is" without guarantees. We try to keep it available and your data safe, but we cannot promise uninterrupted service or that data will never be lost. We may change, suspend or discontinue the app at any time.</p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>You can stop using the app and ask us to delete your account at any time. We may suspend accounts that break these terms.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p><a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      </section>
    </Page>
  );
}
