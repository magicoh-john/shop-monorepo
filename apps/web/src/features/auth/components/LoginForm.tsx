"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/schemas/auth.schema";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const result = await signIn("credentials", { ...data, redirect: false });
    if (result?.error)
      return alert("로그인 실패: 이메일 또는 비밀번호를 확인해주세요.");

    router.push("/");
    router.refresh();
  };

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        로그인
      </h1>
      <div className="space-y-1">
        <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
          이메일
        </Label>
        <Input
          id="email"
          {...register("email")}
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
          {...register("password")}
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
        {isSubmitting ? "로그인 중..." : "로그인"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        계정이 없으신가요?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4 hover:text-primary">
          회원가입
        </Link>
      </p>
    </>
  );
}
