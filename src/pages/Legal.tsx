import React from 'react';
import { Shield, Lock, Scale, FileText } from 'lucide-react';

export default function Legal() {
  return (
    <div className="space-y-16 py-12 max-w-4xl">
      <div className="space-y-6">
        <h1 className="text-6xl font-bold tracking-tighter text-white">Legal <span className="text-blue-500">Framework</span></h1>
        <p className="text-gray-500 text-lg font-medium leading-relaxed">
          The following documentation outlines the operational boundaries and security protocols of the Yeebs ecosystem. 
          By accessing the grid, you acknowledge and accept these directives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: Shield, title: "Terms of Service", desc: "Operational rules and user responsibilities within the environment." },
          { icon: Lock, title: "Privacy Protocol", desc: "How we handle (or rather, don't handle) your digital presence." },
          { icon: Scale, title: "Compliance", desc: "Alignment with international digital safety standards and protocols." },
          { icon: FileText, title: "DMCA Directive", desc: "Copyright protection and content removal procedures." }
        ].map((item, i) => (
          <div key={i} className="card-subtle p-8 flex flex-col gap-6 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-all group-hover:bg-blue-500/10">
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-20 pt-12">
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[2px] bg-blue-500" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500">Terms of Service</h2>
          </div>
          <div className="space-y-6 text-gray-400 font-medium leading-relaxed">
            <p>1. <span className="text-white">Authorized Use</span>: The Yeebs environment is provided for personal entertainment and educational purposes only. Unauthorized commercial exploitation is strictly prohibited.</p>
            <p>2. <span className="text-white">User Conduct</span>: You agree not to distribute malicious software, harass other users, or attempt to compromise the structural integrity of the grid.</p>
            <p>3. <span className="text-white">Liability</span>: Yeebs Operations provides this platform "as-is". We are not responsible for any digital hallucinations, data corruption, or temporal displacement resulting from use.</p>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[2px] bg-indigo-500" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-500">Privacy Protocol</h2>
          </div>
          <div className="space-y-6 text-gray-400 font-medium leading-relaxed">
            <p>1. <span className="text-white">Data Minimization</span>: We collect the absolute minimum data required to maintain session stability. We do not sell your soul or your browser history to third-party entities.</p>
            <p>2. <span className="text-white">Ephemeral Storage</span>: High-priority user settings and progress are stored locally on your machine. We do not maintain persistent server-side profiles unless explicitly requested.</p>
            <p>3. <span className="text-white">Encryption</span>: All outgoing transmissions are secured with standard high-grade encryption protocols to prevent interception by external hostile actors.</p>
          </div>
        </section>
      </div>

      <footer className="pt-24 pb-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center md:text-left">
          Yeebs Legal Division © 2026<br />
          All Rights Reserved • San Francisco, CA
        </p>
        <div className="flex gap-8 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <a href="#" className="hover:text-blue-500 transition-colors">Cookie Policy</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Contact Legal</a>
        </div>
      </footer>
    </div>
  );
}
