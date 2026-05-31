/**
 * 공통 유틸리티 타입
 *
 * 특정 도메인(auth, product, order, cart)에 속하지 않는 범용 타입.
 */

// API Route의 응답을 일관된 형태로 감싸는 래퍼 타입
// 사용 예: return Response.json<ApiResponse<Product[]>>({ success: true, data: products })
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
