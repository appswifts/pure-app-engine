import { useState } from "react";
import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";

interface MenuCardProps {
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

export const MenuCard = ({
  item,
  variations = [],
  accompaniments = [],
  onAddToCart,
  formatPrice,
}: MenuCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(variations[0]);
  const [selectedAccompaniments, setSelectedAccompaniments] = useState<any[]>([]);

  const hasOptions = variations.length > 0 || accompaniments.length > 0;
  const requiredAccompaniments = accompaniments.filter(a => a.is_required);
  const optionalAccompaniments = accompaniments.filter(a => !a.is_required);

  const calculateTotalPrice = () => {
    const variationPrice = selectedVariation?.price_modifier || 0;
    const accompanimentsPrice = selectedAccompaniments.reduce((sum, acc) => sum + acc.price, 0);
    return (item.base_price + variationPrice + accompanimentsPrice) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(
      item,
      selectedVariation,
      selectedAccompaniments
    );
    // Reset after adding to cart
    setQuantity(1);
    setSelectedAccompaniments([]);
    setShowOptions(false);
  };

  const toggleAccompaniment = (accompaniment: any) => {
    setSelectedAccompaniments(prev => 
      prev.some(a => a.id === accompaniment.id)
        ? prev.filter(a => a.id !== accompaniment.id)
        : [...prev, accompaniment]
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-4">
      <div className="flex p-4">
        {/* Item Image */}
        {item.image_url && (
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 mr-4">
            <SafeImage
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          )}
          <div className="mt-2">
            <span className="text-lg font-bold text-purple-600">
              {formatPrice(calculateTotalPrice())}
            </span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center ml-2">
          <button
            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-purple-400 text-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="mx-2 text-gray-900 font-medium w-6 text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(prev => prev + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-purple-400 text-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Options Toggle */}
      {hasOptions && (
        <div 
          className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex justify-between items-center cursor-pointer"
          onClick={() => setShowOptions(!showOptions)}
        >
          <span className="text-sm font-medium text-gray-700">
            Customize options
          </span>
          {showOptions ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      )}

      {/* Options Panel */}
      {showOptions && hasOptions && (
        <div className="p-4 border-t border-gray-100">
          {/* Variations */}
          {variations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Choose size</h4>
              <div className="space-y-2">
                {variations.map((variation) => (
                  <label key={variation.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="variation"
                        checked={selectedVariation?.id === variation.id}
                        onChange={() => setSelectedVariation(variation)}
                        className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {variation.name}
                      </span>
                    </div>
                    {variation.price_modifier > 0 && (
                      <span className="text-sm font-medium text-purple-600">
                        +{formatPrice(variation.price_modifier)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Required Accompaniments */}
          {requiredAccompaniments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Required Add-ons</h4>
              <div className="space-y-2">
                {requiredAccompaniments.map((acc) => (
                  <label key={acc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAccompaniments.some(a => a.id === acc.id)}
                        onChange={() => toggleAccompaniment(acc)}
                        className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        required
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {acc.name}
                      </span>
                    </div>
                    {acc.price > 0 && (
                      <span className="text-sm font-medium text-purple-600">
                        +{formatPrice(acc.price)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Optional Accompaniments */}
          {optionalAccompaniments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Optional Add-ons</h4>
              <div className="space-y-2">
                {optionalAccompaniments.map((acc) => (
                  <label key={acc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAccompaniments.some(a => a.id === acc.id)}
                        onChange={() => toggleAccompaniment(acc)}
                        className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {acc.name}
                      </span>
                    </div>
                    {acc.price > 0 && (
                      <span className="text-sm font-medium text-purple-600">
                        +{formatPrice(acc.price)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Add to Order - {formatPrice(calculateTotalPrice())}
          </Button>
        </div>
      )}
    </div>
  );
};
