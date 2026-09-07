import Link from 'next/link';
import Image from 'next/image';
import { MapPin, PhoneCall, Mail } from 'lucide-react';

export default function SngplFooter() {
  return (
    <footer id="contact" className="sngpl-section-padding" style={{ background: '#0f172a', color: '#cbd5e1', padding: '48px 24px 24px 24px', borderTop: '1px solid #1e293b', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        <div className="sngpl-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '36px' }}>

          {/* Col 1 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Image
                src="/sngpl-logo.png"
                alt="SNGPL"
                width={36}
                height={36}
              />
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>SUI NORTHERN</div>
                <div style={{ fontSize: '10px', color: '#38bdf8' }}>Gas Pipelines Limited</div>
              </div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '12.5px', lineHeight: '1.6' }}>
              Serving over 7.22 million consumers across Punjab, Khyber Pakhtunkhwa, and Islamabad Capital Territory.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', marginBottom: '12px' }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <li><Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home Portal</Link></li>
              <li><Link href="/#bill-inquiry" style={{ color: '#94a3b8', textDecoration: 'none' }}>Consumer Bill Inquiry</Link></li>
              <li><Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>Staff Login</Link></li>
              <li><Link href="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>Register Staff</Link></li>
              <li><Link href="/register/executive" style={{ color: '#0d9488', textDecoration: 'none', fontWeight: '600' }}>Executive Registry</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', marginBottom: '12px' }}>
              Regional Centers
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
              <li>• Lahore: 21-Kashmir Road</li>
              <li>• Islamabad / Rawalpindi: Sector I-9</li>
              <li>• Peshawar: Phase-V, Hayatabad</li>
              <li>• Faisalabad: Sargodha Road</li>
              <li>• Multan: Piran Ghaib Road</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', marginBottom: '12px' }}>
              Head Office
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: '#94a3b8' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" style={{ marginTop: '2px' }} />
                <span>Gas House, 21-Kashmir Road, Lahore</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <PhoneCall className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Helpline: 1199 (24/7)</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>info@sngpl.com.pk</span>
              </div>
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: '#64748b' }}>
          <span>© {new Date().getFullYear()} Sui Northern Gas Pipelines Limited. Listed on PSX (SNGP).</span>
          <span>Emergency 24/7 Helpline: 1199</span>
        </div>

      </div>
    </footer>
  );
}
