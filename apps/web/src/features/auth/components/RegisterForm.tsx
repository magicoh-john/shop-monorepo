"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/schemas/auth.schema";
import { register } from "@/features/auth/auth.actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterForm() {
  const router = useRouter();
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("name", data.name);

    const result = await register(formData);
    if (result?.error) return alert(result.error);

    alert("회원가입 완료! 로그인 페이지로 이동합니다.");
    router.push("/login");
  };

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        회원가입
      </h1>
      <div className="space-y-1">
        <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
          이름
        </Label>
        <Input
          id="name"
          {...formRegister("name")}
          placeholder="홍길동"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
          이메일
        </Label>
        <Input
          id="email"
          {...formRegister("email")}
          type="email"
          placeholder="name@example.com"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
          비밀번호
        </Label>
        <Input
          id="password"
          {...formRegister("password")}
          type="password"
          placeholder="••••••"
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button
        className="w-full"
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? "처리 중..." : "회원가입"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-primary">
          로그인
        </Link>
      </p>
    </>
  );
}
