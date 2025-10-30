import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Settings } from 'lucide-react';
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
  fileToBase64,
  validateExtractedData,
  type ExtractedMenuData,
  type AIProvider,
} from '@/lib/services/ai-menu-import';

interface Restaurant {
  id: string;
  name: string;
}

interface MenuGroup {
  id: string;
  name: string;
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

  // Check if API key exists in localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    const savedKey = localStorage.getItem(`${savedProvider || 'huggingface'}_api_key`);
    
    if (savedProvider) {
      setAiProvider(savedProvider);
    }
    
    if (savedKey) {
      setApiKey(savedKey);
      if (savedProvider === 'openai') {
        initializeOpenAI(savedKey);
      } else {
        initializeHuggingFace(savedKey);
      }
      setProvider(savedProvider || 'huggingface');
      setIsApiKeySet(true);
    }
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

      // Don't auto-select - let user choose
      // This fixes the issue where selection gets stuck
    } catch (error: any) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    }
  };

  const fetchMenuGroups = async (restaurantId: string) => {
    try {
      // Note: There's no menu_groups table - categories belong directly to restaurants
      // This function is kept for backwards compatibility but returns empty
      setMenuGroups([]);
    } catch (error: any) {
      console.error('Error fetching menu groups:', error);
      toast.error('Failed to load menu groups');
    }
  };

  const fetchCategories = async (restaurantId: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleApiKeySubmit = () => {
    if (aiProvider === 'openai' && !apiKey.trim()) {
      toast.error('Please enter your OpenAI API key');
      return;
    }

    try {
      if (aiProvider === 'openai') {
        initializeOpenAI(apiKey);
        localStorage.setItem(`${aiProvider}_api_key`, apiKey);
      } else {
        // Hugging Face uses free OCR.space, no API key needed
        initializeHuggingFace('free'); // Placeholder
      }
      setProvider(aiProvider);
      localStorage.setItem('ai_provider', aiProvider);
      setIsApiKeySet(true);
      toast.success(aiProvider === 'openai' ? 'API key saved successfully' : 'Free OCR activated!');
    } catch (error: any) {
      toast.error('Configuration failed');
    }
  };

  const handleProviderChange = (provider: AIProvider) => {
    setAiProvider(provider);
    setIsApiKeySet(false);
    const savedKey = localStorage.getItem(`${provider}_api_key`);
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setApiKey('');
    }
  };

  const handleContinueToUpload = () => {
    if (!selectedRestaurant) {
      toast.error('Please select a restaurant');
      return;
    }

    if (aiProvider === 'openai' && !isApiKeySet) {
      toast.error('Please configure your OpenAI API key');
      return;
    }

    // Auto-activate free OCR for Hugging Face
    if (aiProvider === 'huggingface' && !isApiKeySet) {
      initializeHuggingFace('free');
      setProvider('huggingface');
      setIsApiKeySet(true);
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

    setIsProcessing(true);
    setProgress(0);

    try {
      let data: ExtractedMenuData;
      
      // Check if file is PDF or image
      if (selectedFile.type === 'application/pdf') {
        // Handle PDF
        setProgress(20);
        toast.info('Processing PDF...');
        
        setProgress(50);
        toast.info('Extracting text from PDF...');
        data = await extractMenuFromPDF(selectedFile);
      } else {
        // Handle images
        setProgress(20);
        toast.info('Converting image...');
        const base64 = await fileToBase64(selectedFile);
        
        setProgress(50);
        toast.info('Extracting menu data with AI...');
        data = await extractMenuFromImage(base64, selectedFile.type);
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
      toast.success(`Successfully extracted ${data.categories.reduce((sum, cat) => sum + cat.items.length, 0)} items!`);
      
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

    setCurrentStep('importing');

    try {
      let importedCount = 0;

      // Import each category and its items
      for (const category of data.categories) {
        // Check if category exists or create new one
        let categoryId = selectedCategory;

        if (!categoryId) {
          // Create new category
          const { data: newCategory, error: categoryError } = await supabase
            .from('categories')
            .insert({
              restaurant_id: selectedRestaurant,
              name: category.name,
              description: category.description,
              is_active: true,
            })
            .select('id')
            .single();

          if (categoryError) throw categoryError;
          categoryId = newCategory.id;
        }

        // Import menu items
        const itemsToInsert = category.items.map((item) => ({
          restaurant_id: selectedRestaurant,
          category_id: categoryId,
          name: item.name,
          description: item.description || null,
          base_price: item.price,
          is_available: true,
        }));

        const { error: itemsError } = await supabase
          .from('menu_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        importedCount += itemsToInsert.length;
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
    navigate('/menu-management');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
                        Menu Group
                        <span className="text-sm text-gray-500 ml-2">
                          Select which menu to import into
                        </span>
                      </Label>
                      <Select
                        value={selectedMenuGroup}
                        onValueChange={setSelectedMenuGroup}
                      >
                        <SelectTrigger id="menuGroup">
                          <SelectValue placeholder="Choose a menu group" />
                        </SelectTrigger>
                        <SelectContent>
                          {menuGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedMenuGroup && (
                      <div>
                        <Label htmlFor="category">
                          Category (Optional)
                          <span className="text-sm text-gray-500 ml-2">
                            Leave empty to create new categories
                          </span>
                        </Label>
                        <Select
                          value={selectedCategory}
                          onValueChange={setSelectedCategory}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Create new categories automatically" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
    </div>
  );
}
