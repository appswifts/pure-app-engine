import { Button } from "@/components/ui/button";
import { MessageCircle, ShoppingCart, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderButtonProps {
  cart: Array<{
    id: string;
    name: string;
    basePrice: number;
    variation?: { name: string; price_modifier: number };
    accompaniments: Array<{ name: string; price: number }>;
    totalPrice: number;
  }>;
  restaurant: {
    whatsapp_number: string;
  } | null;
  tableName?: string;
  tableSlug?: string;
  formatPrice: (price: number) => string;
  onRemoveFromCart: (cartItemId: string) => void;
  onOrderViaWhatsApp: () => void;
}

const OrderButton = ({ 
  cart, 
  restaurant, 
  tableName, 
  tableSlug, 
  formatPrice, 
  onRemoveFromCart,
  onOrderViaWhatsApp 
}: OrderButtonProps) => {
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  if (cart.length === 0) return null;

  return (
    <div className="sticky bottom-4 mt-8">
      <Card className="shadow-elevated bg-card/95 backdrop-blur-sm border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Order ({cart.length} items)
            </span>
            <span className="text-primary">{formatPrice(cartTotal)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  {item.variation && (
                    <span className="text-muted-foreground"> ({item.variation.name})</span>
                  )}
                  {item.accompaniments.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      + {item.accompaniments.map(acc => acc.name).join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemoveFromCart(item.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={onOrderViaWhatsApp}
            variant="whatsapp"
            size="lg"
            className="w-full"
            disabled={!restaurant}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Order via WhatsApp - {formatPrice(cartTotal)}
          </Button>
          
          {!restaurant && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Restaurant contact not available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderButton;