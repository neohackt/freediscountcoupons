import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - FreeDiscountCoupons',
  description: 'Learn about FreeDiscountCoupons.com — your destination for coupon codes, promo codes, discounts, and deals from popular online stores.',
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">About FreeDiscountCoupons.com</h1>
        <p className="text-xl text-gray-600 mt-4">Helping Shoppers Save More Every Day</p>

        <div className="prose prose-gray max-w-none">
          <p>
            Welcome to <strong>FreeDiscountCoupons.com</strong>, your destination for discovering the latest coupon codes, promo codes, discounts, deals, and special offers from popular online stores and brands.
          </p>
          <p>Our mission is simple:</p>
          <p className="text-lg font-semibold text-gray-900 pl-4 border-l-4 border-blue-600">
            Help shoppers save money before they buy.
          </p>
          <p>
            We understand that finding valid coupons can be frustrating. Many coupon websites display expired or inaccurate codes, making it difficult for shoppers to find real savings. That&rsquo;s why we work to collect, organize, and share promotional offers from trusted merchants across a wide range of categories.
          </p>
          <p>Whether you&rsquo;re shopping for:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Electronics</li>
            <li>Software &amp; SaaS</li>
            <li>Fashion &amp; Apparel</li>
            <li>Travel &amp; Hotels</li>
            <li>Health &amp; Beauty</li>
            <li>Home &amp; Garden</li>
            <li>Education &amp; Online Courses</li>
            <li>Web Hosting &amp; Technology</li>
            <li>Financial Services</li>
            <li>Lifestyle Products</li>
          </ul>
          <p>Our goal is to help you discover discounts that can reduce your overall spending.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What We Do</h2>
          <p>
            At FreeDiscountCoupons.com, we continuously monitor promotions, coupon codes, seasonal sales, and special offers from online retailers and service providers.
          </p>
          <p>We aim to provide:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Verified coupon codes</li>
            <li>Exclusive promotional offers</li>
            <li>Limited-time deals</li>
            <li>Seasonal sales updates</li>
            <li>Shopping guides</li>
            <li>Brand discount pages</li>
            <li>Money-saving recommendations</li>
          </ul>
          <p>
            While we strive to keep information current, merchants may change or discontinue promotions at any time. We encourage users to verify offer details directly on the merchant&rsquo;s website before making a purchase.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Make Money</h2>
          <p>FreeDiscountCoupons.com participates in affiliate marketing programs.</p>
          <p>
            This means that when users click certain links and complete qualifying purchases, we may earn a commission from the merchant or affiliate network.
          </p>
          <p>
            These commissions help support the operation of our website and allow us to continue providing free access to deals and savings opportunities.
          </p>
          <p>Importantly:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>There is no additional cost to users.</li>
            <li>Affiliate partnerships do not influence our commitment to presenting useful offers.</li>
            <li>Our goal remains helping users discover genuine savings opportunities.</li>
          </ul>
          <p>
            For more information, please review our <a href="/affiliate-disclosure" className="text-blue-600 hover:underline">Affiliate Disclosure</a> page.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Commitment</h2>
          <p>We are committed to:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Transparency</li>
            <li>User trust</li>
            <li>Accurate information</li>
            <li>Continuous improvement</li>
            <li>Providing a better shopping experience</li>
          </ul>
          <p>
            As online shopping continues to evolve, we aim to become a trusted resource for consumers looking to maximize value and save money.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Get in Touch</h2>
          <p>
            We welcome feedback, suggestions, merchant inquiries, partnership opportunities, and questions from our visitors.
          </p>
          <p>
            <strong>Email:</strong>{' '}
            <a href="mailto:info@whizadsbay.com" className="text-blue-600 hover:underline">
              info@whizadsbay.com
            </a>
          </p>
          <p>
            Thank you for visiting FreeDiscountCoupons.com and being part of our growing community of smart shoppers.
          </p>
        </div>
      </div>
    </main>
  );
}
