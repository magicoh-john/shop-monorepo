import RegisterForm from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="bg-card text-card-foreground rounded-[var(--radius)] border border-border shadow-sm p-6 w-full max-w-sm space-y-4">
      <RegisterForm />
    </div>
  );
}
