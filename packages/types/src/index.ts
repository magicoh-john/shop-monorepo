/**
 * packages/types 패키지의 진입점 (Entry Point)
 *
 * 왜 이렇게 하는가?
 * 타입 파일이 auth.ts / cart.ts / order.ts / product.ts / common.ts 로 분리되어 있다.
 * 이 파일이 없다면 사용하는 쪽에서 아래처럼 각 파일을 직접 지정해야 한다.
 *
 *   import type { User } from '@my-project/types/src/auth';
 *   import type { CartItem } from '@my-project/types/src/cart';
 *
 * index.ts에서 전부 re-export 하면 사용하는 쪽에서 이렇게 쓸 수 있다.
 *
 *   import type { User, CartItem, Product, Order } from '@my-project/types';
 *
 * 즉, 내부 파일 구조(파일명, 폴더 위치)가 바뀔 때 수정할 파일이 index.ts 하나뿐이다.
 * 예: auth.ts → authentication.ts 로 파일명을 바꿀 경우,
 *   - index.ts 한 곳만 수정하면 된다 (export * from './authentication')
 *   - 이 타입을 import하는 앱 코드는 수정할 필요가 없다
 *
 * 단, 타입 이름이 바뀌면 import하는 모든 곳을 수정해야 한다.
 * 예: User → User2 로 바꾸면 { User } 로 import한 모든 파일에서 오류가 발생한다.
 * (이건 index.ts와 무관한 TypeScript의 기본 동작이다)
 */

export * from './auth';    // User, Session
export * from './cart';    // CartItem
export * from './product'; // Product, Category, ProductListResponse
export * from './order';   // Order, OrderItem
export * from './common';  // ApiResponse<T>
