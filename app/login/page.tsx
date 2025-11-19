import LoginForm from "@/components/LoginForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  
  // If already logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}

