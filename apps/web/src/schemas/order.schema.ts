import { z } from "zod";

export const orderSchema = z.object({
  receiverName: z
    .string()
    .min(2, "받는 분 이름은 2자 이상 입력해주세요")
    .max(20, "이름은 20자 이하로 입력해주세요"),
  receiverPhone: z
    .string()
    .regex(
      /^01[0-9]-\d{3,4}-\d{4}$/,
      "올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)",
    ),
  address: z
    .string()
    .min(5, "주소는 5자 이상 입력해주세요")
    .max(100, "주소는 100자 이하로 입력해주세요"),
});

export type OrderFormData = z.infer<typeof orderSchema>;
