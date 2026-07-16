import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer - FreeDiscountCoupons',
  description: 'Disclaimer for FreeDiscountCoupons.com. Read important information about coupon accuracy, affiliate links, and liability limitations.',
  robots: { index: true, follow: true },
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Disclaimer</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: July 16, 2026</p>

        <div className="prose prose-gray max-w-none">
          <p>
            Welcome to FreeDiscountCoupons.com. This Disclaimer governs your use of our website and should be read alongside our{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>,{' '}
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Use</a>, and{' '}
            <a href="/affiliate-disclosure" className="text-blue-600 hover:underline">Affiliate Disclosure</a>.
          </p>
          <p>
            By using FreeDiscountCoupons.com, you agree to the terms outlined in this Disclaimer.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">General Information Disclaimer</h2>
          <p>
            All information provided on FreeDiscountCoupons.com is published in good faith and for general informational purposes only.
          </p>
          <p>
            While we make reasonable efforts to ensure the accuracy and timeliness of the information presented on our website, we make no guarantees regarding:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Completeness</li>
            <li>Accuracy</li>
            <li>Reliability</li>
            <li>Availability</li>
            <li>Suitability</li>
          </ul>
          <p>
            of any information, coupons, offers, discounts, promotions, or content displayed on the website.
          </p>
          <p>
            Any action you take based on information found on this website is strictly at your own risk.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Coupon and Offer Disclaimer</h2>
          <p>
            FreeDiscountCoupons.com provides coupon codes, promo codes, discounts, and promotional offers from third-party merchants.
          </p>
          <p>We do not guarantee that:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Every coupon code will work.</li>
            <li>Every offer will remain active.</li>
            <li>Every promotion will be available in all regions.</li>
            <li>Every user will qualify for a particular offer.</li>
            <li>Prices shown will remain unchanged.</li>
          </ul>
          <p>
            Merchants may modify, suspend, or discontinue offers without notice.
          </p>
          <p>
            Users should always verify offer details directly with the merchant before making a purchase.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">No Professional Advice</h2>
          <p>The information on FreeDiscountCoupons.com is not intended as:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Legal advice</li>
            <li>Financial advice</li>
            <li>Tax advice</li>
            <li>Business advice</li>
            <li>Investment advice</li>
            <li>Professional consulting services</li>
          </ul>
          <p>
            Users should seek professional guidance before making decisions that require specialized expertise.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Affiliate Disclaimer</h2>
          <p>
            FreeDiscountCoupons.com participates in affiliate marketing programs.
          </p>
          <p>
            Some links on this website are affiliate links. If you click on an affiliate link and complete a qualifying purchase or action, we may receive a commission at no additional cost to you.
          </p>
          <p>
            Affiliate commissions help support the operation and maintenance of the website.
          </p>
          <p>
            For additional details, please review our <a href="/affiliate-disclosure" className="text-blue-600 hover:underline">Affiliate Disclosure</a> page.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Third-Party Website Disclaimer</h2>
          <p>
            Our website contains links to third-party websites, services, and merchants.
          </p>
          <p>We do not control or endorse:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Third-party content</li>
            <li>Products or services</li>
            <li>Merchant policies</li>
            <li>Website availability</li>
            <li>Security practices</li>
          </ul>
          <p>
            We are not responsible for any loss, damage, dispute, or issue arising from your interaction with third-party websites.
          </p>
          <p>
            Your use of third-party websites is subject to their own terms and policies.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Product and Service Information</h2>
          <p>
            Descriptions, prices, availability, and promotional details displayed on FreeDiscountCoupons.com may change at any time.
          </p>
          <p>We are not responsible for:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Pricing errors</li>
            <li>Product availability issues</li>
            <li>Shipping delays</li>
            <li>Refund disputes</li>
            <li>Warranty claims</li>
            <li>Customer service experiences</li>
          </ul>
          <p>
            These matters are solely the responsibility of the respective merchant.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, FreeDiscountCoupons.com, its owners, operators, affiliates, contributors, and partners shall not be liable for any:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Direct damages</li>
            <li>Indirect damages</li>
            <li>Incidental damages</li>
            <li>Consequential damages</li>
            <li>Loss of profits</li>
            <li>Loss of business opportunities</li>
            <li>Loss of data</li>
          </ul>
          <p>
            arising from the use of this website or reliance on information provided herein.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Use at Your Own Risk</h2>
          <p>
            All content, offers, coupons, and services available through FreeDiscountCoupons.com are provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis.
          </p>
          <p>Your use of the website is entirely at your own risk.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Changes to This Disclaimer</h2>
          <p>
            We reserve the right to update or modify this Disclaimer at any time.
          </p>
          <p>
            Any changes will be posted on this page with a revised &ldquo;Last Updated&rdquo; date.
          </p>
          <p>
            Continued use of the website following updates constitutes acceptance of the revised Disclaimer.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions regarding this Disclaimer, please contact us:
          </p>
          <p className="font-semibold text-gray-900">FreeDiscountCoupons.com</p>
          <p>
            Email: <a href="mailto:info@whizadsbay.com" className="text-blue-600 hover:underline">info@whizadsbay.com</a>
          </p>
        </div>
      </div>
    </main>
  );
}
