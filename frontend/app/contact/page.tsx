import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - FreeDiscountCoupons',
  description: 'Contact FreeDiscountCoupons.com for questions, expired coupons, deal suggestions, merchant partnerships, and advertising inquiries.',
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>

        <div className="prose prose-gray max-w-none">
          <p>
            Thank you for visiting <strong>FreeDiscountCoupons.com</strong>.
          </p>
          <p>
            We value your feedback and are always happy to hear from our visitors, partners, merchants, and advertisers.
          </p>
          <p>
            Whether you have a question, found an expired coupon, want to suggest a deal, or are interested in working with us, we&rsquo;d love to hear from you.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How to Reach Us</h2>
          <p>
            <strong>Email:</strong>{' '}
            <a href="mailto:info@whizadsbay.com" className="text-blue-600 hover:underline">
              info@whizadsbay.com
            </a>
          </p>
          <p>We aim to respond to most inquiries within 24-48 business hours.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us For</h2>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">General Questions</h3>
          <p>Have a question about our website, coupons, or offers? Feel free to contact us.</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Report an Expired Coupon</h3>
          <p>Found a coupon that no longer works? Let us know so we can review and update it.</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Suggest a Deal or Promotion</h3>
          <p>Know about a great discount or special offer? We&rsquo;d appreciate your suggestions.</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Merchant &amp; Brand Partnerships</h3>
          <p>
            If you&rsquo;re a merchant, affiliate manager, agency, or brand representative interested in featuring your offers on FreeDiscountCoupons.com, please contact us.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Advertising Opportunities</h3>
          <p>
            For sponsored content, promotional campaigns, and advertising inquiries, please reach out via email.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Technical Issues</h3>
          <p>
            If you experience any problems using our website, please include details about the issue, your browser, and device information when contacting us.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Business Inquiries</h2>
          <p>For affiliate partnerships, media requests, collaborations, or business opportunities:</p>
          <p>
            <strong>Email:</strong>{' '}
            <a href="mailto:info@whizadsbay.com" className="text-blue-600 hover:underline">
              info@whizadsbay.com
            </a>
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Thank You</h2>
          <p>
            We appreciate your visit to FreeDiscountCoupons.com and look forward to helping you discover the best online deals, discounts, and coupon codes.
          </p>
        </div>
      </div>
    </main>
  );
}
