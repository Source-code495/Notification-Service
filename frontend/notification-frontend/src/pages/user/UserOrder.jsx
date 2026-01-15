import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { FASHION_PRODUCTS } from "../../constants/products";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { createOrder } from "../../services/orderService";
import { getErrorMessage } from "../../services/http";

export default function UserOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initialize with the first item selected for demo purposes, or empty
  const [cart, setCart] = useState([
    { ...FASHION_PRODUCTS[0], quantity: 1 }
  ]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const newQty = Math.max(0, p.quantity + delta);
        return { ...p, quantity: newQty };
      }).filter(p => p.quantity > 0)
    );
  };

  const { productTotal, discount, deliveryFee, finalTotal } = useMemo(() => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const disc = total * 0.06; // 6% discount as per mock image
    const delivery = total > 50 ? 0 : 10; // Free delivery over $50
    return {
      productTotal: total,
      discount: disc,
      deliveryFee: delivery,
      finalTotal: total - disc + delivery,
    };
  }, [cart]);

  const handleOrder = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await createOrder({
        items: cart,
        total_amount: finalTotal,
      });
      setSuccess("Order placed successfully!");
      setCart([]);
      setTimeout(() => {
        navigate("/app/orders");
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Shop Fashion" subtitle="Select products and place an order." />

      {error ? <Alert type="error" className="mb-4">{error}</Alert> : null}
      {success ? <Alert type="success" className="mb-4">{success}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Product Catalog */}
        <div className="lg:col-span-7 xl:col-span-8">
           <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
             {FASHION_PRODUCTS.map((product) => {
               const inCart = cart.find(c => c.id === product.id);
               return (
                 <div key={product.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/50">
                   <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                     <img 
                       src={product.image} 
                       alt={product.name} 
                       className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                     />
                   </div>
                   <div className="p-4">
                     <h3 className="font-semibold text-slate-900 dark:text-slate-100">{product.name}</h3>
                     <p className="mb-3 text-sm text-slate-500 line-clamp-1">{product.description}</p>
                     <div className="flex items-center justify-between">
                       <span className="font-bold text-slate-900 dark:text-slate-100">
                         ${product.price.toFixed(2)}
                       </span>
                       <Button 
                         size="sm" 
                         variant={inCart ? "secondary" : "primary"}
                         onClick={() => addToCart(product)}
                         disabled={!!inCart}
                       >
                         {inCart ? "Added" : "Add"}
                       </Button>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

        {/* Order Summary (Matches the uploaded image style) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
            <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">Order summary</h2>

            <div className="mb-6 space-y-4">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">Your cart is empty.</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                        <div className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400">{item.description}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        $ {item.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Quantity Controls - Vertical Style from Image */}
                    <div className="flex w-8 flex-col items-center justify-between rounded-lg border border-slate-200 bg-slate-50 py-1 dark:border-slate-800 dark:bg-slate-900">
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="flex h-5 w-full items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {item.quantity}
                      </span>
                      
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="flex h-5 w-full items-center justify-center text-slate-500 hover:text-red-500"
                      >
                         {item.quantity === 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-600 dark:text-slate-400">Product total</span>
                 <span className="font-medium text-slate-900 dark:text-slate-100">${productTotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-600 dark:text-slate-400">Discount</span>
                 <span className="font-medium text-slate-900 dark:text-slate-100">
                    <span className="text-slate-400 mr-1">%6</span>
                    (${discount.toFixed(2)})
                 </span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-600 dark:text-slate-400">Delivery fee</span>
                 <span className="font-medium text-green-600 dark:text-green-400">
                    {deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`}
                 </span>
               </div>
               
               <div className="flex justify-between border-t border-slate-100 pt-3 text-base dark:border-slate-800">
                 <span className="font-semibold text-amber-500">Total</span>
                 <span className="font-bold text-amber-500">${finalTotal.toFixed(2)}</span>
               </div>
            </div>

            <button 
              onClick={handleOrder}
              disabled={cart.length === 0 || loading}
              className="mt-6 w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Placing Order..." : "Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
