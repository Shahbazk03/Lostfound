import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | LOSTFOUND",
  description:
    "What information LOSTFOUND collects, how it is used and shared, and the choices you have.",
  alternates: { canonical: "/privacy" },
};

const sections: LegalSection[] = [
  {
    id: "collect",
    title: "Information we collect",
    body: (
      <>
        <p>We collect information you give us and a small amount of information generated when you use the service:</p>
        <ul>
          <li><strong>Account details:</strong> your name, email address, password (stored only in hashed form), and optionally a phone number and profile photo.</li>
          <li><strong>Listings:</strong> the details, photos and locations you add when reporting an item, including any precise location you choose to provide.</li>
          <li><strong>Messages:</strong> the messages you send to and receive from other users through the service.</li>
          <li><strong>Payments:</strong> a record of payments and withdrawals (amount, currency, status and date). Card details are handled by our payment processor, not stored by us.</li>
          <li><strong>Usage information:</strong> pages visited, a random per-session identifier, and basic technical data such as browser type, used to keep the service running and understand how it is used.</li>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>To create and run your account and show your listings.</li>
        <li>To let users find listings and contact each other.</li>
        <li>To process payments, unlocks, subscriptions and withdrawals.</li>
        <li>To send service emails such as verification codes and password resets.</li>
        <li>To keep the service secure, prevent fraud and enforce our <Link href="/terms">Terms of Service</Link>.</li>
        <li>To understand usage and improve the service.</li>
      </ul>
    ),
  },
  {
    id: "visible",
    title: "What other users can see",
    body: (
      <>
        <p>
          Listings are public. Other people can see a listing&apos;s title,
          description, photos, category, approximate location and date, along
          with your display name.
        </p>
        <p>
          A listing&apos;s precise location is shown only to you and to users
          who unlock it. Your email address and phone number are not shown on
          listings.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Sharing with others",
    body: (
      <>
        <p>We do not sell your personal information. We share it only:</p>
        <ul>
          <li>with service providers that help us run the service (for example hosting, databases, email delivery and payment processing), who may use it only to provide those services to us;</li>
          <li>with other users, as described above, when you post a listing or send a message;</li>
          <li>when required by law, or to protect the rights, safety and property of our users or the public.</li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We keep your information while your account is active and for as long
        as needed to provide the service, meet legal and accounting
        obligations, resolve disputes and prevent abuse. When it is no longer
        needed, we delete or anonymise it.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use reasonable technical and organisational measures to protect your
        information, including encrypted connections and hashed passwords. No
        system is perfectly secure, so please use a strong, unique password.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your choices and rights",
    body: (
      <>
        <p>
          You can update your name, phone number and photo from your profile,
          and edit or delete your listings at any time.
        </p>
        <p>
          Depending on where you live, you may also have the right to access,
          correct, export or delete your personal information, or to object to
          certain processing. To make a request, contact us using the details
          below.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and similar storage",
    body: (
      <p>
        We use a small number of cookies and browser storage items to keep you
        signed in and remember preferences. See our{" "}
        <Link href="/cookies">Cookie Policy</Link> for details.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        The service is not directed at young children, and we do not knowingly
        collect information from children who are not old enough to consent
        under the law where they live.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. We will change the date at
        the top of this page when we do, and let you know about significant
        changes where appropriate.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        For privacy questions or requests, get in touch through our{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="November 22, 2026"
      currentPath="/privacy"
      intro={
        <p>
          This policy explains what information LOSTFOUND collects when you use
          the service, why we collect it, who we share it with and the choices
          you have.
        </p>
      }
      sections={sections}
    />
  );
}
