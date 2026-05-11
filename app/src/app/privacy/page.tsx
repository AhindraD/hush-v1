import Link from 'next/link';
import { ChevronLeft, Lock } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[--bg-base]">
      <TopBar />

      <main className="max-w-3xl mx-auto py-16 px-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-[--text-muted] hover:text-[--text-secondary] mb-12 transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-solana-green/10 text-solana-green">
            <Lock size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-[--text-primary]">Privacy Policy</h1>
            <p className="text-[--text-muted]">Last updated: April 25, 2026</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-[--text-secondary]">
          <section>
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">1. Our Commitment</h2>
            <p className="leading-relaxed">
              HUSH is designed with a "Privacy by Design" philosophy. We do not collect, store, or have access to your personal data, IP addresses, or wallet transaction history.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">2. No Data Collection</h2>
            <p className="leading-relaxed">
              The HUSH interface is a client-side application. Interaction with the protocol happens directly between your browser and the Solana blockchain or the Private Ephemeral Rollup validators. We do not run any analytics trackers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">3. Local Storage</h2>
            <p className="leading-relaxed">
              Any session data, such as your connected wallet address (if opted-in), is stored only in your browser's local storage and never transmitted to any centralized server.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">4. Selective Disclosure</h2>
            <p className="leading-relaxed">
              HUSH uses Umbra and MagicBlock technologies to ensure your transactions are private. Only you (or those you share your Viewing Key with) can decrypt and view your private history.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">5. Third-Party RPCs</h2>
            <p className="leading-relaxed">
              While HUSH doesn't collect data, your interactions with the Solana blockchain are handled by RPC nodes. These third parties may have their own privacy policies.
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-[--border-subtle] text-center">
          <p className="text-sm text-[--text-muted]">
            Your privacy is our priority.
          </p>
        </footer>
      </main>
    </div>
  );
}
