// ==========================================
// بيانات العملات - المحول الذكي الشامل
// الإصدار: 1.0.0
// ==========================================

const currenciesData = [
    // العملات الأكثر بحثاً (مرتبة حسب الأهمية)
    { code: 'USD', name: 'الدولار الأمريكي', symbol: '$', importance: 100 },
    { code: 'SAR', name: 'الريال السعودي', symbol: 'ر.س', importance: 99 },
    { code: 'EGP', name: 'الجنيه المصري', symbol: 'ج.م', importance: 98 },
    { code: 'AED', name: 'الدرهم الإماراتي', symbol: 'د.إ', importance: 97 },
    { code: 'EUR', name: 'اليورو الأوروبي', symbol: '€', importance: 96 },
    { code: 'KWD', name: 'الدينار الكويتي', symbol: 'د.ك', importance: 95 },
    { code: 'GBP', name: 'الجنيه الإسترليني', symbol: '£', importance: 94 },
    { code: 'TRY', name: 'الليرة التركية', symbol: '₺', importance: 93 },
    { code: 'CNY', name: 'اليوان الصيني', symbol: '¥', importance: 92 },
    { code: 'JPY', name: 'الين الياباني', symbol: '¥', importance: 91 },
    { code: 'INR', name: 'الروبية الهندية', symbol: '₹', importance: 90 },
    { code: 'CHF', name: 'الفرنك السويسري', symbol: 'CHF', importance: 89 },
    { code: 'CAD', name: 'الدولار الكندي', symbol: 'C$', importance: 88 },
    { code: 'AUD', name: 'الدولار الأسترالي', symbol: 'A$', importance: 87 },
    { code: 'QAR', name: 'الريال القطري', symbol: 'ر.ق', importance: 86 },
    { code: 'OMR', name: 'الريال العماني', symbol: 'ر.ع', importance: 85 },
    { code: 'JOD', name: 'الدينار الأردني', symbol: 'د.ا', importance: 84 },
    { code: 'BHD', name: 'الدينار البحريني', symbol: 'د.ب', importance: 83 },
    { code: 'LBP', name: 'الليرة اللبنانية', symbol: 'ل.ل', importance: 82 },
    { code: 'SYP', name: 'الليرة السورية', symbol: 'ل.س', importance: 81 },
    { code: 'IQD', name: 'الدينار العراقي', symbol: 'د.ع', importance: 80 },
    { code: 'LYD', name: 'الدينار الليبي', symbol: 'د.ل', importance: 79 },
    { code: 'TND', name: 'الدينار التونسي', symbol: 'د.ت', importance: 78 },
    { code: 'MAD', name: 'الدرهم المغربي', symbol: 'د.م', importance: 77 },
    { code: 'DZD', name: 'الدينار الجزائري', symbol: 'د.ج', importance: 76 },
    { code: 'YER', name: 'الريال اليمني', symbol: 'ر.ي', importance: 75 }
];

// ترتيب العملات حسب الأهمية (للاحتياط)
currenciesData.sort((a, b) => b.importance - a.importance);
