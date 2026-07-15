// ============================================
// Drishti Kavach — Terms & Conditions Page
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsConditions() {
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
            Drishti Kavach Terms & Conditions
          </h1>
          <p className="text-text-muted mt-2">
            Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-cyber-cyan/10 text-cyber-cyan text-xs rounded-full">Legal Agreement</span>
            <span className="px-3 py-1 bg-cyber-gold/10 text-cyber-gold text-xs rounded-full">Service Terms</span>
            <span className="px-3 py-1 bg-cyber-cyan/10 text-cyber-cyan text-xs rounded-full">Acceptable Use</span>
          </div>
        </header>

        {/* Content */}
        <div className="cyber-card p-6 md:p-8 space-y-8">
          
          {/* Agreement Section */}
          <section className="p-4 border border-cyber-cyan/20 bg-cyber-cyan/5 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-cyber-cyan mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-cyber-cyan">Important Legal Notice</h3>
                <p className="text-text-secondary text-sm mt-1">
                  By accessing or using Drishti Kavach, you agree to be bound by these Terms & Conditions. Please read them carefully before using our services.
                </p>
              </div>
            </div>
          </section>

          {/* 1. Definitions */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">1. Definitions</h2>
            <div className="space-y-3 text-text-secondary">
              <p><strong>"Service"</strong> refers to the Drishti Kavach Security Operations Center (SOC) Dashboard and all related features.</p>
              <p><strong>"User"</strong> refers to any individual or entity accessing or using the Service.</p>
              <p><strong>"Client Website"</strong> refers to any website monitored through the Service.</p>
              <p><strong>"Data"</strong> includes all information processed through the Service, including security events, logs, and user information.</p>
              <p><strong>"API"</strong> refers to the Application Programming Interface provided by Drishti Kavach.</p>
            </div>
          </section>

          {/* 2. Account Terms */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">2. Account Terms</h2>
            <div className="space-y-4 text-text-secondary">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-cyber-cyan">2.1 Eligibility</h3>
                <p>You must be at least 18 years old and have the legal capacity to enter into this agreement. By creating an account, you represent that you meet these requirements.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-cyber-cyan">2.2 Account Security</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-cyber-cyan">2.3 Account Termination</h3>
                <p>We reserve the right to suspend or terminate accounts that violate these terms, pose security risks, or engage in abusive behavior. You may terminate your account at any time through the dashboard settings.</p>
              </div>
            </div>
          </section>

          {/* 3. Service Description */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">3. Service Description</h2>
            <div className="space-y-4 text-text-secondary">
              <p>Drishti Kavach provides a comprehensive Security Operations Center (SOC) Dashboard that includes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Real-time security event monitoring and threat detection</li>
                <li>DDoS attack detection and mitigation capabilities</li>
                <li>IP address management and threat intelligence</li>
                <li>Form submission monitoring and validation</li>
                <li>Multi-tenant website monitoring</li>
                <li>AI-powered threat analysis and incident response</li>
                <li>Compliance reporting and audit logging</li>
              </ul>
              <p>The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue any features at any time.</p>
            </div>
          </section>

          {/* 4. Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">4. Acceptable Use</h2>
            <div className="space-y-4 text-text-secondary">
              <p>You agree not to use the Service for any unlawful or prohibited purposes, including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Monitoring websites without proper authorization</li>
                <li>Conducting security testing on systems you do not own or have permission to test</li>
                <li>Attempting to bypass or circumvent security measures</li>
                <li>Using the Service to harass, threaten, or harm others</li>
                <li>Reverse engineering, decompiling, or disassembling any part of the Service</li>
                <li>Using automated systems to access the Service in a manner that sends more request messages than a human could reasonably produce</li>
                <li>Uploading or transmitting viruses, malware, or any other malicious code</li>
              </ul>
              <p>Violation of these acceptable use terms may result in immediate account termination and legal action.</p>
            </div>
          </section>

          {/* 5. Data Protection and Privacy */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">5. Data Protection and Privacy</h2>
            <div className="space-y-4 text-text-secondary">
              <p>Our Privacy Policy governs the collection, use, and disclosure of your information. By using the Service, you consent to such processing and you warrant that all data provided by you is accurate.</p>
              <p>As a security monitoring service, we process security-related data from monitored websites. You are responsible for ensuring you have proper legal basis and necessary consents for such monitoring.</p>
            </div>
          </section>

          {/* 6. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">6. Intellectual Property</h2>
            <div className="space-y-4 text-text-secondary">
              <p>The Service and its original content, features, and functionality are owned by Drishti Kavach and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
              <p>You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service for your internal business purposes.</p>
              <p>You retain all rights to the data you upload to the Service. By uploading data, you grant us a license to process and analyze it to provide the Service.</p>
            </div>
          </section>

          {/* 7. Service Limitations */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">7. Service Limitations</h2>
            <div className="space-y-4 text-text-secondary">
              <div className="p-4 border border-cyber-gold/20 bg-cyber-gold/5 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-cyber-gold">Important Disclaimer</h3>
                <p className="text-sm">Drishti Kavach is a security monitoring tool and does not guarantee complete protection against all security threats. Users should implement comprehensive security measures beyond those provided by this Service.</p>
              </div>
              <p>The Service may be subject to limitations, delays, and other problems inherent in the use of the internet and electronic communications. We are not responsible for any delays, delivery failures, or other damage resulting from such problems.</p>
              <p>Free tier limitations apply as described in our pricing documentation. We reserve the right to modify or discontinue free tier features at any time.</p>
            </div>
          </section>

          {/* 8. Payment and Billing */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">8. Payment and Billing</h2>
            <div className="space-y-4 text-text-secondary">
              <p>Certain features of the Service may require payment. By selecting a paid plan, you agree to pay the specified fees on a recurring basis.</p>
              <p>Payments are non-refundable. We may change our fees at any time by providing notice, which may be sent by email or posted on the Service.</p>
              <p>If your payment method fails or your account is past due, we may suspend or terminate your access to paid features.</p>
            </div>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">9. Limitation of Liability</h2>
            <div className="space-y-4 text-text-secondary">
              <p>To the maximum extent permitted by law, Drishti Kavach shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your access to or use of or inability to access or use the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              </ul>
              <p>Our total liability for any claim under these terms shall not exceed the amount you have paid us in the last twelve months.</p>
            </div>
          </section>

          {/* 10. Indemnification */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">10. Indemnification</h2>
            <div className="text-text-secondary">
              <p>You agree to defend, indemnify, and hold harmless Drishti Kavach and its affiliates, officers, agents, and employees from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Your use of and access to the Service</li>
                <li>Your violation of any term of these Terms & Conditions</li>
                <li>Your violation of any third-party right, including without limitation any copyright, property, or privacy right</li>
                <li>Any claim that your data caused damage to a third party</li>
              </ul>
            </div>
          </section>

          {/* 11. Governing Law */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">11. Governing Law</h2>
            <div className="text-text-secondary">
              <p>These Terms & Conditions shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
              <p className="mt-3">Any dispute arising from or relating to these Terms & Conditions shall be subject to the exclusive jurisdiction of the courts located in New Delhi, India.</p>
            </div>
          </section>

          {/* 12. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">12. Changes to Terms</h2>
            <div className="text-text-secondary">
              <p>We reserve the right, at our sole discretion, to modify or replace these Terms & Conditions at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.</p>
              <p className="mt-3">By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
            </div>
          </section>

          {/* 13. Contact Information */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-cyber-gold">13. Contact Information</h2>
            <div className="text-text-secondary space-y-3">
              <p>If you have any questions about these Terms & Conditions, please contact us:</p>
              <div className="p-4 border border-cyber-cyan/20 bg-cyber-cyan/5 rounded-lg">
                <p><strong>Legal Department:</strong> legal@drishtikavach.com</p>
                <p className="mt-2"><strong>General Inquiries:</strong> support@drishtikavach.com</p>
                <p className="mt-2"><strong>Security Reports:</strong> security@drishtikavach.com</p>
                <p className="mt-2"><strong>Address:</strong> Drishti Kavach Legal Department, Security Operations Center</p>
              </div>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="p-4 border border-cyber-gold/20 bg-cyber-gold/5 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-cyber-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-cyber-gold">Acknowledgement</h3>
                <p className="text-text-secondary text-sm mt-1">
                  By using Drishti Kavach, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-cyber-cyan/20 text-center text-text-muted text-sm">
          <p>दृष्टिः रक्षति, रक्षा दृश्यते — "Vision protects, and protection is seen."</p>
          <p className="mt-2">© {new Date().getFullYear()} Drishti Kavach. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link to="/privacy" className="text-cyber-cyan hover:text-cyber-gold transition-colors">
              Privacy Policy
            </Link>
            <a href="#" className="text-cyber-cyan hover:text-cyber-gold transition-colors">
              Service Level Agreement
            </a>
            <a href="#" className="text-cyber-cyan hover:text-cyber-gold transition-colors">
              Acceptable Use Policy
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
}