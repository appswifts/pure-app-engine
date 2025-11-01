import { Card, CardContent } from "@/components/ui/card";
import { Globe, Layers, UtensilsCrossed, Settings, Plus } from "lucide-react";

interface MenuHierarchyGuideProps {
  compact?: boolean;
}

export const MenuHierarchyGuide = ({ compact = false }: MenuHierarchyGuideProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-3 bg-muted/30 rounded-lg">
        <Globe className="h-4 w-4" />
        <span className="font-medium">→</span>
        <Layers className="h-4 w-4" />
        <span className="font-medium">→</span>
        <UtensilsCrossed className="h-4 w-4" />
        <span className="font-medium">→</span>
        <Settings className="h-4 w-4" />
        <span className="text-xs ml-2">Menu Structure Flow</span>
      </div>
    );
  }

  return (
    <Card className="border-dashed border-2">
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Menu Structure Guide
        </h3>
        
        <div className="space-y-3">
          {/* Level 1 - Restaurant */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🏪</span>
              </div>
              <div className="w-0.5 h-8 bg-gradient-to-b from-primary/30 to-transparent" />
            </div>
            <div className="flex-1 pt-2">
              <div className="font-semibold text-sm">Restaurant</div>
              <div className="text-xs text-muted-foreground">Your restaurant profile</div>
            </div>
          </div>

          {/* Level 2 - Menu Groups */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500/30 to-transparent" />
            </div>
            <div className="flex-1 pt-2">
              <div className="font-semibold text-sm text-blue-700">Menu Groups (Cuisines)</div>
              <div className="text-xs text-muted-foreground">e.g., Rwandan, Chinese, Italian, Continental</div>
            </div>
          </div>

          {/* Level 3 - Categories */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-green-600" />
              </div>
              <div className="w-0.5 h-8 bg-gradient-to-b from-green-500/30 to-transparent" />
            </div>
            <div className="flex-1 pt-2">
              <div className="font-semibold text-sm text-green-700">Categories</div>
              <div className="text-xs text-muted-foreground">e.g., Appetizers, Main Dishes, Desserts, Beverages</div>
            </div>
          </div>

          {/* Level 4 - Menu Items */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-orange-600" />
              </div>
              <div className="w-0.5 h-8 bg-gradient-to-b from-orange-500/30 to-transparent" />
            </div>
            <div className="flex-1 pt-2">
              <div className="font-semibold text-sm text-orange-700">Menu Items</div>
              <div className="text-xs text-muted-foreground">e.g., Grilled Tilapia, Kung Pao Chicken, Isombe</div>
            </div>
          </div>

          {/* Level 5 - Variations & Accompaniments */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex-1 pt-2">
              <div className="font-semibold text-sm text-purple-700">Variations & Accompaniments</div>
              <div className="text-xs text-muted-foreground">Sizes, styles, sides (e.g., Small/Large, Rice, Fries)</div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>💡 Tip:</strong> Start by creating menu groups for each cuisine type, then add categories within each group.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
