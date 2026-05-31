import CheckoutForm from '@/features/order/components/CheckoutForm';

export default function CheckoutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-8">주문 / 결제</h1>
      <CheckoutForm />
    </div>
  );
}
