import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register a work · Canon" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <Eyebrow>Register</Eyebrow>
      <h1 className="mt-4 font-display text-5xl leading-[1] tracking-[-0.02em] sm:text-6xl">
        Start a canon <span className="italic text-ink-3">in a minute</span>
      </h1>
      <p className="mt-4 max-w-xl text-ink-2">
        Your file is hashed in the browser. Only the hash and your terms go on-chain; the file itself is stored off-chain.
      </p>
      <RegisterForm />
    </div>
  );
}
