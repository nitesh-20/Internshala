import Link from "next/link";
import React from "react";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const AuthLayout = ({ title, subtitle, children, footer }: Props) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_45%,_#ffffff_100%)] py-16 px-4">
      <div className="mx-auto max-w-5xl rounded-3xl border border-blue-100 bg-white/90 shadow-2xl shadow-blue-100 backdrop-blur">
        <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-blue-50 p-8 md:border-b-0 md:border-r md:p-12">
            <Link href="/" className="inline-flex items-center gap-3 text-blue-700">
              <img src="/logo.png" alt="Internarea" className="h-12 w-auto" />
              <span className="text-lg font-semibold">Internarea Auth</span>
            </Link>

            <div className="mt-10">
              <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                {subtitle}
              </p>
            </div>

            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-6 text-sm text-slate-600">{footer}</div> : null}
          </div>

          <div className="flex flex-col justify-between bg-slate-950 p-8 text-white md:p-12">
            <div>
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">
                Secure Access
              </span>
              <h2 className="mt-6 text-3xl font-bold leading-tight">
                Keep Google sign-in and add full account recovery.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Local accounts now work alongside Firebase Google login, so users can register with email/password, login with email or phone, and recover access safely.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-white">Included in this flow</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>Email/password registration</li>
                <li>Email or phone login</li>
                <li>24-hour forgot-password restriction</li>
                <li>Google sign-in remains unchanged</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
