import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";

interface MenuItemProps {
  item: {
    id: string;
    name: string;
    description: string | null;
    base_price: number;
    image_url: string | null;
  };
  variations: Array<{
    id: string;
    name: string;
    price_modifier: number;
  }>;
  accompaniments: Array<{
    id: string;
    name: string;
    price: number;
    is_required: boolean;
  }>;
  onAddToCart: (item: any, variation?: any, accompaniments?: any[]) => void;
  formatPrice: (price: number) => string;
}

const MenuItem = ({ item, variations, accompaniments, onAddToCart, formatPrice }: MenuItemProps) => {
  const [selectedVariation, setSelectedVariation] = useState(variations[0] || null);
  const [selectedAccompaniments, setSelectedAccompaniments] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);

  const requiredAccompaniments = accompaniments.filter(a => a.is_required);
  const optionalAccompaniments = accompaniments.filter(a => !a.is_required);

  const handleAccompanimentChange = (accompaniment: any, checked: boolean) => {
    if (checked) {
      setSelectedAccompaniments([...selectedAccompaniments, accompaniment]);
    } else {
      setSelectedAccompaniments(selectedAccompaniments.filter(a => a.id !== accompaniment.id));
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = item.base_price;
    const variationPrice = selectedVariation?.price_modifier || 0;
    const accompanimentsPrice = selectedAccompaniments.reduce((sum, acc) => sum + acc.price, 0);
    return (basePrice + variationPrice + accompanimentsPrice) * quantity;
  };

  const canAddToCart = () => {
    const requiredSelected = requiredAccompaniments.every(req => 
      selectedAccompaniments.some(sel => sel.id === req.id)
    );
    return requiredSelected;
  };

  const handleAddToCart = () => {
    if (!canAddToCart()) return;
    
    for (let i = 0; i < quantity; i++) {
      onAddToCart(item, selectedVariation, selectedAccompaniments);
    }
    
    setQuantity(1);
    setSelectedAccompaniments([]);
    setShowDetails(false);
  };

  const hasOptions = variations.length > 0 || accompaniments.length > 0;

  return (
    <>
      {/* Compact Card View */}
      <Card 
        className="w-full mb-4 bg-white rounded-2xl shadow-lg flex items-center px-4 py-3 border-0 font-[Cabin],sans-serif"
        style={{ fontFamily: 'Cabin, sans-serif' }}
      >
        {/* Item Image */}
        {item.image_url && (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 mr-4">
            <SafeImage
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight mb-1 text-black">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-sm text-gray-500 leading-tight mb-1">
              {item.description}
            </p>
          )}
          <div className="text-xl font-bold text-purple-600">
            {formatPrice(calculateTotalPrice())}
          </div>
        </div>
        {/* Quantity Controls */}
        {!hasOptions && (
          <div className="flex items-center gap-3 ml-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                setQuantity(Math.max(1, quantity - 1));
              }}
              className="h-8 w-8 rounded-full border-2 border-purple-400 text-purple-500 hover:bg-purple-100 hover:border-purple-600 transition-colors"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-bold text-black min-w-[24px] text-center">
              {quantity}
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                setQuantity(quantity + 1);
              }}
              className="h-8 w-8 rounded-full border-2 border-purple-400 text-purple-500 hover:bg-purple-100 hover:border-purple-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Detailed Options Modal/Expanded View */}
      {showDetails && hasOptions && (
        <Card className="w-full mb-4 bg-card/98 backdrop-blur-sm border border-primary/20 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
          <CardContent className="p-6 space-y-4">
            {/* Header */}
            <div className="text-center space-y-2 border-b border-border/50 pb-4">
              <h3 className="text-xl font-bold text-foreground">{item.name}</h3>
              {item.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              )}
              <div className="text-2xl font-bold text-primary">
                {formatPrice(calculateTotalPrice())}
              </div>
            </div>

            {/* Variations */}
            {variations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Choose Size:</h4>
                <RadioGroup 
                  value={selectedVariation?.id || ""} 
                  onValueChange={(value) => {
                    const variation = variations.find(v => v.id === value);
                    setSelectedVariation(variation || null);
                  }}
                  className="space-y-2"
                >
                  {variations.map((variation) => (
                    <div key={variation.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={variation.id} id={variation.id} />
                        <Label htmlFor={variation.id} className="cursor-pointer font-medium">
                          {variation.name}
                        </Label>
                      </div>
                      {variation.price_modifier !== 0 && (
                        <span className="text-primary font-semibold">
                          {variation.price_modifier > 0 ? '+' : ''}{formatPrice(variation.price_modifier)}
                        </span>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Required Accompaniments */}
            {requiredAccompaniments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Required Add-ons:</h4>
                <div className="space-y-2">
                  {requiredAccompaniments.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id={acc.id}
                          checked={selectedAccompaniments.some(a => a.id === acc.id)}
                          onCheckedChange={(checked) => handleAccompanimentChange(acc, !!checked)}
                        />
                        <Label htmlFor={acc.id} className="cursor-pointer font-medium">
                          {acc.name}
                        </Label>
                      </div>
                      {acc.price > 0 && (
                        <span className="text-primary font-semibold">+{formatPrice(acc.price)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Accompaniments */}
            {optionalAccompaniments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Optional Add-ons:</h4>
                <div className="space-y-2">
                  {optionalAccompaniments.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id={acc.id}
                          checked={selectedAccompaniments.some(a => a.id === acc.id)}
                          onCheckedChange={(checked) => handleAccompanimentChange(acc, !!checked)}
                        />
                        <Label htmlFor={acc.id} className="cursor-pointer font-medium">
                          {acc.name}
                        </Label>
                      </div>
                      {acc.price > 0 && (
                        <span className="text-primary font-semibold">+{formatPrice(acc.price)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-center space-x-4 py-4 border-t border-border/50">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10 rounded-full border-2 border-primary/20 hover:border-primary hover:bg-primary/10"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
                <span className="text-lg font-bold text-foreground min-w-[24px] text-center">{quantity}</span>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 rounded-full border-2 border-primary/20 hover:border-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowDetails(false)}
                variant="outline"
                size="lg"
                className="flex-1 rounded-full border-2"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddToCart}
                variant="default"
                size="lg"
                disabled={!canAddToCart()}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold"
              >
                Add to Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default MenuItem;