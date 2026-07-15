// ============================================
// Drishti Kavach — Privacy Policy Page
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-navy-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-cyber-cyan hover:text-cyber-gold transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-6 font-orbitron text-glow-cyan">
            Drishti Kavach Privacy Policy
          </h1>
          <p className="text-text-muted mt-2">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        {/* Content */}
        <div className="cyber-card p-6 md:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">1. Introduction</h2>
            <p className="text-text-secondary leading-relaxed">
              Drishti Kavach ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Security Operations Center (SOC) Dashboard and related services.
            </p>
            <p className="text-text-secondary leading-relaxed mt-4">
              By using Drishti Kavach, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not access the platform.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-cyber-cyan">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li><strong>Account Information:</strong> Name, email address, phone number, company details</li>
              <li><strong>Authentication Data:</strong> Login credentials, security questions</li>
              <li><strong>Communication Data:</strong> Messages, inquiries, support tickets</li>
              <li><strong>Website Information:</strong> Domain names, tracking configurations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-cyber-cyan">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li><strong>Usage Data:</strong> IP addresses, browser type, operating system, access times</li>
              <li><strong>Security Events:</strong> Threat detection data, attack patterns, malicious IP addresses</li>
              <li><strong>Website Traffic:</strong> Page views, event logs, form submissions (monitored websites only)</li>
              <li><strong>Technical Data:</strong> Device information, network configurations, API usage</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-cyber-cyan">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li><strong>IP Intelligence:</strong> Geolocation, threat reputation from services like AbuseIPDB, GreyNoise</li>
              <li><strong>Authentication Services:</strong> OAuth providers (if integrated)</li>
              <li><strong>Security Services:</strong> Threat intelligence feeds, CVE databases</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-3 text-text-secondary">
              <li><strong>Service Delivery:</strong> To provide, operate, and maintain our SOC dashboard</li>
              <li><strong>Security Monitoring:</strong> To detect, prevent, and investigate security threats</li>
              <li><strong>User Support:</strong> To respond to your inquiries and provide customer service</li>
              <li><strong>Platform Improvement:</strong> To analyze usage patterns and enhance our services</li>
              <li><strong>Compliance:</strong> To comply with legal obligations and industry standards</li>
              <li><strong>Communication:</strong> To send security alerts, updates, and service notifications</li>
              <li><strong>Multi-Tenant Isolation:</strong> To ensure data separation between different client websites</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">4. Data Security</h2>
            <p className="text-text-secondary leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-text-secondary">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Role-based access control and authentication</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Multi-factor authentication for administrative access</li>
              <li>Secure coding practices and penetration testing</li>
              <li>Data retention policies and secure deletion procedures</li>
            </ul>
          </section>

          {/* Data Sharing and Disclosure */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">5. Data Sharing and Disclosure</h2>
            <p className="text-text-secondary leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-text-secondary">
              <li><strong>Service Providers:</strong> With trusted third parties who assist in operating our platform (e.g., hosting providers, email services)</li>
              <li><strong>Legal Compliance:</strong> When required by law, regulation, or legal process</li>
              <li><strong>Security Cooperation:</strong> With security researchers and threat intelligence communities (anonymized data only)</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share specific information</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">6. Data Retention</h2>
            <p className="text-text-secondary leading-relaxed">
              We retain personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-cyber-cyan/20">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-cyber-cyan">Data Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-cyber-cyan">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-cyan/10">
                  <tr>
                    <td className="px-4 py-3 text-sm text-text-secondary">Account Information</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">Until account deletion + 30 days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-text-secondary">Security Event Logs</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">90 days (active), 180 days (archived)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-text-secondary">Website Traffic Data</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">30 days (active), 90 days (aggregated)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-text-secondary">Backup Data</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">7 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">7. Your Rights</h2>
            <p className="text-text-secondary leading-relaxed">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-text-secondary">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Restriction:</strong> Request restriction of processing your information</li>
              <li><strong>Portability:</strong> Request transfer of your information to another service</li>
              <li><strong>Objection:</strong> Object to processing of your information</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time (where processing is based on consent)</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@drishtikavach.com" className="text-cyber-cyan hover:underline">
                privacy@drishtikavach.com
              </a>
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">8. International Data Transfers</h2>
            <p className="text-text-secondary leading-relaxed">
              Your information may be transferred to, and maintained on, computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">9. Children's Privacy</h2>
            <p className="text-text-secondary leading-relaxed">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">10. Changes to This Policy</h2>
            <p className="text-text-secondary leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">11. Contact Us</h2>
            <p className="text-text-secondary leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none pl-0 space-y-2 mt-4 text-text-secondary">
              <li><strong>Email:</strong> privacy@drishtikavach.com</li>
              <li><strong>Security Concerns:</strong> security@drishtikavach.com</li>
              <li><strong>Data Protection Officer:</strong> dpo@drishtikavach.com</li>
              <li><strong>Address:</strong> Drishti Kavach Security Operations, Privacy Team</li>
            </ul>
          </section>

          {/* Compliance Frameworks */}
          <section className="p-4 border border-cyber-gold/20 bg-cyber-gold/5 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-cyber-gold">Compliance Frameworks</h3>
            <p className="text-text-secondary text-sm">
              Drishti Kavach is designed to support compliance with:
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="px-3 py-1 bg-cyber-cyan/10 text-cyber-cyan text-xs rounded-full">GDPR</span>
              <span className="px-3 py-1 bg-cyber-cyan/10 text-cyber-cyan text-xs rounded-full">DPDP Act</span>
              <span className="px-3 py-1 bg-cyber-cyan/10 text-cyber-cyan text-xs rounded-full">ISO 27001</span>
              <span className="px-3 py-1 bg-cyber-cyan/10 text-cyber-cyan text-xs rounded-full">SOC 2</span>
              <span className="px-3 py-1 bg-cyber-cyan/10 text-cyber-cyan text-xs rounded-full">CCPA</span>
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-cyber-cyan/20 text-center text-text-muted text-sm">
          <p>दृष्टिः रक्षति, रक्षा दृश्यते — "Vision protects, and protection is seen."</p>
          <p className="mt-2">© {new Date().getFullYear()} Drishti Kavach. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link to="/terms" className="text-cyber-cyan hover:text-cyber-gold transition-colors">
              Terms & Conditions
            </Link>
            <a href="#" className="text-cyber-cyan hover:text-cyber-gold transition-colors">
              Data Processing Agreement
            </a>
            <a href="#" className="text-cyber-cyan hover:text-cyber-gold transition-colors">
              Security Overview
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
}