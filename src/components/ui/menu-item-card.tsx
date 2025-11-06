import * as React from "react";
import { motion } from "framer-motion";
import { Edit2, Trash2, Eye, EyeOff, UtensilsCrossed, Plus, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddVariationDialog } from "./add-variation-dialog";
import { AddAccompanimentDialog } from "./add-accompaniment-dialog";

export interface MenuItemCardProps {
  id: string;
  name: string;
  description?: string | null;
  base_price: number;
  image_url?: string | null;
  is_available: boolean;
  is_accompaniment?: boolean;
  restaurant_id: string;
  item_variations?: Array<{
    id: string;
    name: string;
    price_modifier: number;
  }>;
  accompaniments?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh?: () => void;
  formatPrice: (price: number) => string;
  className?: string;
}

export const MenuItemCard = React.forwardRef<HTMLDivElement, MenuItemCardProps>(
  (
    {
      id,
      name,
      description,
      base_price,
      image_url,
      is_available,
      is_accompaniment = false,
      restaurant_id,
      item_variations = [],
      accompaniments = [],
      onEdit,
      onDelete,
      onRefresh,
      formatPrice,
      className,
    },
    ref
  ) => {
    const [showVariationDialog, setShowVariationDialog] = React.useState(false);
    const [showAccompanimentDialog, setShowAccompanimentDialog] = React.useState(false);

    // Animation variants
    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          when: "beforeChildren",
          staggerChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, x: -10 },
      visible: { opacity: 1, x: 0 },
    };

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        className={cn("w-full", className)}
      >
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/50 bg-card">
          {/* Image Section */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted via-muted/80 to-muted/60">
            {image_url ? (
              <motion.img
                src={image_url}
                alt={name}
                className="w-full h-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
              />
            ) : (
              <motion.div
                className="w-full h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <UtensilsCrossed className="h-20 w-20 text-muted-foreground/20" />
              </motion.div>
            )}

            {/* Status Badges - Top Right */}
            <motion.div
              className="absolute top-3 right-3 flex flex-col gap-2 items-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge
                variant={is_available ? "default" : "secondary"}
                className="shadow-lg backdrop-blur-sm font-medium"
              >
                {is_available ? (
                  <>
                    <Eye className="h-3 w-3 mr-1.5" />
                    Available
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1.5" />
                    Unavailable
                  </>
                )}
              </Badge>
              {is_accompaniment && (
                <Badge
                  variant="outline"
                  className="shadow-lg backdrop-blur-sm font-medium bg-background/90"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  Accompaniment
                </Badge>
              )}
            </motion.div>

            {/* Action Buttons - Top Left */}
            <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 shadow-lg backdrop-blur-md bg-background/90 hover:bg-background"
                  onClick={onEdit}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-9 w-9 shadow-lg backdrop-blur-md"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>

          <CardContent className="p-6">
            <motion.div variants={itemVariants} className="space-y-4">
              {/* Title */}
              <motion.div>
                <h3 className="font-bold text-xl leading-tight mb-2 line-clamp-2 text-card-foreground">
                  {name}
                </h3>
                {description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {description}
                  </p>
                )}
              </motion.div>

              {/* Price Section */}
              <motion.div
                variants={itemVariants}
                className="flex items-baseline justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Base Price
                  </span>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(base_price)}
                  </p>
                </div>

                {/* Count Badges */}
                <div className="flex flex-col items-end gap-1">
                  {item_variations && item_variations.length > 0 && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      <Layers className="h-3 w-3 mr-1" />
                      {item_variations.length} Variation{item_variations.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {accompaniments && accompaniments.length > 0 && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      <Plus className="h-3 w-3 mr-1" />
                      {accompaniments.length} Extra{accompaniments.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </motion.div>

              {/* Quick Action Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex gap-2 pt-2"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => setShowVariationDialog(true)}
                >
                  <Layers className="h-3 w-3 mr-1.5" />
                  Variations
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => setShowAccompanimentDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  Extras
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>

        {/* Variation Dialog */}
        <AddVariationDialog
          open={showVariationDialog}
          onOpenChange={setShowVariationDialog}
          menuItemId={id}
          menuItemName={name}
          onSuccess={() => onRefresh?.()}
        />

        {/* Accompaniment Dialog */}
        <AddAccompanimentDialog
          open={showAccompanimentDialog}
          onOpenChange={setShowAccompanimentDialog}
          menuItemId={id}
          menuItemName={name}
          restaurantId={restaurant_id}
          onSuccess={() => onRefresh?.()}
          formatPrice={formatPrice}
        />
      </motion.div>
    );
  }
);

MenuItemCard.displayName = "MenuItemCard";
