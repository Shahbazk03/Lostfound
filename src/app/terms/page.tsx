import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | LOSTFOUND",
  description:
    "The rules for using LOSTFOUND to report, search for and return lost and found items.",
  alternates: { canonical: "/terms" },
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Accepting these terms",
    body: (
      <p>
        By creating an account or using the service, you agree to these terms.
        If you do not agree, please do not use the service. If you use the
        service on behalf of an organisation, you confirm you are allowed to
        accept these terms for it.
      </p>
    ),
  },
  {
    id: "service",
    title: "What the service does",
    body: (
      <>
        <p>
          LOSTFOUND is a platform where people can post listings for items they
          have lost or found, search those listings and contact each other to
          arrange a return.
        </p>
        <p>
          We provide the platform only. We are not a party to any exchange
          between users, we do not hold items, and we cannot guarantee that a
          listing is accurate or that an item will be recovered.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <ul>
        <li>You must give accurate information when you sign up and keep it up to date.</li>
        <li>You are responsible for keeping your password secret and for activity on your account.</li>
        <li>Tell us promptly if you think someone else has accessed your account.</li>
        <li>You must be old enough to form a binding agreement where you live.</li>
      </ul>
    ),
  },
  {
    id: "listings",
    title: "Listings and content you post",
    body: (
      <>
        <p>You keep ownership of the text and photos you post. You give us permission to store, display and process them so the service can work.</p>
        <p>You agree not to post content that:</p>
        <ul>
          <li>is false or misleading, or describes an item you have no genuine connection to;</li>
          <li>includes another person&apos;s private information without their consent;</li>
          <li>is unlawful, abusive, harassing, or infringes someone else&apos;s rights;</li>
          <li>is spam, advertising, or an attempt to collect payment under false pretences.</li>
        </ul>
        <p>We may edit, hide or remove listings or messages that break these terms.</p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Paid features",
    body: (
      <>
        <p>
          Some features, such as unlocking a listing&apos;s precise location,
          unlocking messaging for a listing, or a subscription, may require a
          payment. The price is shown before you pay.
        </p>
        <p>
          Payments are handled by a third-party payment processor; we do not
          store your full card details. Unless the law requires otherwise or we
          say so at the time of purchase, payments for features that have been
          delivered are not refundable. You can cancel a subscription at any
          time, and it will stop renewing at the end of the current period.
        </p>
        <p>
          Where a listing owner sets an unlock price, any earnings shown in
          their wallet are subject to verification before they can be
          withdrawn.
        </p>
      </>
    ),
  },
  {
    id: "safety",
    title: "Meeting other users",
    body: (
      <p>
        Take sensible precautions when returning or collecting an item: meet in
        a public place, bring someone with you if you can, and check the item
        before handing anything over. You are responsible for your own
        interactions with other users.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspending or closing accounts",
    body: (
      <p>
        You can stop using the service at any time. We may suspend or close
        accounts that break these terms, put other users at risk, or are used
        for fraud.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers and liability",
    body: (
      <>
        <p>
          The service is provided &quot;as is&quot;. To the extent the law
          allows, we make no promises about availability, accuracy or fitness
          for a particular purpose.
        </p>
        <p>
          To the extent the law allows, we are not liable for indirect or
          consequential losses, or for loss or damage arising from items,
          listings or dealings between users. Nothing in these terms limits
          liability that cannot be limited by law.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. When we make significant
        changes we will update the date at the top of this page and, where
        appropriate, let you know. Continuing to use the service after a change
        means you accept the updated terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms? Get in touch through our{" "}
        <Link href="/contact">contact page</Link>. See also our{" "}
        <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/cookies">Cookie Policy</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="November 22, 2026"
      currentPath="/terms"
      intro={
        <p>
          These terms explain the rules for using LOSTFOUND. They are written
          to be read, so please take a few minutes to go through them.
        </p>
      }
      sections={sections}
    />
  );
}
