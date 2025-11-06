import { create } from "zustand";
import { persist } from "zustand/middleware";

// Language configuration
export interface Language {
  code: string;
  name: string;
  localName: string;
  rtl: boolean;
  flag: string;
}

// Supported languages with flags
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", localName: "English", rtl: false, flag: "🇺🇸" },
  { code: "es", name: "Spanish", localName: "Español", rtl: false, flag: "🇪🇸" },
  { code: "fr", name: "French", localName: "Français", rtl: false, flag: "🇫🇷" },
  { code: "de", name: "German", localName: "Deutsch", rtl: false, flag: "🇩🇪" },
  {
    code: "it",
    name: "Italian",
    localName: "Italiano",
    rtl: false,
    flag: "🇮🇹",
  },
  {
    code: "pt",
    name: "Portuguese",
    localName: "Português",
    rtl: false,
    flag: "🇵🇹",
  },
  { code: "ru", name: "Russian", localName: "Русский", rtl: false, flag: "🇷🇺" },
  { code: "ja", name: "Japanese", localName: "日本語", rtl: false, flag: "🇯🇵" },
  { code: "ko", name: "Korean", localName: "한국어", rtl: false, flag: "🇰🇷" },
  { code: "zh", name: "Chinese", localName: "中文", rtl: false, flag: "🇨🇳" },
  { code: "ar", name: "Arabic", localName: "العربية", rtl: true, flag: "🇸🇦" },
  { code: "hi", name: "Hindi", localName: "हिन्दी", rtl: false, flag: "🇮🇳" },
  { code: "bn", name: "Bengali", localName: "বাংলা", rtl: false, flag: "🇧🇩" },
  { code: "ur", name: "Urdu", localName: "اردو", rtl: true, flag: "🇵🇰" },
  { code: "tr", name: "Turkish", localName: "Türkçe", rtl: false, flag: "🇹🇷" },
  {
    code: "nl",
    name: "Dutch",
    localName: "Nederlands",
    rtl: false,
    flag: "🇳🇱",
  },
  { code: "pl", name: "Polish", localName: "Polski", rtl: false, flag: "🇵🇱" },
  { code: "sv", name: "Swedish", localName: "Svenska", rtl: false, flag: "🇸🇪" },
  { code: "th", name: "Thai", localName: "ไทย", rtl: false, flag: "🇹🇭" },
  {
    code: "vi",
    name: "Vietnamese",
    localName: "Tiếng Việt",
    rtl: false,
    flag: "🇻🇳",
  },
  {
    code: "id",
    name: "Indonesian",
    localName: "Bahasa Indonesia",
    rtl: false,
    flag: "🇮🇩",
  },
  {
    code: "ms",
    name: "Malay",
    localName: "Bahasa Melayu",
    rtl: false,
    flag: "🇲🇾",
  },
  {
    code: "sw",
    name: "Swahili",
    localName: "Kiswahili",
    rtl: false,
    flag: "🇰🇪",
  },
  {
    code: "rw",
    name: "Kinyarwanda",
    localName: "Ikinyarwanda",
    rtl: false,
    flag: "🇷🇼",
  },
  { code: "am", name: "Amharic", localName: "አማርኛ", rtl: false, flag: "🇪🇹" },
  { code: "ha", name: "Hausa", localName: "Hausa", rtl: false, flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", localName: "Yorùbá", rtl: false, flag: "🇳🇬" },
  { code: "zu", name: "Zulu", localName: "isiZulu", rtl: false, flag: "🇿🇦" },
  {
    code: "af",
    name: "Afrikaans",
    localName: "Afrikaans",
    rtl: false,
    flag: "🇿🇦",
  },
  { code: "he", name: "Hebrew", localName: "עברית", rtl: true, flag: "🇮🇱" },
];

// Translation keys type for type safety
export interface TranslationKeys {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    clear: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    confirm: string;
    yes: string;
    no: string;
    or: string;
    and: string;
    welcome: string;
    hello: string;
    goodbye: string;
    thankyou: string;
    please: string;
    sorry: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
    price: string;
    total: string;
    currency: string;
    language: string;
    country: string;
    timezone: string;
    date: string;
    time: string;
    status: string;
    active: string;
    inactive: string;
    available: string;
    unavailable: string;
    required: string;
    optional: string;
  };

  // Auth & Account
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    login: string;
    register: string;
    forgotPassword: string;
    resetPassword: string;
    changePassword: string;
    profile: string;
    account: string;
    settings: string;
    password: string;
    confirmPassword: string;
    rememberMe: string;
    newUser: string;
    existingUser: string;
    createAccount: string;
    welcomeBack: string;
    enterEmail: string;
    enterPassword: string;
    emailRequired: string;
    passwordRequired: string;
    invalidEmail: string;
    weakPassword: string;
    passwordMismatch: string;
    loginFailed: string;
    registrationFailed: string;
    accountCreated: string;
    passwordReset: string;
    checkEmail: string;
  };

  // Navigation & Menu
  nav: {
    home: string;
    dashboard: string;
    menu: string;
    orders: string;
    analytics: string;
    settings: string;
    help: string;
    about: string;
    contact: string;
    privacy: string;
    terms: string;
    pricing: string;
    features: string;
    blog: string;
    support: string;
    documentation: string;
  };

  // Dashboard
  dashboard: {
    overview: string;
    menuManagement: string;
    qrCodes: string;
    tables: string;
    subscription: string;
    analytics: string;
    aiImport: string;
    embedCode: string;
    restaurants: string;
    revenue: string;
    customers: string;
    popularItems: string;
    recentOrders: string;
    todaysRevenue: string;
    thisWeek: string;
    thisMonth: string;
    totalRevenue: string;
    totalOrders: string;
    averageOrder: string;
    newCustomers: string;
  };

  // Restaurant Management
  restaurant: {
    restaurant: string;
    restaurants: string;
    addRestaurant: string;
    editRestaurant: string;
    deleteRestaurant: string;
    restaurantName: string;
    restaurantType: string;
    location: string;
    operatingHours: string;
    contactInfo: string;
    whatsappNumber: string;
    logo: string;
    branding: string;
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundStyle: string;
    fontFamily: string;
    customization: string;
    businessDetails: string;
    manageRestaurants: string;
  };

  // Menu Management
  menu: {
    menu: string;
    menus: string;
    menuItem: string;
    menuItems: string;
    addItem: string;
    editItem: string;
    deleteItem: string;
    itemName: string;
    itemDescription: string;
    itemPrice: string;
    itemImage: string;
    category: string;
    categories: string;
    addCategory: string;
    editCategory: string;
    deleteCategory: string;
    menuGroup: string;
    menuGroups: string;
    addGroup: string;
    editGroup: string;
    deleteGroup: string;
    variations: string;
    accompaniments: string;
    dietaryInfo: string;
    allergens: string;
    spiceLevel: string;
    inStock: string;
    outOfStock: string;
    featured: string;
    popular: string;
    new: string;
    recommended: string;
    vegetarian: string;
    vegan: string;
    glutenFree: string;
    halal: string;
    kosher: string;
    keto: string;
    organic: string;
    local: string;
    seasonal: string;
  };

  // Orders
  orders: {
    order: string;
    orders: string;
    newOrder: string;
    orderDetails: string;
    orderStatus: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    tableNumber: string;
    orderTime: string;
    totalAmount: string;
    specialInstructions: string;
    orderItems: string;
    quantity: string;
    unitPrice: string;
    subtotal: string;
    tax: string;
    tip: string;
    orderTotal: string;
    pending: string;
    confirmed: string;
    preparing: string;
    ready: string;
    completed: string;
    cancelled: string;
    refunded: string;
    orderHistory: string;
    recentOrders: string;
    todaysOrders: string;
    placeOrder: string;
    cancelOrder: string;
    markReady: string;
    markCompleted: string;
    printReceipt: string;
    sendToKitchen: string;
    orderReceived: string;
    orderConfirmed: string;
    estimatedTime: string;
    preparationTime: string;
    deliveryTime: string;
    pickupTime: string;
  };

  // QR Codes & Tables
  qr: {
    qrCode: string;
    qrCodes: string;
    generateQR: string;
    downloadQR: string;
    printQR: string;
    customizeQR: string;
    qrSettings: string;
    tableQR: string;
    menuQR: string;
    bulkGenerate: string;
    qrLibrary: string;
    qrName: string;
    qrType: string;
    qrSize: string;
    qrColor: string;
    qrFrame: string;
    qrLogo: string;
    scanToOrder: string;
    viewMenu: string;
    table: string;
    tables: string;
    addTable: string;
    editTable: string;
    deleteTable: string;
    tableName: string;
    tableNumber: string;
    tableCapacity: string;
    tableStatus: string;
    occupied: string;
    vacant: string;
    reserved: string;
    cleaning: string;
    tableManagement: string;
  };

  // Subscriptions & Billing
  subscription: {
    subscription: string;
    subscriptions: string;
    plan: string;
    plans: string;
    currentPlan: string;
    changePlan: string;
    upgradePlan: string;
    downgradePlan: string;
    cancelSubscription: string;
    renewSubscription: string;
    subscriptionStatus: string;
    trialPeriod: string;
    freeTrialRemaining: string;
    billingCycle: string;
    monthly: string;
    yearly: string;
    nextBilling: string;
    paymentMethod: string;
    billingHistory: string;
    invoice: string;
    receipt: string;
    payment: string;
    paymentDue: string;
    paymentOverdue: string;
    paymentSuccess: string;
    paymentFailed: string;
    refund: string;
    discount: string;
    coupon: string;
    promoCode: string;
    basicPlan: string;
    premiumPlan: string;
    enterprisePlan: string;
    features: string;
    featureIncluded: string;
    featureNotIncluded: string;
    unlimited: string;
    limited: string;
    support: string;
    emailSupport: string;
    prioritySupport: string;
    phoneSupport: string;
  };

  // AI & Import
  ai: {
    aiImport: string;
    aiMenuExtraction: string;
    uploadMenu: string;
    scanMenu: string;
    extractItems: string;
    reviewItems: string;
    importItems: string;
    aiProcessing: string;
    extractionComplete: string;
    extractionFailed: string;
    confidenceScore: string;
    autoTranslate: string;
    translateTo: string;
    translation: string;
    translationComplete: string;
    originalText: string;
    translatedText: string;
    approveAll: string;
    rejectAll: string;
    editTranslation: string;
    manualEntry: string;
    bulkImport: string;
    csvImport: string;
    excelImport: string;
    pdfImport: string;
    imageImport: string;
    supportedFormats: string;
    uploadFile: string;
    dragDropFile: string;
    selectFile: string;
    fileUploaded: string;
    fileUploadFailed: string;
    processingFile: string;
  };

  // Customer Interface
  customer: {
    welcome: string;
    welcomeToRestaurant: string;
    viewMenu: string;
    browseMenu: string;
    searchItems: string;
    addToOrder: string;
    removeFromOrder: string;
    yourOrder: string;
    orderSummary: string;
    itemsInOrder: string;
    orderTotal: string;
    proceedToOrder: string;
    sendOrder: string;
    orderViaWhatsApp: string;
    orderViaSMS: string;
    callRestaurant: string;
    specialRequests: string;
    allergies: string;
    preferences: string;
    spicyLevel: string;
    mild: string;
    medium: string;
    hot: string;
    extraHot: string;
    noSpice: string;
    extraSpicy: string;
    onTheSide: string;
    noDressing: string;
    extraSauce: string;
    wellDone: string;
    mediumRare: string;
    rare: string;
    customization: string;
    addNotes: string;
    customerDetails: string;
    enterName: string;
    enterPhone: string;
    tableNumber: string;
    orderPlaced: string;
    thankYouOrder: string;
    estimatedWaitTime: string;
    orderInProgress: string;
    kitchenNotified: string;
    willCallWhenReady: string;
  };

  // Admin
  admin: {
    admin: string;
    adminPanel: string;
    userManagement: string;
    restaurantManagement: string;
    subscriptionManagement: string;
    paymentManagement: string;
    systemSettings: string;
    globalSettings: string;
    analytics: string;
    reports: string;
    logs: string;
    auditLog: string;
    users: string;
    totalUsers: string;
    activeUsers: string;
    inactiveUsers: string;
    newUsers: string;
    userDetails: string;
    userRole: string;
    permissions: string;
    lastLogin: string;
    registrationDate: string;
    suspendUser: string;
    activateUser: string;
    deleteUser: string;
    sendNotification: string;
    broadcastMessage: string;
    systemHealth: string;
    performance: string;
    database: string;
    apiUsage: string;
    errorRate: string;
    uptime: string;
    maintenance: string;
    backup: string;
    restore: string;
  };

  // Errors & Validation
  errors: {
    error: string;
    errorOccurred: string;
    somethingWentWrong: string;
    pageNotFound: string;
    accessDenied: string;
    unauthorized: string;
    forbidden: string;
    serverError: string;
    networkError: string;
    timeout: string;
    validationError: string;
    requiredField: string;
    invalidFormat: string;
    tooShort: string;
    tooLong: string;
    invalidEmail: string;
    invalidPhone: string;
    invalidUrl: string;
    mustBeNumber: string;
    mustBePositive: string;
    fileTooLarge: string;
    fileTypeNotSupported: string;
    uploadFailed: string;
    saveFailed: string;
    loadFailed: string;
    deleteFailed: string;
    updateFailed: string;
    connectionLost: string;
    pleaseRetry: string;
    checkConnection: string;
    contactSupport: string;
    tryAgainLater: string;
  };

  // Success Messages
  success: {
    success: string;
    saved: string;
    updated: string;
    deleted: string;
    created: string;
    uploaded: string;
    sent: string;
    confirmed: string;
    completed: string;
    activated: string;
    deactivated: string;
    approved: string;
    rejected: string;
    imported: string;
    exported: string;
    copied: string;
    moved: string;
    archived: string;
    restored: string;
    synchronized: string;
    backed_up: string;
    published: string;
    unpublished: string;
    installed: string;
    uninstalled: string;
    connected: string;
    disconnected: string;
  };

  // Time & Dates
  time: {
    now: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    thisWeek: string;
    lastWeek: string;
    nextWeek: string;
    thisMonth: string;
    lastMonth: string;
    nextMonth: string;
    thisYear: string;
    lastYear: string;
    nextYear: string;
    minute: string;
    minutes: string;
    hour: string;
    hours: string;
    day: string;
    days: string;
    week: string;
    weeks: string;
    month: string;
    months: string;
    year: string;
    years: string;
    ago: string;
    later: string;
    am: string;
    pm: string;
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
    midnight: string;
    noon: string;
    sunrise: string;
    sunset: string;
  };

  // Days of Week
  days: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
    weekdays: string;
    weekend: string;
    everyday: string;
  };

  // Months
  months: {
    january: string;
    february: string;
    march: string;
    april: string;
    may: string;
    june: string;
    july: string;
    august: string;
    september: string;
    october: string;
    november: string;
    december: string;
    jan: string;
    feb: string;
    mar: string;
    apr: string;
    may_short: string;
    jun: string;
    jul: string;
    aug: string;
    sep: string;
    oct: string;
    nov: string;
    dec: string;
  };

  // Numbers
  numbers: {
    zero: string;
    one: string;
    two: string;
    three: string;
    four: string;
    five: string;
    six: string;
    seven: string;
    eight: string;
    nine: string;
    ten: string;
    first: string;
    second: string;
    third: string;
    fourth: string;
    fifth: string;
    last: string;
    all: string;
    none: string;
    many: string;
    few: string;
    several: string;
    dozen: string;
    hundred: string;
    thousand: string;
    million: string;
    billion: string;
  };
}

// Default translations (English)
export const defaultTranslations: TranslationKeys = {
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    filter: "Filter",
    clear: "Clear",
    back: "Back",
    next: "Next",
    previous: "Previous",
    submit: "Submit",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    or: "or",
    and: "and",
    welcome: "Welcome",
    hello: "Hello",
    goodbye: "Goodbye",
    thankyou: "Thank you",
    please: "Please",
    sorry: "Sorry",
    name: "Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    description: "Description",
    price: "Price",
    total: "Total",
    currency: "Currency",
    language: "Language",
    country: "Country",
    timezone: "Timezone",
    date: "Date",
    time: "Time",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    available: "Available",
    unavailable: "Unavailable",
    required: "Required",
    optional: "Optional",
  },

  auth: {
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    login: "Login",
    register: "Register",
    forgotPassword: "Forgot Password",
    resetPassword: "Reset Password",
    changePassword: "Change Password",
    profile: "Profile",
    account: "Account",
    settings: "Settings",
    password: "Password",
    confirmPassword: "Confirm Password",
    rememberMe: "Remember Me",
    newUser: "New User",
    existingUser: "Existing User",
    createAccount: "Create Account",
    welcomeBack: "Welcome Back",
    enterEmail: "Enter your email",
    enterPassword: "Enter your password",
    emailRequired: "Email is required",
    passwordRequired: "Password is required",
    invalidEmail: "Invalid email address",
    weakPassword: "Password is too weak",
    passwordMismatch: "Passwords do not match",
    loginFailed: "Login failed",
    registrationFailed: "Registration failed",
    accountCreated: "Account created successfully",
    passwordReset: "Password reset successfully",
    checkEmail: "Please check your email",
  },

  nav: {
    home: "Home",
    dashboard: "Dashboard",
    menu: "Menu",
    orders: "Orders",
    analytics: "Analytics",
    settings: "Settings",
    help: "Help",
    about: "About",
    contact: "Contact",
    privacy: "Privacy",
    terms: "Terms",
    pricing: "Pricing",
    features: "Features",
    blog: "Blog",
    support: "Support",
    documentation: "Documentation",
  },

  dashboard: {
    overview: "Overview",
    menuManagement: "Menu Management",
    qrCodes: "QR Codes",
    tables: "Tables",
    subscription: "Subscription",
    analytics: "Analytics",
    aiImport: "AI Import",
    embedCode: "Embed Code",
    restaurants: "Restaurants",
    revenue: "Revenue",
    customers: "Customers",
    popularItems: "Popular Items",
    recentOrders: "Recent Orders",
    todaysRevenue: "Today's Revenue",
    thisWeek: "This Week",
    thisMonth: "This Month",
    totalRevenue: "Total Revenue",
    totalOrders: "Total Orders",
    averageOrder: "Average Order",
    newCustomers: "New Customers",
  },

  restaurant: {
    restaurant: "Restaurant",
    restaurants: "Restaurants",
    addRestaurant: "Add Restaurant",
    editRestaurant: "Edit Restaurant",
    deleteRestaurant: "Delete Restaurant",
    restaurantName: "Restaurant Name",
    restaurantType: "Restaurant Type",
    location: "Location",
    operatingHours: "Operating Hours",
    contactInfo: "Contact Information",
    whatsappNumber: "WhatsApp Number",
    logo: "Logo",
    branding: "Branding",
    theme: "Theme",
    primaryColor: "Primary Color",
    secondaryColor: "Secondary Color",
    backgroundStyle: "Background Style",
    fontFamily: "Font Family",
    customization: "Customization",
    businessDetails: "Business Details",
    manageRestaurants: "Manage Restaurants",
  },

  menu: {
    menu: "Menu",
    menus: "Menus",
    menuItem: "Menu Item",
    menuItems: "Menu Items",
    addItem: "Add Item",
    editItem: "Edit Item",
    deleteItem: "Delete Item",
    itemName: "Item Name",
    itemDescription: "Item Description",
    itemPrice: "Item Price",
    itemImage: "Item Image",
    category: "Category",
    categories: "Categories",
    addCategory: "Add Category",
    editCategory: "Edit Category",
    deleteCategory: "Delete Category",
    menuGroup: "Menu Group",
    menuGroups: "Menu Groups",
    addGroup: "Add Group",
    editGroup: "Edit Group",
    deleteGroup: "Delete Group",
    variations: "Variations",
    accompaniments: "Accompaniments",
    dietaryInfo: "Dietary Information",
    allergens: "Allergens",
    spiceLevel: "Spice Level",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    featured: "Featured",
    popular: "Popular",
    new: "New",
    recommended: "Recommended",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    glutenFree: "Gluten Free",
    halal: "Halal",
    kosher: "Kosher",
    keto: "Keto",
    organic: "Organic",
    local: "Local",
    seasonal: "Seasonal",
  },

  orders: {
    order: "Order",
    orders: "Orders",
    newOrder: "New Order",
    orderDetails: "Order Details",
    orderStatus: "Order Status",
    orderNumber: "Order Number",
    customerName: "Customer Name",
    customerPhone: "Customer Phone",
    tableNumber: "Table Number",
    orderTime: "Order Time",
    totalAmount: "Total Amount",
    specialInstructions: "Special Instructions",
    orderItems: "Order Items",
    quantity: "Quantity",
    unitPrice: "Unit Price",
    subtotal: "Subtotal",
    tax: "Tax",
    tip: "Tip",
    orderTotal: "Order Total",
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
    orderHistory: "Order History",
    recentOrders: "Recent Orders",
    todaysOrders: "Today's Orders",
    placeOrder: "Place Order",
    cancelOrder: "Cancel Order",
    markReady: "Mark Ready",
    markCompleted: "Mark Completed",
    printReceipt: "Print Receipt",
    sendToKitchen: "Send to Kitchen",
    orderReceived: "Order Received",
    orderConfirmed: "Order Confirmed",
    estimatedTime: "Estimated Time",
    preparationTime: "Preparation Time",
    deliveryTime: "Delivery Time",
    pickupTime: "Pickup Time",
  },

  qr: {
    qrCode: "QR Code",
    qrCodes: "QR Codes",
    generateQR: "Generate QR",
    downloadQR: "Download QR",
    printQR: "Print QR",
    customizeQR: "Customize QR",
    qrSettings: "QR Settings",
    tableQR: "Table QR",
    menuQR: "Menu QR",
    bulkGenerate: "Bulk Generate",
    qrLibrary: "QR Library",
    qrName: "QR Name",
    qrType: "QR Type",
    qrSize: "QR Size",
    qrColor: "QR Color",
    qrFrame: "QR Frame",
    qrLogo: "QR Logo",
    scanToOrder: "Scan to Order",
    viewMenu: "View Menu",
    table: "Table",
    tables: "Tables",
    addTable: "Add Table",
    editTable: "Edit Table",
    deleteTable: "Delete Table",
    tableName: "Table Name",
    tableNumber: "Table Number",
    tableCapacity: "Table Capacity",
    tableStatus: "Table Status",
    occupied: "Occupied",
    vacant: "Vacant",
    reserved: "Reserved",
    cleaning: "Cleaning",
    tableManagement: "Table Management",
  },

  subscription: {
    subscription: "Subscription",
    subscriptions: "Subscriptions",
    plan: "Plan",
    plans: "Plans",
    currentPlan: "Current Plan",
    changePlan: "Change Plan",
    upgradePlan: "Upgrade Plan",
    downgradePlan: "Downgrade Plan",
    cancelSubscription: "Cancel Subscription",
    renewSubscription: "Renew Subscription",
    subscriptionStatus: "Subscription Status",
    trialPeriod: "Trial Period",
    freeTrialRemaining: "Free Trial Remaining",
    billingCycle: "Billing Cycle",
    monthly: "Monthly",
    yearly: "Yearly",
    nextBilling: "Next Billing",
    paymentMethod: "Payment Method",
    billingHistory: "Billing History",
    invoice: "Invoice",
    receipt: "Receipt",
    payment: "Payment",
    paymentDue: "Payment Due",
    paymentOverdue: "Payment Overdue",
    paymentSuccess: "Payment Success",
    paymentFailed: "Payment Failed",
    refund: "Refund",
    discount: "Discount",
    coupon: "Coupon",
    promoCode: "Promo Code",
    basicPlan: "Basic Plan",
    premiumPlan: "Premium Plan",
    enterprisePlan: "Enterprise Plan",
    features: "Features",
    featureIncluded: "Feature Included",
    featureNotIncluded: "Feature Not Included",
    unlimited: "Unlimited",
    limited: "Limited",
    support: "Support",
    emailSupport: "Email Support",
    prioritySupport: "Priority Support",
    phoneSupport: "Phone Support",
  },

  ai: {
    aiImport: "AI Import",
    aiMenuExtraction: "AI Menu Extraction",
    uploadMenu: "Upload Menu",
    scanMenu: "Scan Menu",
    extractItems: "Extract Items",
    reviewItems: "Review Items",
    importItems: "Import Items",
    aiProcessing: "AI Processing",
    extractionComplete: "Extraction Complete",
    extractionFailed: "Extraction Failed",
    confidenceScore: "Confidence Score",
    autoTranslate: "Auto Translate",
    translateTo: "Translate To",
    translation: "Translation",
    translationComplete: "Translation Complete",
    originalText: "Original Text",
    translatedText: "Translated Text",
    approveAll: "Approve All",
    rejectAll: "Reject All",
    editTranslation: "Edit Translation",
    manualEntry: "Manual Entry",
    bulkImport: "Bulk Import",
    csvImport: "CSV Import",
    excelImport: "Excel Import",
    pdfImport: "PDF Import",
    imageImport: "Image Import",
    supportedFormats: "Supported Formats",
    uploadFile: "Upload File",
    dragDropFile: "Drag & Drop File",
    selectFile: "Select File",
    fileUploaded: "File Uploaded",
    fileUploadFailed: "File Upload Failed",
    processingFile: "Processing File",
  },

  customer: {
    welcome: "Welcome",
    welcomeToRestaurant: "Welcome to Restaurant",
    viewMenu: "View Menu",
    browseMenu: "Browse Menu",
    searchItems: "Search Items",
    addToOrder: "Add to Order",
    removeFromOrder: "Remove from Order",
    yourOrder: "Your Order",
    orderSummary: "Order Summary",
    itemsInOrder: "Items in Order",
    orderTotal: "Order Total",
    proceedToOrder: "Proceed to Order",
    sendOrder: "Send Order",
    orderViaWhatsApp: "Order via WhatsApp",
    orderViaSMS: "Order via SMS",
    callRestaurant: "Call Restaurant",
    specialRequests: "Special Requests",
    allergies: "Allergies",
    preferences: "Preferences",
    spicyLevel: "Spicy Level",
    mild: "Mild",
    medium: "Medium",
    hot: "Hot",
    extraHot: "Extra Hot",
    noSpice: "No Spice",
    extraSpicy: "Extra Spicy",
    onTheSide: "On the Side",
    noDressing: "No Dressing",
    extraSauce: "Extra Sauce",
    wellDone: "Well Done",
    mediumRare: "Medium Rare",
    rare: "Rare",
    customization: "Customization",
    addNotes: "Add Notes",
    customerDetails: "Customer Details",
    enterName: "Enter Name",
    enterPhone: "Enter Phone",
    tableNumber: "Table Number",
    orderPlaced: "Order Placed",
    thankYouOrder: "Thank You for Your Order",
    estimatedWaitTime: "Estimated Wait Time",
    orderInProgress: "Order in Progress",
    kitchenNotified: "Kitchen Notified",
    willCallWhenReady: "We will call when ready",
  },

  admin: {
    admin: "Admin",
    adminPanel: "Admin Panel",
    userManagement: "User Management",
    restaurantManagement: "Restaurant Management",
    subscriptionManagement: "Subscription Management",
    paymentManagement: "Payment Management",
    systemSettings: "System Settings",
    globalSettings: "Global Settings",
    analytics: "Analytics",
    reports: "Reports",
    logs: "Logs",
    auditLog: "Audit Log",
    users: "Users",
    totalUsers: "Total Users",
    activeUsers: "Active Users",
    inactiveUsers: "Inactive Users",
    newUsers: "New Users",
    userDetails: "User Details",
    userRole: "User Role",
    permissions: "Permissions",
    lastLogin: "Last Login",
    registrationDate: "Registration Date",
    suspendUser: "Suspend User",
    activateUser: "Activate User",
    deleteUser: "Delete User",
    sendNotification: "Send Notification",
    broadcastMessage: "Broadcast Message",
    systemHealth: "System Health",
    performance: "Performance",
    database: "Database",
    apiUsage: "API Usage",
    errorRate: "Error Rate",
    uptime: "Uptime",
    maintenance: "Maintenance",
    backup: "Backup",
    restore: "Restore",
  },

  errors: {
    error: "Error",
    errorOccurred: "An error occurred",
    somethingWentWrong: "Something went wrong",
    pageNotFound: "Page not found",
    accessDenied: "Access denied",
    unauthorized: "Unauthorized",
    forbidden: "Forbidden",
    serverError: "Server error",
    networkError: "Network error",
    timeout: "Timeout",
    validationError: "Validation error",
    requiredField: "This field is required",
    invalidFormat: "Invalid format",
    tooShort: "Too short",
    tooLong: "Too long",
    invalidEmail: "Invalid email address",
    invalidPhone: "Invalid phone number",
    invalidUrl: "Invalid URL",
    mustBeNumber: "Must be a number",
    mustBePositive: "Must be positive",
    fileTooLarge: "File too large",
    fileTypeNotSupported: "File type not supported",
    uploadFailed: "Upload failed",
    saveFailed: "Save failed",
    loadFailed: "Load failed",
    deleteFailed: "Delete failed",
    updateFailed: "Update failed",
    connectionLost: "Connection lost",
    pleaseRetry: "Please retry",
    checkConnection: "Check connection",
    contactSupport: "Contact support",
    tryAgainLater: "Try again later",
  },

  success: {
    success: "Success",
    saved: "Saved",
    updated: "Updated",
    deleted: "Deleted",
    created: "Created",
    uploaded: "Uploaded",
    sent: "Sent",
    confirmed: "Confirmed",
    completed: "Completed",
    activated: "Activated",
    deactivated: "Deactivated",
    approved: "Approved",
    rejected: "Rejected",
    imported: "Imported",
    exported: "Exported",
    copied: "Copied",
    moved: "Moved",
    archived: "Archived",
    restored: "Restored",
    synchronized: "Synchronized",
    backed_up: "Backed up",
    published: "Published",
    unpublished: "Unpublished",
    installed: "Installed",
    uninstalled: "Uninstalled",
    connected: "Connected",
    disconnected: "Disconnected",
  },

  time: {
    now: "Now",
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    nextWeek: "Next Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    nextMonth: "Next Month",
    thisYear: "This Year",
    lastYear: "Last Year",
    nextYear: "Next Year",
    minute: "Minute",
    minutes: "Minutes",
    hour: "Hour",
    hours: "Hours",
    day: "Day",
    days: "Days",
    week: "Week",
    weeks: "Weeks",
    month: "Month",
    months: "Months",
    year: "Year",
    years: "Years",
    ago: "ago",
    later: "later",
    am: "AM",
    pm: "PM",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
    midnight: "Midnight",
    noon: "Noon",
    sunrise: "Sunrise",
    sunset: "Sunset",
  },

  days: {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
    weekdays: "Weekdays",
    weekend: "Weekend",
    everyday: "Everyday",
  },

  months: {
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
    jan: "Jan",
    feb: "Feb",
    mar: "Mar",
    apr: "Apr",
    may_short: "May",
    jun: "Jun",
    jul: "Jul",
    aug: "Aug",
    sep: "Sep",
    oct: "Oct",
    nov: "Nov",
    dec: "Dec",
  },

  numbers: {
    zero: "Zero",
    one: "One",
    two: "Two",
    three: "Three",
    four: "Four",
    five: "Five",
    six: "Six",
    seven: "Seven",
    eight: "Eight",
    nine: "Nine",
    ten: "Ten",
    first: "First",
    second: "Second",
    third: "Third",
    fourth: "Fourth",
    fifth: "Fifth",
    last: "Last",
    all: "All",
    none: "None",
    many: "Many",
    few: "Few",
    several: "Several",
    dozen: "Dozen",
    hundred: "Hundred",
    thousand: "Thousand",
    million: "Million",
    billion: "Billion",
  },
};

// Translation cache
const translationCache = new Map<string, Partial<TranslationKeys>>();

// i18n Store
interface I18nState {
  currentLanguage: string;
  availableLanguages: Language[];
  translations: TranslationKeys;
  isRTL: boolean;
  setLanguage: (languageCode: string) => Promise<void>;
  loadTranslations: (languageCode: string) => Promise<void>;
  t: (key: string) => string;
  formatMessage: (key: string, values?: Record<string, any>) => string;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      currentLanguage: "en",
      availableLanguages: SUPPORTED_LANGUAGES,
      translations: defaultTranslations,
      isRTL: false,

      setLanguage: async (languageCode: string) => {
        const language = SUPPORTED_LANGUAGES.find(
          (lang) => lang.code === languageCode,
        );
        if (!language) return;

        await get().loadTranslations(languageCode);

        set({
          currentLanguage: languageCode,
          isRTL: language.rtl,
        });

        // Update document direction
        document.documentElement.dir = language.rtl ? "rtl" : "ltr";
        document.documentElement.lang = languageCode;
      },

      loadTranslations: async (languageCode: string) => {
        if (languageCode === "en") {
          set({ translations: defaultTranslations });
          return;
        }

        // Check cache first
        if (translationCache.has(languageCode)) {
          const cached = translationCache.get(languageCode);
          set({ translations: { ...defaultTranslations, ...cached } });
          return;
        }

        try {
          // Try to load translations from API or local files
          const response = await fetch(`/locales/${languageCode}.json`);
          if (response.ok) {
            const translations = await response.json();
            translationCache.set(languageCode, translations);
            set({ translations: { ...defaultTranslations, ...translations } });
          } else {
            // Fallback to English if translation file not found
            console.warn(
              `Translation file for ${languageCode} not found, using English`,
            );
            set({ translations: defaultTranslations });
          }
        } catch (error) {
          console.error(
            `Failed to load translations for ${languageCode}:`,
            error,
          );
          set({ translations: defaultTranslations });
        }
      },

      t: (key: string) => {
        const translations = get().translations;
        const keys = key.split(".");
        let value: any = translations;

        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = value[k];
          } else {
            console.warn(`Translation key '${key}' not found`);
            return key;
          }
        }

        return typeof value === "string" ? value : key;
      },

      formatMessage: (key: string, values?: Record<string, any>) => {
        let message = get().t(key);

        if (values) {
          Object.entries(values).forEach(([placeholder, value]) => {
            message = message.replace(
              new RegExp(`{${placeholder}}`, "g"),
              String(value),
            );
          });
        }

        return message;
      },
    }),
    {
      name: "i18n-store",
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
      }),
    },
  ),
);

// Hook for easy usage
export const useTranslation = () => {
  const {
    t,
    formatMessage,
    currentLanguage,
    isRTL,
    setLanguage,
    availableLanguages,
  } = useI18nStore();

  return {
    t,
    formatMessage,
    currentLanguage,
    isRTL,
    setLanguage,
    availableLanguages,
  };
};

// Utility functions
export const detectUserLanguage = (): string => {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get("lang");
  if (urlLang && SUPPORTED_LANGUAGES.some((lang) => lang.code === urlLang)) {
    return urlLang;
  }

  // Check browser language
  const browserLang = navigator.language.split("-")[0];
  if (SUPPORTED_LANGUAGES.some((lang) => lang.code === browserLang)) {
    return browserLang;
  }

  // Default to English
  return "en";
};

export const initializeI18n = async () => {
  const detectedLanguage = detectUserLanguage();
  await useI18nStore.getState().setLanguage(detectedLanguage);
};

// Translation helper for menu items
export const getTranslatedText = (
  translations: Record<string, string> | null | undefined,
  fallbackText: string,
  language: string = "en",
): string => {
  if (!translations || typeof translations !== "object") {
    return fallbackText;
  }

  return translations[language] || translations["en"] || fallbackText;
};

// Currency formatting
export const formatCurrency = (
  amount: number,
  currency: string = "USD",
  locale?: string,
): string => {
  try {
    const currentLanguage = useI18nStore.getState().currentLanguage;
    const formatLocale =
      locale || `${currentLanguage}-${currentLanguage.toUpperCase()}`;

    return new Intl.NumberFormat(formatLocale, {
      style: "currency",
      currency: currency,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${currency} ${amount.toLocaleString()}`;
  }
};

// Number formatting
export const formatNumber = (number: number, locale?: string): string => {
  try {
    const currentLanguage = useI18nStore.getState().currentLanguage;
    const formatLocale =
      locale || `${currentLanguage}-${currentLanguage.toUpperCase()}`;

    return new Intl.NumberFormat(formatLocale).format(number);
  } catch (error) {
    return number.toLocaleString();
  }
};

// Date formatting
export const formatDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
  locale?: string,
): string => {
  try {
    const currentLanguage = useI18nStore.getState().currentLanguage;
    const formatLocale =
      locale || `${currentLanguage}-${currentLanguage.toUpperCase()}`;
    const dateObj = typeof date === "string" ? new Date(date) : date;

    return new Intl.DateTimeFormat(formatLocale, options).format(dateObj);
  } catch (error) {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }
};

// Time formatting
export const formatTime = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
  locale?: string,
): string => {
  try {
    const currentLanguage = useI18nStore.getState().currentLanguage;
    const formatLocale =
      locale || `${currentLanguage}-${currentLanguage.toUpperCase()}`;
    const dateObj = typeof date === "string" ? new Date(date) : date;

    return new Intl.DateTimeFormat(formatLocale, {
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    }).format(dateObj);
  } catch (error) {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleTimeString();
  }
};
