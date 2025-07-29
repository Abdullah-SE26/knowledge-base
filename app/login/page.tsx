import LoginForm from "@/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mawaridhi-Knowledge Login",
  description: "Login to access resources",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center ">
      <LoginForm />
    </main>
  );
}
