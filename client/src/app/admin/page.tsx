'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Shield, Lock, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const inputClasses =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200 backdrop-blur';

export default function AdminPage() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!backgroundRef.current) return;

    const ctx = gsap.context(() => {
      const container = backgroundRef.current;
      if (!container) return;

      gsap.set(container, {
        background:
          'radial-gradient(circle at 20% 30%, rgba(79, 70, 229, 0.4), transparent 55%), radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.35), transparent 55%), radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.35), transparent 60%)',
      });

      const pulses = Array.from({ length: 12 }).map(() => {
        const pulse = document.createElement('div');
        pulse.className =
          'absolute w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/10 blur-2xl';
        pulse.style.left = `${Math.random() * 100}%`;
        pulse.style.top = `${Math.random() * 100}%`;
        container.appendChild(pulse);
        gsap.to(pulse, {
          duration: 10 + Math.random() * 10,
          scale: 1.6,
          opacity: 0,
          repeat: -1,
          ease: 'sine.inOut',
          yoyo: true,
        });
        return pulse;
      });

      const shapes = Array.from({ length: 8 }).map(() => {
        const shape = document.createElement('div');
        shape.className =
          'absolute size-20 rounded-3xl border border-white/10 bg-white/10 backdrop-blur pointer-events-none';
        shape.style.left = `${Math.random() * 100}%`;
        shape.style.top = `${Math.random() * 100}%`;
        container.appendChild(shape);
        gsap.to(shape, {
          duration: 12 + Math.random() * 8,
          x: -40 + Math.random() * 80,
          y: -40 + Math.random() * 80,
          rotate: -10 + Math.random() * 20,
          opacity: 0.3,
          repeat: -1,
          ease: 'sine.inOut',
          yoyo: true,
        });
        return shape;
      });

      return () => {
        pulses.forEach((pulse) => pulse.remove());
        shapes.forEach((shape) => shape.remove());
      };
    }, backgroundRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05050f] text-white">
      <div ref={backgroundRef} className="absolute inset-0 overflow-hidden" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/80 via-purple-500/80 to-cyan-500/80 shadow-lg shadow-blue-500/30">
              <Shield className="h-6 w-6" />
              <motion.div
                className="absolute inset-0 rounded-2xl bg-blue-400/30 blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-blue-300/70">Admin Portal</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Manage AI Reporting Operations
              </h1>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition-colors hover:border-blue-400/60 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to app
            </Link>
            <button className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 transition hover:border-blue-400/80 hover:bg-blue-500/20">
              View status
            </button>
          </motion.div>
        </header>

        <main className="flex-1 px-6 pb-16">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
            <motion.section
              className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0.15}
            >
              <motion.div
                className="mb-8 space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                  <Lock className="h-3.5 w-3.5" />
                  Secure access
                </div>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">Administrator Login</h2>
                <p className="text-sm text-gray-300 sm:text-base">
                  Access analytics dashboards, manage user permissions, and configure AI reporting flows.
                </p>
              </motion.div>

              <motion.form
                className="space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="space-y-2">
                  <label htmlFor="admin-email" className="text-sm font-medium text-gray-200">
                    Work email
                  </label>
                  <input id="admin-email" type="email" placeholder="alex@company.com" className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="admin-password" className="text-sm font-medium text-gray-200">
                    Password
                  </label>
                  <input id="admin-password" type="password" placeholder="••••••••" className={inputClasses} />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-300">
                    <input type="checkbox" className="h-4 w-4 rounded border-white/10 bg-transparent text-blue-400 focus:ring-2 focus:ring-blue-500/40" />
                    Remember this device
                  </label>
                  <button type="button" className="text-xs font-medium text-blue-200 transition hover:text-blue-100">
                    Forgot password?
                  </button>
                </div>
                <motion.button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:shadow-blue-500/60"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Sign in securely
                </motion.button>
              </motion.form>

              <motion.div
                className="mt-8 grid gap-4 text-sm text-gray-300 sm:grid-cols-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {[
                  'Real-time pipeline visibility',
                  'Advanced error triage',
                  'Role-based access control',
                  'Predictive alerting suite',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.section>

            <motion.section
              className="flex-1 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 p-8 backdrop-blur"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={0.25}
            >
              <motion.div
                className="mb-8 space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-100">
                  <UserPlus className="h-3.5 w-3.5" />
                  Request access
                </div>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">Register a new admin</h2>
                <p className="text-sm text-gray-200 sm:text-base">
                  Provision privileged access for analysts and platform engineers with detailed audit logging.
                </p>
              </motion.div>

              <motion.form
                className="space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="first-name" className="text-sm font-medium text-gray-100">
                      First name
                    </label>
                    <input id="first-name" type="text" placeholder="Alex" className={inputClasses} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="last-name" className="text-sm font-medium text-gray-100">
                      Last name
                    </label>
                    <input id="last-name" type="text" placeholder="Rivera" className={inputClasses} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium text-gray-100">
                    Role / Team
                  </label>
                  <input id="role" type="text" placeholder="Platform Operations" className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-100">
                    Work email
                  </label>
                  <input id="email" type="email" placeholder="alex@company.com" className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="access-level" className="text-sm font-medium text-gray-100">
                    Access level
                  </label>
                  <select id="access-level" className={`${inputClasses} bg-[#05050f]/60`}>
                    <option className="bg-[#05050f] text-gray-900" value="observer">
                      Observer
                    </option>
                    <option className="bg-[#05050f] text-gray-900" value="editor">
                      Editor
                    </option>
                    <option className="bg-[#05050f] text-gray-900" value="owner">
                      Owner
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium text-gray-100">
                    Notes for compliance team
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Detail the responsibilities and the systems this admin should manage."
                    className={`${inputClasses} resize-none`}
                  />
                </div>
                <motion.button
                  type="submit"
                  className="w-full rounded-xl border border-purple-500/40 bg-purple-500/20 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/40 transition hover:border-purple-400/70 hover:bg-purple-500/30"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Submit registration
                </motion.button>
              </motion.form>

              <motion.div
                className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-gray-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-semibold text-white">What happens next?</p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Compliance team reviews request with a full audit trail.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Automatic provisioning workflow configures necessary pipelines.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    New admins receive onboarding resources and security checklist.
                  </li>
                </ul>
              </motion.div>
            </motion.section>
          </div>
        </main>

        <footer className="px-6 pb-10">
          <motion.div
            className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-3xl border border-white/10 bg-black/30 px-6 py-5 text-xs text-gray-400 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p>
              Securely orchestrating AI-powered reporting for enterprise scale. All sessions are monitored and logged.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span>Last sync: 2 minutes ago</span>
              <span className="hidden h-1 w-1 rounded-full bg-blue-400 sm:inline-block" />
              <span>Version 3.4.2</span>
            </div>
          </motion.div>
        </footer>
      </div>
    </div>
  );
}
