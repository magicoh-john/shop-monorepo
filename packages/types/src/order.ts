/**
 * 주문 관련 공통 타입
 *
 * Order는 결제 완료 후 DB에 저장되는 주문 데이터다.
 * 장바구니(CartItem)와 달리 서버에 영구 저장되며 취소/상태 변경이 가능하다.
 *
 * 관련 타입:
 * - CartItem (cart.ts): 결제 전 클라이언트 임시 상태
 * - OrderItem: 결제 후 DB에 저장된 주문 상품 상세
 * - Order: 주문 마스터 (배송지, 총액, 상태 포함)
 */

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;     // 주문 시점의 가격 (이후 가격이 바뀌어도 유지)
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  statusCode: string;    // 주문 상태 코드 (예: 'PAID', 'SHIPPING', 'DONE', 'CANCELLED')
  totalPrice: number;
  receiverName: string;
  receiverPhone: string;
  address: string;
  items: OrderItem[];
  createdAt: string;     // ISO 8601 문자열
}
