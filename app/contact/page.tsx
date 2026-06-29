import Link from "next/link";
import ContactForm from "@/components/landing/ContactForm";
import Footer from "@/components/landing/Footer";
import Nav from "@/components/landing/Nav";

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="pt-28 pb-20 px-5 lg:px-12 bg-off min-h-screen">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="text-sm text-mid hover:text-ind mb-6 inline-block">
            ← Back
          </Link>
          <h1 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,2.6rem)] tracking-tight text-ink mb-2">
            Start your campaign
          </h1>
          <p className="text-mid text-[0.95rem] mb-8 leading-relaxed">
            Tell us about your campaign and we&apos;ll get back to you within 24 hours.
          </p>
          <div className="bg-white border-[1.5px] border-line rounded-2xl p-6 sm:p-8 shadow-sm">
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
