import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "USER") redirect("/");

  return (
    <main className="content">
      <ChangePasswordForm />
    </main>
  );
}
