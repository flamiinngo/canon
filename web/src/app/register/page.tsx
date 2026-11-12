import type { Metadata } from "next";
import { Label } from "@/components/ui";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register a work · Canon" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-12 sm:px-6 sm:pt-20 lg:px-8">
      <Label>Register</Label>
      <h1 className="display mt-5 max-w-[14ch] text-[52px] text-fg sm:text-[76px]">Start a canon.</h1>
      <p className="mt-5 max-w-xl text-fg-2">
        Upload a file or generate an original. The file is hashed in your browser; only the hash, your terms and your splits go
        on-chain.
      </p>
      <RegisterForm />
    </div>
  );
}
