import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ItemVariation {
  id: string;
  menu_item_id: string;
  name: string;
  price_modifier: number;
}

interface Accompaniment {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_required: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  category_id: string;
  restaurant_id: string;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
}

interface CartItem {
  id: string;
  name: string;
  basePrice: number;
  variation?: ItemVariation;
  accompaniments: Accompaniment[];
  totalPrice: number;
}

interface SimpleMenuCardProps {
  item: MenuItem;
  variations: ItemVariation[];
  accompaniments: Accompaniment[];
  onAddToCart: (item: MenuItem, quantity: number, variation?: ItemVariation, accompaniments?: Accompaniment[]) => void;
  onRemoveFromCart: (cartItemId: string) => void;
  cart: CartItem[];
  formatPrice: (price: number) => string;
  restaurant: any;
  cardStyle: { className: string; style: React.CSSProperties };
  buttonStyle: string;
}

export function SimpleMenuCard({
  item,
  variations,
  accompaniments,
  onAddToCart,
  onRemoveFromCart,
  cart,
  formatPrice,
  restaurant,
  cardStyle,
  buttonStyle
}: SimpleMenuCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<ItemVariation | undefined>(
    variations.length > 0 ? variations[0] : undefined
  );
  const [selectedAccompaniments, setSelectedAccompaniments] = useState<Accompaniment[]>([]);
  const [quantity, setQuantity] = useState(1);

  const hasOptions = variations.length > 0 || accompaniments.length > 0;
  const cartItemsForThisItem = cart.filter(cartItem => 
    cartItem.name === item.name
  );

  const calculatePrice = () => {
    const variationPrice = selectedVariation ? selectedVariation.price_modifier : item.base_price;
    const accompanimentsPrice = selectedAccompaniments.reduce((sum, acc) => sum + acc.price, 0);
    return variationPrice + accompanimentsPrice;
  };

  const handleAddToCart = () => {
    if (hasOptions && !showOptions) {
      setShowOptions(true);
      return;
    }
    onAddToCart(item, quantity, selectedVariation, selectedAccompaniments);
    setShowOptions(false);
    setQuantity(1);
    setSelectedAccompaniments([]);
  };

  const toggleAccompaniment = (acc: Accompaniment) => {
    setSelectedAccompaniments(prev => {
      const exists = prev.find(a => a.id === acc.id);
      if (exists) {
        return prev.filter(a => a.id !== acc.id);
      }
      return [...prev, acc];
    });
  };

  const getButtonClassName = () => {
    let className = 'text-sm font-medium transition-colors ';
    
    switch (buttonStyle) {
      case 'pill':
        className += 'rounded-full ';
        break;
      case 'sharp':
        className += 'rounded-none ';
        break;
      default:
        className += 'rounded-lg ';
        break;
    }
    
    return className;
  };

  return (
    <div 
      className={`${cardStyle.className} transition-all bg-white ${restaurant.show_animations !== false ? 'hover:scale-[1.02]' : ''}`}
      style={{
        ...cardStyle.style,
        backgroundColor: 'white'
      }}
    >
      <div className="flex gap-4">
        {item.image_url && (
          <SafeImage
            src={item.image_url}
            alt={item.name}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {item.name}
              </h3>
              {item.description && (
                <p className="text-sm mt-1 text-gray-600">
                  {item.description}
                </p>
              )}
            </div>
            <div className="text-right ml-4">
              <p className="font-bold text-lg" style={{ color: restaurant.brand_color || '#F97316' }}>
                {formatPrice(item.base_price)}
              </p>
            </div>
          </div>

          {/* Options Section */}
          {hasOptions && showOptions && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3">
              {/* Variations */}
              {variations.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Choose Size/Type</label>
                  <Select
                    value={selectedVariation?.id}
                    onValueChange={(value) => {
                      const variation = variations.find(v => v.id === value);
                      setSelectedVariation(variation);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {variations.map((variation) => (
                        <SelectItem key={variation.id} value={variation.id}>
                          {variation.name} - {formatPrice(variation.price_modifier)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Accompaniments */}
              {accompaniments.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Add Extras</label>
                  <div className="space-y-2">
                    {accompaniments.map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={acc.id}
                            checked={selectedAccompaniments.some(a => a.id === acc.id)}
                            onCheckedChange={() => toggleAccompaniment(acc)}
                          />
                          <label htmlFor={acc.id} className="text-sm cursor-pointer">
                            {acc.name}
                          </label>
                        </div>
                        <span className="text-sm font-medium">+{formatPrice(acc.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Total Price */}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-lg" style={{ color: restaurant.brand_color || '#F97316' }}>
                    {formatPrice(calculatePrice() * quantity)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {cartItemsForThisItem.length > 0 && (
              <div className="flex items-center gap-2">
                {cartItemsForThisItem.map((cartItem) => (
                  <Badge 
                    key={cartItem.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => onRemoveFromCart(cartItem.id)}
                  >
                    {cartItem.variation && `${cartItem.variation.name} `}
                    {cartItem.accompaniments.length > 0 && `+${cartItem.accompaniments.length} `}
                    ✕
                  </Badge>
                ))}
              </div>
            )}
            
            <button
              onClick={handleAddToCart}
              className={`${getButtonClassName()} px-4 py-2 text-white flex items-center gap-2`}
              style={{ backgroundColor: restaurant.brand_color || '#F97316' }}
            >
              {hasOptions && !showOptions ? (
                <>
                  <span>Options</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add {showOptions && `(${quantity})`}</span>
                </>
              )}
            </button>

            {showOptions && (
              <button
                onClick={() => {
                  setShowOptions(false);
                  setQuantity(1);
                  setSelectedAccompaniments([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
