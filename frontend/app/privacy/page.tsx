import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - FreeDiscountCoupons',
  description: 'Privacy Policy for FreeDiscountCoupons.com. Learn how we collect, use, store, and protect your information.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: July 16, 2026</p>

        <div className="prose prose-gray max-w-none">
          <p>
            Welcome to FreeDiscountCoupons.com (&ldquo;Website&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We respect your privacy and are committed to protecting any information you provide while using our website.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, store, and protect your information when you visit FreeDiscountCoupons.com.
          </p>
          <p>
            By accessing or using our website, you agree to the terms outlined in this Privacy Policy.
          </p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Information You Voluntarily Provide</h3>
          <p>We may collect personal information that you voluntarily provide, including:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Name</li>
            <li>Email address</li>
            <li>Information submitted through contact forms</li>
            <li>Newsletter subscription details</li>
            <li>Feedback, comments, or inquiries</li>
          </ul>
          <p>You are not required to provide personal information to browse our website.</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Information Collected Automatically</h3>
          <p>When you visit FreeDiscountCoupons.com, certain information may be collected automatically, including:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Operating system</li>
            <li>Referring website</li>
            <li>Pages visited</li>
            <li>Date and time of visits</li>
            <li>Clickstream data</li>
          </ul>
          <p>This information helps us improve website performance and user experience.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Cookies and Tracking Technologies</h2>
          <p>FreeDiscountCoupons.com uses cookies and similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Remember user preferences</li>
            <li>Improve website functionality</li>
            <li>Analyze website traffic</li>
            <li>Measure marketing performance</li>
            <li>Personalize content and offers</li>
          </ul>
          <p>You may disable cookies through your browser settings. However, some website features may not function properly if cookies are disabled.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Affiliate Disclosure and Tracking</h2>
          <p>FreeDiscountCoupons.com participates in affiliate marketing programs.</p>
          <p>
            Some links on our website are affiliate links. If you click a coupon, deal, or promotional offer and make a purchase, we may earn a commission at no additional cost to you.
          </p>
          <p>Affiliate networks and merchant partners may use cookies, tracking pixels, or similar technologies to track referrals and attribute commissions.</p>
          <p>We do not control the privacy practices of affiliate networks, advertisers, or third-party merchants.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Third-Party Advertising</h2>
          <p>We may display advertisements from third-party advertising partners, including but not limited to:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Google AdSense</li>
            <li>Google Ad Manager</li>
            <li>Affiliate Networks</li>
            <li>Sponsored Content Partners</li>
          </ul>
          <p>These advertising partners may use cookies, web beacons, and similar technologies to serve relevant advertisements and measure campaign effectiveness.</p>
          <p>Please review the privacy policies of these third parties for additional information regarding their data collection practices.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Analytics Services</h2>
          <p>We may use analytics tools such as:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Google Analytics</li>
            <li>Google Search Console</li>
            <li>Microsoft Clarity</li>
            <li>Other analytics and reporting platforms</li>
          </ul>
          <p>These services help us understand website traffic, user behavior, and performance metrics.</p>
          <p>Analytics providers may collect information such as:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Device information</li>
            <li>Browser information</li>
            <li>Session duration</li>
            <li>Pages viewed</li>
            <li>Geographic region (non-precise)</li>
          </ul>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Email Communications</h2>
          <p>If you subscribe to our newsletter or provide your email address, we may send:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Coupon alerts</li>
            <li>Deal notifications</li>
            <li>Promotional offers</li>
            <li>Website updates</li>
            <li>Important service announcements</li>
          </ul>
          <p>You may unsubscribe at any time using the unsubscribe link included in our emails.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Information</h2>
          <p>We may use collected information to:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Operate and maintain the website</li>
            <li>Improve content and user experience</li>
            <li>Respond to inquiries</li>
            <li>Send newsletters and promotional communications</li>
            <li>Monitor website performance</li>
            <li>Prevent fraud and abuse</li>
            <li>Comply with legal obligations</li>
            <li>Analyze trends and user behavior</li>
          </ul>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Sharing</h2>
          <p>We do not sell your personal information.</p>
          <p>However, we may share information with:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Analytics providers</li>
            <li>Affiliate networks</li>
            <li>Advertising partners</li>
            <li>Hosting providers</li>
            <li>Legal authorities when required by law</li>
          </ul>
          <p>Information shared is limited to what is necessary for providing services, analytics, security, and business operations.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Third-Party Websites</h2>
          <p>Our website contains links to third-party websites, merchants, and service providers.</p>
          <p>Once you leave FreeDiscountCoupons.com, you are subject to the privacy policies and practices of those third-party websites.</p>
          <p>We are not responsible for the content, privacy practices, or policies of external websites.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
          <p>We implement reasonable technical and organizational measures to protect information from unauthorized access, disclosure, misuse, or loss.</p>
          <p>However, no method of electronic transmission or storage is completely secure. Therefore, we cannot guarantee absolute security.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Children&rsquo;s Privacy</h2>
          <p>FreeDiscountCoupons.com is not intended for children under the age of 13.</p>
          <p>We do not knowingly collect personal information from children under 13 years of age.</p>
          <p>If you believe a child has provided personal information to us, please contact us and we will promptly remove such information.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Privacy Rights</h2>
          <p>Depending on your location and applicable laws, you may have rights regarding your personal information, including:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Access to your data</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of personal information</li>
            <li>Restriction of processing</li>
            <li>Objection to certain processing activities</li>
            <li>Withdrawal of consent</li>
          </ul>
          <p>To exercise any privacy-related rights, please contact us using the information below.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">International Users</h2>
          <p>Our website may be accessed globally.</p>
          <p>By using FreeDiscountCoupons.com, you understand that your information may be processed and stored in countries where data protection laws may differ from those in your jurisdiction.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time.</p>
          <p>Any changes will be posted on this page with a revised &ldquo;Last Updated&rdquo; date.</p>
          <p>Continued use of the website after updates constitutes acceptance of the revised Privacy Policy.</p>

          <hr className="my-8 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
          <p>If you have any questions regarding this Privacy Policy or our data practices, please contact us:</p>
          <p className="font-semibold text-gray-900">FreeDiscountCoupons.com</p>
          <p>
            Email: <a href="mailto:info@whizadsbay.com" className="text-blue-600 hover:underline">info@whizadsbay.com</a>
          </p>
          <p>We will make reasonable efforts to respond to privacy-related requests promptly.</p>
        </div>
      </div>
    </main>
  );
}
