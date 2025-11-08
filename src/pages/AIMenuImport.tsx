import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Settings } from 'lucide-react';
import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AIMenuUploader } from '@/components/menu/AIMenuUploader';
import { ImportPreview } from '@/components/menu/ImportPreview';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  initializeOpenAI,
  initializeHuggingFace,
  setProvider,
  extractMenuFromImage,
  extractMenuFromPDF,
  extractMenuFromFile,
  fileToBase64,
  validateExtractedData,
  detectFileType,
  type ExtractedMenuData,
  type AIProvider,
  type SupportedFileType,
} from '@/lib/services/ai-menu-import';

interface Restaurant {
  id: string;
  name: string;
}

interface MenuGroup {
  id: string;
  name: string;
  slug: string;
  restaurant_id: string;
}

interface Category {
  id: string;
  name: string;
}

type ImportStep = 'setup' | 'upload' | 'preview' | 'importing' | 'complete';

export default function AIMenuImport() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<ImportStep>('setup');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [selectedMenuGroup, setSelectedMenuGroup] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('huggingface');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedMenuData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  // Set provider - using Lovable AI with automatic fallback
  useEffect(() => {
    setProvider('huggingface');
    setIsApiKeySet(true);
  }, []);

  // Fetch user's restaurants
  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Fetch menu groups when restaurant is selected
  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuGroups(selectedRestaurant);
    } else {
      setMenuGroups([]);
      setSelectedMenuGroup('');
    }
  }, [selectedRestaurant]);

  // Fetch categories when menu group is selected
  useEffect(() => {
    if (selectedMenuGroup) {
      fetchCategories(selectedMenuGroup);
    } else {
      setCategories([]);
      setSelectedCategory('');
    }
  }, [selectedMenuGroup]);

  const fetchRestaurants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to continue');
        navigate('/restaurant-login');
        return;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setRestaurants(data || []);

      // Auto-select if only one restaurant
      if (data && data.length === 1) {
        setSelectedRestaurant(data[0].id);
        toast.success(`Auto-selected: ${data[0].name}`);
      }
    } catch (error: any) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    }
  };

  const fetchMenuGroups = async (restaurantId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('menu_groups')
        .select('id, name, slug, restaurant_id, currency')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      setMenuGroups(data || []);
      
      // Auto-select first menu group if available
      if (data && data.length > 0) {
        setSelectedMenuGroup(data[0].id);
        toast.success(`Auto-selected: ${data[0].name}`);
      } else {
        setSelectedMenuGroup('');
        toast.info('No menu groups found. Create one in Menu Management first.');
      }
    } catch (error: any) {
      console.error('Error fetching menu groups:', error);
      toast.error('Failed to load menu groups');
      setMenuGroups([]);
    }
  };

  const fetchCategories = async (menuGroupId: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('menu_group_id', menuGroupId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      setCategories(data || []);
      
      // Show info about existing categories
      if (data && data.length > 0) {
        console.log(`Loaded ${data.length} existing categories for smart matching`);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    }
  };

  const handleApiKeySubmit = () => {
    // No longer needed - provider is server-side
    setIsApiKeySet(true);
    toast.success('AI extraction is ready!');
  };

  const handleProviderChange = (provider: AIProvider) => {
    setAiProvider(provider);
  };

  const handleContinueToUpload = () => {
    if (!selectedRestaurant) {
      toast.error('Please select a restaurant');
      return;
    }

    setCurrentStep('upload');
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemoved = () => {
    setSelectedFile(null);
    setExtractedData(null);
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    if (!selectedRestaurant) {
      toast.error('Please select a restaurant first');
      return;
    }

    if (!selectedMenuGroup) {
      toast.error('Please select a menu group first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const fileType = detectFileType(selectedFile);
      const fileTypeNames: Record<SupportedFileType, string> = {
        image: 'image',
        pdf: 'PDF',
        csv: 'CSV',
        excel: 'Excel'
      };
      
      setProgress(10);
      toast.info(`Processing ${fileTypeNames[fileType]} file...`);
      
      // Get existing categories for smart matching
      setProgress(20);
      const existingCats = categories.map(cat => ({ id: cat.id, name: cat.name }));
      
      setProgress(30);
      toast.info('Extracting menu data with AI...');
      
      // Use intelligent extraction with category matching
      const data = await extractMenuFromFile(selectedFile, existingCats);
      
      // Show category matching results
      if (data.categoryMatches && data.categoryMatches.size > 0) {
        let matchCount = 0;
        let createCount = 0;
        
        data.categoryMatches.forEach((result: any) => {
          if (result.match) matchCount++;
          else if (result.shouldCreate) createCount++;
        });
        
        if (matchCount > 0) {
          toast.success(`Matched ${matchCount} existing categor${matchCount === 1 ? 'y' : 'ies'}`);
        }
        if (createCount > 0) {
          toast.info(`Will create ${createCount} new categor${createCount === 1 ? 'y' : 'ies'}`);
        }
      }
      
      // Validate extracted data
      setProgress(80);
      const validationErrors = validateExtractedData(data);
      
      if (validationErrors.length > 0) {
        toast.warning(`Found ${validationErrors.length} validation issues. Please review the data.`);
        console.warn('Validation errors:', validationErrors);
      }

      setProgress(100);
      setExtractedData(data);
      setCurrentStep('preview');
      
      const itemCount = data.categories.reduce((sum: number, cat: any) => sum + cat.items.length, 0);
      const catCount = data.categories.length;
      toast.success(`Successfully extracted ${itemCount} items in ${catCount} categor${catCount === 1 ? 'y' : 'ies'}!`);
      
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast.error(error.message || 'Failed to process file');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleImportConfirm = async (data: ExtractedMenuData) => {
    if (!selectedRestaurant) {
      toast.error('No restaurant selected');
      return;
    }

    if (!selectedMenuGroup) {
      toast.error('No menu group selected');
      return;
    }

    setCurrentStep('importing');

    try {
      let importedCount = 0;
      let createdCategories = 0;
      let matchedCategories = 0;

      // Import each category and its items
      for (const category of data.categories) {
        let categoryId: string | null = null;

        // Check if we should use smart matching
        if (selectedCategory === '__auto__' || !selectedCategory) {
          // Try to find matching category with improved fuzzy matching
          const existingCategories = categories;
          
          // Normalize category name for matching
          const normalizedName = category.name.toLowerCase().trim();
          
          // Try exact match first
          let categoryMatch = existingCategories.find(
            cat => cat.name.toLowerCase().trim() === normalizedName
          );
          
          // If no exact match, try fuzzy matching (handle plurals, variations)
          if (!categoryMatch) {
            categoryMatch = existingCategories.find(cat => {
              const existingNormalized = cat.name.toLowerCase().trim();
              
              // Remove trailing 's' to handle plural/singular
              const singularNew = normalizedName.replace(/s$/, '');
              const singularExisting = existingNormalized.replace(/s$/, '');
              
              // Match if singular forms are the same
              if (singularNew === singularExisting) return true;
              
              // Match if one contains the other (e.g., "Main Dishes" vs "Main")
              if (existingNormalized.includes(normalizedName) || normalizedName.includes(existingNormalized)) {
                return Math.abs(existingNormalized.length - normalizedName.length) < 5;
              }
              
              return false;
            });
          }

          if (categoryMatch) {
            categoryId = categoryMatch.id;
            matchedCategories++;
            console.log(`✓ Matched category: "${category.name}" → "${categoryMatch.name}"`);
          }
        } else {
          // User manually selected a category - use it for ALL items
          categoryId = selectedCategory;
        }

        // Create new category if no match found
        if (!categoryId) {
          const { data: newCategory, error: categoryError } = await supabase
            .from('categories')
            .insert({
              menu_group_id: selectedMenuGroup,
              restaurant_id: selectedRestaurant,
              name: category.name,
              description: category.description || null,
              is_active: true,
              display_order: 999,
            })
            .select('id')
            .single();

          if (categoryError) {
            console.error('Category creation error:', categoryError);
            throw categoryError;
          }
          
          categoryId = newCategory.id;
          createdCategories++;
          console.log(`✓ Created new category: ${category.name}`);
        }

        // Import menu items (with AI-generated images if available)
        const itemsToInsert = category.items.map((item) => ({
          restaurant_id: selectedRestaurant,
          category_id: categoryId,
          name: item.name,
          description: item.description || null,
          base_price: item.price,
          image_url: item.image_url || null,
          is_available: true,
        }));

        const { error: itemsError } = await supabase
          .from('menu_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Items insertion error:', itemsError);
          throw itemsError;
        }

        importedCount += itemsToInsert.length;
        console.log(`✓ Imported ${itemsToInsert.length} items for ${category.name}`);
      }

      // Show summary
      if (matchedCategories > 0) {
        toast.success(`✓ Matched ${matchedCategories} existing categor${matchedCategories === 1 ? 'y' : 'ies'}`);
      }
      if (createdCategories > 0) {
        toast.success(`✓ Created ${createdCategories} new categor${createdCategories === 1 ? 'y' : 'ies'}`);
      }

      // Record the import (optional - ai_imports table doesn't exist yet)
      // You can uncomment this after creating the ai_imports table
      // await supabase.from('ai_imports').insert({
      //   restaurant_id: selectedRestaurant,
      //   category_id: selectedCategory || null,
      //   file_url: '',
      //   file_name: selectedFile?.name || 'unknown',
      //   file_type: selectedFile?.type || 'image/*',
      //   status: 'completed',
      //   extracted_data: data,
      //   items_imported: importedCount,
      //   completed_at: new Date().toISOString(),
      // });

      setCurrentStep('complete');
      toast.success(`Successfully imported ${importedCount} menu items!`);

    } catch (error: any) {
      console.error('Error importing menu:', error);
      toast.error('Failed to import menu items');
      setCurrentStep('preview');
    }
  };

  const handleStartOver = () => {
    setCurrentStep('setup');
    setSelectedFile(null);
    setExtractedData(null);
    setSelectedCategory('');
  };

  const handleViewMenu = () => {
    if (selectedMenuGroup) {
      // Find the selected menu group to get its slug
      const menuGroup = menuGroups.find(g => g.id === selectedMenuGroup);
      if (menuGroup?.slug) {
        // Navigate using the clean slug URL
        navigate(`/dashboard/menu-groups/${menuGroup.slug}`);
      } else {
        // Fallback if no slug found
        navigate('/dashboard/menu');
      }
    } else {
      // Fallback to general menu page
      navigate('/dashboard/menu');
    }
  };

  return (
    <ModernDashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Menu Import
              </h1>
              <p className="text-gray-600 mt-1">
                Upload your menu image and let AI extract all items automatically
              </p>
            </div>
          </div>
        </div>

        {/* Setup Step */}
        {currentStep === 'setup' && (
          <div className="space-y-6">
            {/* Restaurant Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Select Restaurant</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="restaurant">Restaurant *</Label>
                  <Select
                    value={selectedRestaurant}
                    onValueChange={setSelectedRestaurant}
                  >
                    <SelectTrigger id="restaurant">
                      <SelectValue placeholder="Choose a restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRestaurant && (
                  <>
                    <div>
                      <Label htmlFor="menuGroup">
                        Menu Group *
                        <span className="text-sm text-gray-500 ml-2">
                          Select which cuisine/menu to import into
                        </span>
                      </Label>
                      <Select
                        value={selectedMenuGroup}
                        onValueChange={setSelectedMenuGroup}
                      >
                        <SelectTrigger id="menuGroup">
                          <SelectValue placeholder={
                            menuGroups.length === 0 
                              ? "No menu groups found - create one in Menu Management" 
                              : "Choose a menu group (cuisine)"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {menuGroups.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No menu groups available.
                              <br />
                              Create one in Menu Management first.
                            </div>
                          ) : (
                            menuGroups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {menuGroups.length === 0 && (
                        <p className="text-sm text-orange-600 mt-2">
                          ⚠️ Please create a menu group in Menu Management before importing
                        </p>
                      )}
                      {menuGroups.length > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {menuGroups.length} menu group{menuGroups.length !== 1 ? 's' : ''} available
                        </p>
                      )}
                    </div>

                    {selectedMenuGroup && (
                      <div>
                        <Label htmlFor="category">
                          Category (Optional)
                          <span className="text-sm text-gray-500 ml-2">
                            AI will auto-match or create new categories
                          </span>
                        </Label>
                        <Select
                          value={selectedCategory}
                          onValueChange={setSelectedCategory}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder={
                              categories.length === 0 
                                ? "No existing categories - AI will create new ones" 
                                : "Auto-detect categories (recommended)"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No existing categories.
                                <br />
                                AI will create new ones automatically.
                              </div>
                            ) : (
                              <>
                                <SelectItem value="__auto__">
                                  🤖 Auto-detect (recommended)
                                </SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {categories.length > 0 && (
                          <p className="text-sm text-blue-600 mt-2">
                            ℹ️ {categories.length} existing categor{categories.length !== 1 ? 'ies' : 'y'} - AI will match automatically
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* API Key Configuration */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">AI Provider Configuration</h3>
                {isApiKeySet && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Configured
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider">AI Provider *</Label>
                  <Select
                    value={aiProvider}
                    onValueChange={(value) => handleProviderChange(value as AIProvider)}
                    disabled={isApiKeySet}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="huggingface">
                        🤗 Hugging Face (Free OCR) - 100% FREE
                      </SelectItem>
                      <SelectItem value="openai">
                        OpenAI (GPT-4 Vision) - Paid (~$0.03/image)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {aiProvider === 'huggingface' 
                      ? '✨ 100% Free - No API key, No registration, Unlimited usage!'
                      : '💰 Paid option - Requires OpenAI account'}
                  </p>
                </div>

                {/* Only show API key field for OpenAI */}
                {aiProvider === 'openai' && (
                  <div>
                    <Label htmlFor="apiKey">
                      OpenAI API Key {!isApiKeySet && '*'}
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        disabled={isApiKeySet}
                      />
                      {!isApiKeySet ? (
                        <Button onClick={handleApiKeySubmit}>
                          <Settings className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsApiKeySet(false);
                            setApiKey('');
                            localStorage.removeItem(`${aiProvider}_api_key`);
                          }}
                        >
                          Change
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Get your API key from{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        OpenAI Platform
                      </a>
                    </p>
                  </div>
                )}
                
                {/* Show info for free option */}
                {aiProvider === 'huggingface' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-2xl">🎉</span>
                      <div>
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          100% Free Forever!
                        </p>
                        <p className="text-sm text-green-800">
                          No API keys required, no registration, no hidden costs. Uses free OCR.space for text extraction and Hugging Face for AI image generation. Just select your restaurant and start uploading!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleContinueToUpload}
                disabled={!selectedRestaurant || (aiProvider === 'openai' && !isApiKeySet)}
              >
                Continue to Upload
              </Button>
            </div>
          </div>
        )}

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <Card className="p-6">
              <AIMenuUploader
                onFileSelected={handleFileSelected}
                onFileRemoved={handleFileRemoved}
                isProcessing={isProcessing}
                progress={progress}
              />

              <div className="flex justify-between mt-6 pt-6 border-t">
                <Button variant="outline" onClick={() => setCurrentStep('setup')}>
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={handleProcessFile}
                  disabled={!selectedFile || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Extract Menu Data
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && extractedData && (
          <Card className="p-6">
            <ImportPreview
              extractedData={extractedData}
              onConfirm={handleImportConfirm}
              onCancel={() => setCurrentStep('upload')}
              isImporting={false}
            />
          </Card>
        )}

        {/* Importing Step */}
        {currentStep === 'importing' && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Importing Menu Items...</h3>
            <p className="text-gray-600">
              Please wait while we add your menu items to the database
            </p>
          </Card>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Import Completed!
            </h3>
            <p className="text-gray-600 mb-8">
              Your menu items have been successfully imported
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="lg" onClick={handleStartOver}>
                Import Another Menu
              </Button>
              <Button size="lg" onClick={handleViewMenu}>
                View Menu Items
              </Button>
            </div>
          </Card>
        )}
      </div>
    </ModernDashboardLayout>
  );
}
