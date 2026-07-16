import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DMCA Policy - FreeDiscountCoupons',
  description: 'DMCA Policy for FreeDiscountCoupons.com. Learn about copyright protection and how to submit DMCA notices.',
  robots: { index: true, follow: true },
};

export default function DMCAPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">DMCA Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: July 16, 2026</p>

        <div className="prose prose-gray max-w-none">
          <p>
            FreeDiscountCoupons.com respects the intellectual property rights of others and expects users, contributors, and third parties to do the same.
          </p>
          <p>
            In accordance with the Digital Millennium Copyright Act (&ldquo;DMCA&rdquo;), we will respond promptly to valid copyright infringement claims and take appropriate action when necessary.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Copyright Ownership</h2>
          <p>
            All original content published on FreeDiscountCoupons.com, including text, website design, graphics, logos, and proprietary materials, is protected by applicable copyright and intellectual property laws.
          </p>
          <p>
            Trademarks, brand names, logos, and other third-party materials appearing on the website remain the property of their respective owners.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Reporting Copyright Infringement</h2>
          <p>
            If you believe that copyrighted material has been copied or used on FreeDiscountCoupons.com in a way that constitutes copyright infringement, please submit a written DMCA notice containing the following information:
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Required Information</h3>
          <ol className="list-decimal pl-6 space-y-1 text-gray-700">
            <li>Your full name and contact information.</li>
            <li>A description of the copyrighted work claimed to have been infringed.</li>
            <li>The exact URL or location of the allegedly infringing material.</li>
            <li>A statement that you have a good-faith belief that the use is not authorized by the copyright owner, agent, or applicable law.</li>
            <li>A statement that the information in the notice is accurate.</li>
            <li>A statement made under penalty of perjury that you are authorized to act on behalf of the copyright owner.</li>
            <li>Your physical or electronic signature.</li>
          </ol>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">DMCA Notice Submission</h2>
          <p>DMCA notices should be sent to:</p>
          <p className="font-semibold text-gray-900">DMCA Agent</p>
          <p>FreeDiscountCoupons.com</p>
          <p>
            Email: <a href="mailto:info@whizadsbay.com" className="text-blue-600 hover:underline">info@whizadsbay.com</a>
          </p>
          <p>
            Subject Line: <strong>DMCA Copyright Notice</strong>
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Review Process</h2>
          <p>Upon receiving a valid DMCA notice, we may:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Review the complaint.</li>
            <li>Investigate the reported content.</li>
            <li>Temporarily remove or disable access to the material.</li>
            <li>Contact the content provider if necessary.</li>
            <li>Take additional actions deemed appropriate under applicable law.</li>
          </ul>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Counter-Notification Procedure</h2>
          <p>
            If you believe material was removed or disabled in error, you may submit a counter-notification containing:
          </p>
          <ol className="list-decimal pl-6 space-y-1 text-gray-700">
            <li>Your name, address, telephone number, and email address.</li>
            <li>Identification of the material that was removed.</li>
            <li>The location where the material appeared before removal.</li>
            <li>A statement under penalty of perjury that you have a good-faith belief the material was removed due to mistake or misidentification.</li>
            <li>A statement consenting to the jurisdiction of the appropriate court.</li>
            <li>Your physical or electronic signature.</li>
          </ol>
          <p>Counter-notifications may be submitted to:</p>
          <p>
            Email: <a href="mailto:info@whizadsbay.com" className="text-blue-600 hover:underline">info@whizadsbay.com</a>
          </p>
          <p>
            Subject Line: <strong>DMCA Counter Notification</strong>
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Repeat Infringer Policy</h2>
          <p>
            FreeDiscountCoupons.com reserves the right to remove content and restrict access for users or contributors who repeatedly infringe intellectual property rights.
          </p>
          <p>
            We may terminate access to the website for repeat offenders where appropriate.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Good-Faith Requirement</h2>
          <p>
            Submitting false or misleading DMCA notices or counter-notifications may result in legal liability.
          </p>
          <p>
            Parties should ensure all information submitted is accurate and truthful.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Modifications to This Policy</h2>
          <p>
            We reserve the right to modify this DMCA Policy at any time.
          </p>
          <p>
            Any updates will be posted on this page with a revised &ldquo;Last Updated&rdquo; date.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Information</h2>
          <p>For copyright-related inquiries, please contact:</p>
          <p className="font-semibold text-gray-900">FreeDiscountCoupons.com</p>
          <p>
            Email: <a href="mailto:info@whizadsbay.com" className="text-blue-600 hover:underline">info@whizadsbay.com</a>
          </p>
        </div>
      </div>
    </main>
  );
}
