import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use - FreeDiscountCoupons',
  description: 'Terms of Use for FreeDiscountCoupons.com. Read our terms and conditions before using the website.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: July 16, 2026</p>

        <div className="prose prose-gray max-w-none">
          <p>
            Welcome to FreeDiscountCoupons.com (&ldquo;Website&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
          </p>
          <p>
            These Terms of Use govern your access to and use of FreeDiscountCoupons.com. By accessing or using this website, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please discontinue use of the website.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">About FreeDiscountCoupons.com</h2>
          <p>FreeDiscountCoupons.com is an informational website that provides:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Coupon codes</li>
            <li>Promotional offers</li>
            <li>Discounts</li>
            <li>Deals</li>
            <li>Sales information</li>
            <li>Shopping-related content</li>
            <li>Affiliate links to third-party merchants</li>
          </ul>
          <p>We do not sell products directly unless explicitly stated.</p>
          <p>All purchases are completed on third-party merchant websites.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Acceptance of Terms</h2>
          <p>By accessing this website, you confirm that:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>You are at least 13 years of age.</li>
            <li>You have the legal capacity to enter into agreements.</li>
            <li>You agree to comply with these Terms of Use.</li>
            <li>You will not use the website for unlawful purposes.</li>
          </ul>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Use of Website</h2>
          <p>You agree to use FreeDiscountCoupons.com only for lawful purposes.</p>
          <p>You shall not:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Attempt to gain unauthorized access to the website.</li>
            <li>Interfere with website functionality.</li>
            <li>Use automated systems to scrape, harvest, or extract content without permission.</li>
            <li>Upload malicious software, viruses, or harmful code.</li>
            <li>Misrepresent your identity or affiliation.</li>
            <li>Use the website in a manner that could damage its operation or reputation.</li>
          </ul>
          <p>We reserve the right to restrict or terminate access to users who violate these Terms.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Coupon and Offer Information</h2>
          <p>We strive to keep all coupons, discounts, and promotional offers accurate and up to date.</p>
          <p>However:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Coupons may expire without notice.</li>
            <li>Merchants may modify or cancel promotions at any time.</li>
            <li>Offer availability may vary by location, account status, or eligibility.</li>
            <li>We cannot guarantee that every coupon or promotion will work for every user.</li>
          </ul>
          <p>Users should always review the merchant&rsquo;s official terms and conditions before making a purchase.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">No Guarantee of Savings</h2>
          <p>While we aim to help users save money, we do not guarantee:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Any specific discount amount</li>
            <li>Coupon validity</li>
            <li>Product availability</li>
            <li>Merchant participation</li>
            <li>Successful redemption of promotional offers</li>
          </ul>
          <p>All shopping decisions are made solely at the user&rsquo;s discretion.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Affiliate Relationships</h2>
          <p>FreeDiscountCoupons.com participates in various affiliate marketing programs.</p>
          <p>When users click certain links and make purchases, we may earn commissions from merchants or affiliate networks at no additional cost to the user.</p>
          <p>Affiliate relationships do not influence our commitment to presenting useful and relevant offers.</p>
          <p>For additional information, please review our Affiliate Disclosure page.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Third-Party Websites</h2>
          <p>The website contains links to external websites operated by third parties.</p>
          <p>We do not:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Own those websites</li>
            <li>Control their content</li>
            <li>Control their privacy practices</li>
            <li>Control their products or services</li>
          </ul>
          <p>Your interactions with third-party websites are governed by their own terms, policies, and practices.</p>
          <p>FreeDiscountCoupons.com is not responsible for any losses, damages, disputes, or issues arising from third-party websites.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Intellectual Property</h2>
          <p>Unless otherwise stated, all content on FreeDiscountCoupons.com is owned by or licensed to us, including:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Website design</li>
            <li>Logos</li>
            <li>Text content</li>
            <li>Graphics</li>
            <li>Images</li>
            <li>Databases</li>
            <li>Custom tools and features</li>
          </ul>
          <p>You may not:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Copy substantial portions of website content</li>
            <li>Republish website materials</li>
            <li>Sell or redistribute content</li>
            <li>Create derivative works without written permission</li>
          </ul>
          <p>Store names, logos, and trademarks displayed on the website remain the property of their respective owners.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">User Submissions</h2>
          <p>If you submit comments, suggestions, feedback, or other content to us:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>You grant us a non-exclusive, worldwide, royalty-free license to use, modify, publish, and display such content.</li>
            <li>You represent that your submissions do not violate any third-party rights.</li>
            <li>We reserve the right to remove any submission at our discretion.</li>
          </ul>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Disclaimer of Warranties</h2>
          <p>The website and all content are provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis.</p>
          <p>We make no warranties regarding:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Accuracy of content</li>
            <li>Reliability of coupons</li>
            <li>Availability of offers</li>
            <li>Website uptime</li>
            <li>Merchant performance</li>
            <li>Results obtained through use of the website</li>
          </ul>
          <p>To the fullest extent permitted by law, all warranties, express or implied, are disclaimed.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
          <p>Under no circumstances shall FreeDiscountCoupons.com, its owners, affiliates, partners, contributors, or service providers be liable for:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Direct damages</li>
            <li>Indirect damages</li>
            <li>Incidental damages</li>
            <li>Consequential damages</li>
            <li>Loss of profits</li>
            <li>Loss of data</li>
            <li>Purchase-related disputes</li>
            <li>Coupon redemption failures</li>
          </ul>
          <p>Your use of the website is entirely at your own risk.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Indemnification</h2>
          <p>You agree to indemnify and hold harmless FreeDiscountCoupons.com and its operators from any claims, liabilities, damages, losses, or expenses arising from:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Your use of the website</li>
            <li>Violation of these Terms</li>
            <li>Violation of any applicable laws</li>
            <li>Infringement of third-party rights</li>
          </ul>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Website Availability</h2>
          <p>We reserve the right to:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Modify website content</li>
            <li>Suspend services</li>
            <li>Remove offers</li>
            <li>Restrict access</li>
            <li>Discontinue any part of the website</li>
          </ul>
          <p>Without prior notice.</p>
          <p>We are not liable for any interruption or unavailability of services.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Privacy</h2>
          <p>Your use of FreeDiscountCoupons.com is also governed by our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.</p>
          <p>Please review our Privacy Policy to understand how information is collected and used.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Governing Law</h2>
          <p>These Terms shall be governed and interpreted in accordance with applicable laws.</p>
          <p>Any disputes arising from the use of the website shall be subject to the jurisdiction of the courts determined by applicable law.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Changes to Terms</h2>
          <p>We reserve the right to update or modify these Terms of Use at any time.</p>
          <p>Updated versions will be posted on this page with a revised &ldquo;Last Updated&rdquo; date.</p>
          <p>Continued use of the website after changes are posted constitutes acceptance of the revised Terms.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Information</h2>
          <p>If you have questions regarding these Terms of Use, please contact us:</p>
          <p className="font-semibold text-gray-900">FreeDiscountCoupons.com</p>
          <p>
            Email: <a href="mailto:info@whizadsbay.com" className="text-blue-600 hover:underline">info@whizadsbay.com</a>
          </p>
          <p>We will make reasonable efforts to respond to inquiries in a timely manner.</p>
        </div>
      </div>
    </main>
  );
}
