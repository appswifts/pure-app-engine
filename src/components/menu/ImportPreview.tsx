import React, { useState } from 'react';
import { Check, Edit2, Trash2, Plus, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { ExtractedMenuData, ExtractedCategory, ExtractedMenuItem } from '@/lib/services/ai-menu-import';
import { generateMenuItemImages } from '@/lib/services/ai-menu-import';
import { toast } from 'sonner';

interface ImportPreviewProps {
  extractedData: ExtractedMenuData;
  onConfirm: (data: ExtractedMenuData) => void;
  onCancel: () => void;
  isImporting?: boolean;
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({
  extractedData,
  onConfirm,
  onCancel,
  isImporting = false,
}) => {
  const [data, setData] = useState<ExtractedMenuData>(extractedData);
  const [editingItem, setEditingItem] = useState<{
    categoryIndex: number;
    itemIndex: number;
  } | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 });

  const totalItems = data.categories.reduce(
    (sum, cat) => sum + cat.items.length,
    0
  );

  const handleCategoryNameChange = (index: number, name: string) => {
    const newData = { ...data };
    newData.categories[index].name = name;
    setData(newData);
  };

  const handleItemEdit = (
    categoryIndex: number,
    itemIndex: number,
    field: keyof ExtractedMenuItem,
    value: string | number
  ) => {
    const newData = { ...data };
    newData.categories[categoryIndex].items[itemIndex] = {
      ...newData.categories[categoryIndex].items[itemIndex],
      [field]: value,
    };
    setData(newData);
  };

  const handleItemDelete = (categoryIndex: number, itemIndex: number) => {
    const newData = { ...data };
    newData.categories[categoryIndex].items.splice(itemIndex, 1);
    
    // Remove category if it has no items
    if (newData.categories[categoryIndex].items.length === 0) {
      newData.categories.splice(categoryIndex, 1);
    }
    
    setData(newData);
  };

  const handleCategoryDelete = (categoryIndex: number) => {
    const newData = { ...data };
    newData.categories.splice(categoryIndex, 1);
    setData(newData);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleGenerateImages = async () => {
    setIsGeneratingImages(true);
    
    try {
      // Collect all items
      const allItems = data.categories.flatMap(cat => cat.items);
      
      toast.info(`Generating images for ${allItems.length} items...`);
      
      // Generate images
      const imageMap = await generateMenuItemImages(allItems, (current, total) => {
        setImageProgress({ current, total });
      });
      
      // Update items with generated images
      const newData = { ...data };
      newData.categories.forEach(category => {
        category.items.forEach(item => {
          const imageUrl = imageMap.get(item.name);
          if (imageUrl) {
            item.image_url = imageUrl;
          }
        });
      });
      
      setData(newData);
      toast.success('Images generated successfully!');
    } catch (error: any) {
      toast.error('Failed to generate images');
      console.error('Image generation error:', error);
    } finally {
      setIsGeneratingImages(false);
      setImageProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Extracted Menu Data
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Review and edit the extracted items before importing
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">
              {totalItems}
            </div>
            <div className="text-sm text-gray-600">Items Found</div>
            <Badge variant="secondary" className="mt-2">
              {data.categories.length} Categories
            </Badge>
          </div>
        </div>
      </Card>

      {/* Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>📝 Review Before Import:</strong> Edit item names, descriptions, prices, or delete incorrect items.
          <br />
          <strong className="text-purple-600">🎨 Optional:</strong> Generate AI food images below for a professional menu appearance!
        </AlertDescription>
      </Alert>

      {/* Categories and Items */}
      <Accordion type="multiple" className="space-y-4" defaultValue={data.categories.map((_, i) => `category-${i}`)}>
        {data.categories.map((category, categoryIndex) => (
          <AccordionItem
            key={categoryIndex}
            value={`category-${categoryIndex}`}
            className="border rounded-lg"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center space-x-3">
                  <Input
                    value={category.name}
                    onChange={(e) =>
                      handleCategoryNameChange(categoryIndex, e.target.value)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 font-semibold"
                    disabled={isImporting}
                  />
                  <Badge variant="outline">
                    {category.items.length} items
                  </Badge>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isImporting) handleCategoryDelete(categoryIndex);
                  }}
                  className={`p-2 rounded hover:bg-gray-100 cursor-pointer ${
                    isImporting ? 'opacity-50 cursor-not-allowed' : 'text-red-500 hover:text-red-700'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <div className="px-4 pb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Image</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Price (RWF)</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.items.map((item, itemIndex) => {
                      const isEditing =
                        editingItem?.categoryIndex === categoryIndex &&
                        editingItem?.itemIndex === itemIndex;

                      return (
                        <TableRow key={itemIndex}>
                          <TableCell>
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                No image
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={item.name}
                                onChange={(e) =>
                                  handleItemEdit(
                                    categoryIndex,
                                    itemIndex,
                                    'name',
                                    e.target.value
                                  )
                                }
                                className="h-8"
                                autoFocus
                                disabled={isImporting}
                              />
                            ) : (
                              <div className="font-medium">{item.name}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Textarea
                                value={item.description || ''}
                                onChange={(e) =>
                                  handleItemEdit(
                                    categoryIndex,
                                    itemIndex,
                                    'description',
                                    e.target.value
                                  )
                                }
                                className="min-h-[60px]"
                                disabled={isImporting}
                              />
                            ) : (
                              <div className="text-sm text-gray-600 line-clamp-2">
                                {item.description || '-'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                  handleItemEdit(
                                    categoryIndex,
                                    itemIndex,
                                    'price',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="h-8 w-32 ml-auto"
                                disabled={isImporting}
                              />
                            ) : (
                              <div className="font-medium">
                                {formatPrice(item.price)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {isEditing ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingItem(null)}
                                  disabled={isImporting}
                                >
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setEditingItem({ categoryIndex, itemIndex })
                                  }
                                  disabled={isImporting}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleItemDelete(categoryIndex, itemIndex)
                                }
                                className="text-red-500 hover:text-red-700"
                                disabled={isImporting}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* AI Image Generation */}
      {!isGeneratingImages && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ImageIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">🎨 Generate AI Images</h4>
                <p className="text-sm text-gray-600">
                  Create professional food photos for all {totalItems} items using AI Stable Diffusion XL
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  ✨ Free AI • Takes ~{Math.ceil(totalItems * 3 / 60)} min ({totalItems} items × 3s)
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleGenerateImages}
              disabled={isImporting}
              className="border-purple-300 hover:bg-purple-100"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Generate Images
            </Button>
          </div>
        </Card>
      )}
      
      {/* Upload Images Manually Note */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">💡 Optional: Add Images Manually</p>
            <p className="text-sm text-blue-800 mt-1">
              Or upload your own food photos later by editing each menu item in Menu Management.
            </p>
          </div>
        </div>
      </Card>

      {/* Image Generation Progress */}
      {isGeneratingImages && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Generating images: {imageProgress.current} / {imageProgress.total}
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${imageProgress.total > 0 ? (imageProgress.current / imageProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isImporting || isGeneratingImages}
        >
          Cancel
        </Button>

        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            Ready to import <strong>{totalItems}</strong> items
          </div>
          <Button
            onClick={() => onConfirm(data)}
            disabled={isImporting || isGeneratingImages || totalItems === 0}
            size="lg"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm & Import
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
