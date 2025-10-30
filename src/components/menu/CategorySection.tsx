import MenuItem from "./MenuItem";

interface CategorySectionProps {
  category: {
    id: string;
    name: string;
    display_order: number;
  };
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    base_price: number;
    image_url: string | null;
    category_id: string;
  }>;
  variations: Array<{
    id: string;
    menu_item_id: string;
    name: string;
    price_modifier: number;
  }>;
  accompaniments: Array<{
    id: string;
    menu_item_id: string;
    name: string;
    price: number;
    is_required: boolean;
  }>;
  onAddToCart: (item: any, variation?: any, accompaniments?: any[]) => void;
  formatPrice: (price: number) => string;
}

const CategorySection = ({ 
  category, 
  items, 
  variations, 
  accompaniments, 
  onAddToCart, 
  formatPrice 
}: CategorySectionProps) => {
  const categoryItems = items.filter(item => item.category_id === category.id);
  
  if (categoryItems.length === 0) return null;

  return (
    <>
      {categoryItems.map((item) => {
        const itemVariations = variations.filter(v => v.menu_item_id === item.id);
        const itemAccompaniments = accompaniments.filter(a => a.menu_item_id === item.id);
        
        return (
          <MenuItem
            key={item.id}
            item={item}
            variations={itemVariations}
            accompaniments={itemAccompaniments}
            onAddToCart={onAddToCart}
            formatPrice={formatPrice}
          />
        );
      })}
    </>
  );
};

export default CategorySection;