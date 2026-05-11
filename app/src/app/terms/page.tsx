import Link from 'next/link';
import { ChevronLeft, Scale } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export default function TermsPage() {
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
          <div className="p-3 rounded-2xl bg-hush-violet/10 text-hush-violet-300">
            <Scale size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-[--text-primary]">Terms of Service</h1>
            <p className="text-[--text-muted]">Last updated: April 25, 2026</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-[--text-secondary]">
          <section>
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">1. Agreement to Terms</h2>
            <p className="leading-relaxed">
              By accessing or using HUSH Protocol, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service. HUSH is a decentralized protocol; your use of it is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">2. The Protocol</h2>
            <p className="leading-relaxed">
              HUSH provides a user interface to interact with smart contracts on the Solana blockchain. HUSH does not control the underlying blockchain or the smart contracts themselves. The protocol is provided "as is" without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">3. User Responsibility</h2>
            <p className="leading-relaxed">
              You are responsible for your own funds and private keys. We cannot recover lost keys or reverse transactions. You agree to comply with all applicable laws and regulations in your jurisdiction regarding the use of privacy-enhancing technology.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">4. Compliance & Selective Disclosure</h2>
            <p className="leading-relaxed">
              While HUSH provides privacy features, users are provided with Viewing Keys and ZK-Tax-Receipt features to remain compliant with their local tax authorities. Use of HUSH for illegal activities is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[--text-primary] mb-4">5. Limitation of Liability</h2>
            <p className="leading-relaxed">
              In no event shall HUSH Protocol, its developers, or contributors be liable for any damages arising out of or in connection with the use of the protocol.
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-[--border-subtle] text-center">
          <p className="text-sm text-[--text-muted]">
            Questions? Contact us on <a href="https://x.com/Ahindra_D" className="text-hush-violet-300 hover:underline">Twitter</a>.
          </p>
        </footer>
      </main>
    </div>
  );
}
