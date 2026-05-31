/**
 * 장바구니 관련 공통 타입
 *
 * Cart는 DB에 저장되지 않고 클라이언트(Zustand + localStorage)에서만 관리한다.
 * Order(주문)와 개념이 다르므로 별도 파일로 분리한다.
 *
 * Cart → Order 흐름:
 *   1. 사용자가 상품을 CartItem으로 장바구니에 담는다 (클라이언트 상태)
 *   2. 결제 완료 시 CartItem → OrderItem으로 변환되어 DB에 저장된다
 *   3. 장바구니는 비워진다 (clearCart)
 */

export interface CartItem {
  productId: string;
  productName: string;
  price: number;        // 담은 시점의 가격 (이후 가격이 바뀌어도 유지)
  quantity: number;
  imageUrl?: string;
}
