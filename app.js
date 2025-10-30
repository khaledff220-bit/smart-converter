// =================================================================
// 1. تعريف البيانات والمُتغيرات العالمية
// =================================================================
const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
const CURRENCY_CACHE_KEY = 'currency_rates_cache';
const CURRENCY_UPDATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 ساعات

// متغيرات حالة الإعلانات (AdSense/AdMob Logic)
let interstitialCounter = 0;
const INTERSTITIAL_FREQUENCY = 3; // إظهار الإعلان البيني كل 3 عمليات عودة
const AD_CLIENT_ID = 'ca-pub-6516738542213361'; // شفرة الناشر
const INTERSTITIAL_AD_SLOT = '1710677340'; // شفرة وحدة الإعلان البيني

// هيكل البيانات الأساسي للوحدات والعملات العربية الرئيسية
const ALL_UNITS = {
    'length': {
        title: 'تحويل الطول',
        icon: '📏',
        content: `**تحويلات الطول:** هي أساس الهندسة والقياسات اليومية. يستخدمها المهندسون، البناؤون، وحتى في التسوق. تساعدك هذه الأداة على التحويل بين الوحدات العالمية مثل المتر والكيلومتر والوحدات الإمبراطورية مثل القدم والميل والبوصة بدقة فائقة.`,
        units: {
            'meter': { name: 'متر (م)', factor: 1 },
            'kilometer': { name: 'كيلومتر (كم)', factor: 1000 },
            'foot': { name: 'قدم (ft)', factor: 0.3048 },
            'mile': { name: 'ميل (mi)', factor: 1609.34 },
            'inch': { name: 'بوصة (in)', factor: 0.0254 },
        }
    },
    'weight': {
        title: 'تحويل الوزن',
        icon: '⚖️',
        content: `**تحويلات الوزن:** ضرورية في التجارة، والطبخ، والعلوم. من الكيلوغرامات إلى الأرطال والأونصات، يوفر لك هذا المحول طريقة سهلة وسريعة لتحويل الأوزان بدقة.`,
        units: {
            'kilogram': { name: 'كيلوغرام (كغم)', factor: 1 },
            'gram': { name: 'غرام (غ)', factor: 0.001 },
            'pound': { name: 'رطل (lb)', factor: 0.453592 },
            'ounce': { name: 'أونصة (oz)', factor: 0.0283495 },
            'ton': { name: 'طن متري', factor: 1000 },
        }
    },
    'temp': {
        title: 'تحويل الحرارة',
        icon: '🌡️',
        content: `**تحويلات الحرارة:** لا غنى عنها في الأرصاد الجوية، والعلوم، والطب. يسمح لك هذا المحول بالتبديل بين مقاييس الحرارة الرئيسية: مئوية (°C)، فهرنهايت (°F)، وكلفن (K).`,
        units: {
            'celsius': { name: 'مئوية (°C)' },
            'fahrenheit': { name: 'فهرنهايت (°F)' },
            'kelvin': { name: 'كلفن (K)' },
        }
    },
    'currency': {
        title: 'تحويل العملات',
        icon: '💰',
        content: `**تحويلات العملات الحية:** يوفر لك المحول الذكي أسعار صرف حية ومحدثة للعملات الرئيسية والعملات العربية. تذكر أن الأسعار يتم تحديثها كل 6 ساعات.`,
        units: {}
    }
};

const DESIRED_CURRENCIES = {
    'USD': 'دولار أمريكي ($)', 'EUR': 'يورو (€)', 'JPY': 'ين ياباني (¥)', 'GBP': 'جنيه إسترليني (£)',
    'SAR': 'ريال سعودي (SAR)', 'AED': 'درهم إماراتي (AED)', 'KWD': 'دينار كويتي (KWD)',
    'QAR': 'ريال قطري (QAR)', 'BHD': 'دينار بحريني (BHD)', 'OMR': 'ريال عماني (OMR)',
    'EGP': 'جنيه مصري (EGP)', 'JOD': 'دينار أردني (JOD)', 'IQD': 'دينار عراقي (IQD)',
};

// =================================================================
// 2. ربط عناصر الواجهة (DOM Elements) - تم توحيد الـ IDs
// =================================================================
let currentCategory = null;
const categoryGrid = document.querySelector('.category-grid');
const mainScreen = document.getElementById('category-selection');
const converterScreen = document.getElementById('converter-screen');
const currentCategoryTitle = document.getElementById('current-category-title');
const sourceUnitSelect = document.getElementById('source-unit');
const targetUnitSelect = document.getElementById('target-unit');
const inputValue = document.getElementById('input-value');
const resultValue = document.getElementById('result-value'); // 🔥 تم تصحيح ID
const swapButton = document.getElementById('swap-units-btn');
const resetButton = document.getElementById('reset-btn'); // 🔥 تم تصحيح ID
const categoryContentDiv = document.getElementById('category-content');
const contentText = document.getElementById('content-text');

// =================================================================
// 3. دوال التحويل الأساسية
// =================================================================
function convertTemperature(value, from, to) {
    let tempInC = 0;
    if (from === 'celsius') tempInC = value;
    else if (from === 'fahrenheit') tempInC = (value - 32) * (5 / 9);
    else if (from === 'kelvin') tempInC = value - 273.15;

    if (to === 'celsius') return tempInC;
    else if (to === 'fahrenheit') return (tempInC * (9 / 5)) + 32;
    else if (to === 'kelvin') return tempInC + 273.15;

    return 0;
}

function convertUnits(category, value, sourceUnit, targetUnit) {
    if (category === 'temp') {
        return convertTemperature(value, sourceUnit, targetUnit);
    }

    const units = ALL_UNITS[category].units;
    
    // 🔥 تم تحويل الـ unitKey إلى حالة الأحرف الصغيرة ليتوافق مع طريقة تخزيننا
    const sourceKey = sourceUnit.toLowerCase();
    const targetKey = targetUnit.toLowerCase();

    if (category === 'currency') {
        const sourceRate = units[sourceKey].rate;
        const targetRate = units[targetKey].rate;

        if (!sourceRate || !targetRate) return 0; // حماية ضد عدم تحميل الأسعار
        
        let baseValue = value / sourceRate;
        return baseValue * targetRate;
    } else {
        // الوحدات الأخرى (الطول، الوزن)
        let baseValue = value * units[sourceKey].factor;
        return baseValue / units[targetKey].factor;
    }
}

async function fetchCurrencyRates() {
    // منطق جلب وتخزين أسعار العملات (بقي كما هو وسليم)
    const cachedRates = localStorage.getItem(CURRENCY_CACHE_KEY);

    if (cachedRates) {
        const data = JSON.parse(cachedRates);
        const age = Date.now() - data.timestamp;

        if (age < CURRENCY_UPDATE_INTERVAL) {
            updateCurrencyUnits(data.rates);
            return true;
        }
    }

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data && data.rates) {
            const ratesData = {
                rates: data.rates,
                timestamp: Date.now()
            };

            localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(ratesData));
            updateCurrencyUnits(data.rates);
            return true;
        }
    } catch (error) {
        if (cachedRates) {
            const data = JSON.parse(cachedRates);
            updateCurrencyUnits(data.rates);
            return true;
        }
        return false;
    }
}

function updateCurrencyUnits(rates) {
    ALL_UNITS.currency.units = {};
    for (const code in DESIRED_CURRENCIES) {
        if (rates[code]) {
            // 🔥 يتم تخزين المفتاح بحالة الأحرف الصغيرة ليتوافق مع اختيار المستخدم
            ALL_UNITS.currency.units[code.toLowerCase()] = {
                name: DESIRED_CURRENCIES[code],
                rate: rates[code]
            };
        }
    }
}

// =================================================================
// 4. منطق الإعلانات (AdSense Logic)
// =================================================================

function showInterstitialAd() {
    try {
        if (window.adsbygoogle) {
            (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: AD_CLIENT_ID,
                enable_page_level_ads: true,
                overlays: {
                    google_ad_slot: INTERSTITIAL_AD_SLOT
                }
            });
            console.log("Interstitial ad requested.");
        }
    } catch (e) {
        console.error("Error showing interstitial ad:", e);
    }
}

function returnToMainScreen(shouldUpdateHash = true) {
    if (shouldUpdateHash && window.location.hash) {
        window.history.pushState("", document.title, window.location.pathname);
    }

    // إخفاء شاشة التحويل وإظهار الرئيسية
    converterScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    currentCategory = null;

    // إظهار قسم الأسئلة الشائعة
    document.getElementById('faq-section').classList.remove('hidden');
    
    // منطق إظهار الإعلان البيني
    interstitialCounter++;
    if (interstitialCounter >= INTERSTITIAL_FREQUENCY) {
        showInterstitialAd();
        interstitialCounter = 0;
    }
}

// =================================================================
// 5. دوال بناء الواجهة والتفاعل
// =================================================================

function renderCategoryCards() {
    categoryGrid.innerHTML = '';
    for (const key in ALL_UNITS) {
        const data = ALL_UNITS[key];
        const button = document.createElement('div');
        button.className = 'category-card';
        button.dataset.category = key;
        button.innerHTML = `
            <span class="icon">${data.icon}</span>
            <p>${data.title}</p>
        `;
        categoryGrid.appendChild(button);

        button.addEventListener('click', () => {
            window.location.hash = key;
        });
    }
}

function loadConverterScreen(categoryKey) {
    currentCategory = categoryKey;
    let currentUnits = ALL_UNITS[categoryKey];

    if (!currentUnits) {
        returnToMainScreen(false);
        return;
    }

    currentCategoryTitle.textContent = currentUnits.title;
    
    // تحديث محتوى الناشر وإظهار الشاشة
    contentText.innerHTML = currentUnits.content; 
    
    // ملء قوائم الاختيار بالوحدات
    sourceUnitSelect.innerHTML = '';
    targetUnitSelect.innerHTML = '';

    const unitKeys = Object.keys(currentUnits.units);

    unitKeys.forEach(unitKey => {
        const unitData = currentUnits.units[unitKey];
        // 🔥 يتم إرسال المفتاح بحالة الأحرف الصغيرة ليتوافق مع منطق التحويل
        const option1 = new Option(unitData.name, unitKey.toLowerCase());
        const option2 = new Option(unitData.name, unitKey.toLowerCase()); 
        sourceUnitSelect.appendChild(option1);
        targetUnitSelect.appendChild(option2);
    });

    // تعيين القيم الافتراضية
    inputValue.value = 1;
    resultValue.value = '0';

    mainScreen.classList.add('hidden');
    converterScreen.classList.remove('hidden');
    document.getElementById('faq-section').classList.add('hidden');

    performConversion();
}

function performConversion() {
    if (!currentCategory) return;

    const value = parseFloat(inputValue.value);
    if (isNaN(value)) {
        resultValue.value = 'خطأ';
        return;
    }

    const source = sourceUnitSelect.value;
    const target = targetUnitSelect.value;
    
    // 🔥 حماية في حالة عدم تحميل العملات
    if (currentCategory === 'currency' && !ALL_UNITS.currency.units[source]) {
         resultValue.value = 'جاري تحميل العملات...';
         // نطلب تحميلها مرة أخرى
         fetchCurrencyRates(); 
         return;
    }

    const result = convertUnits(currentCategory, value, source, target);

    if (currentCategory === 'temp') {
          resultValue.value = result.toFixed(2);
    } else {
        resultValue.value = result.toFixed(4);
    }
}

function swapUnits() {
    const source = sourceUnitSelect.value;
    const target = targetUnitSelect.value;

    sourceUnitSelect.value = target;
    targetUnitSelect.value = source;

    performConversion();
}

function handleURLHash() {
    const hash = window.location.hash.substring(1).toLowerCase();
    if (hash && ALL_UNITS[hash]) {
        loadConverterScreen(hash);
    } else {
        returnToMainScreen(false);
    }
}


// =================================================================
// 6. تهيئة التطبيق (نقطة البداية)
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. جلب العملات
    await fetchCurrencyRates();
    // 2. بناء واجهة الفئات
    renderCategoryCards();

    // 3. معالجة الرابط (URL Hash)
    handleURLHash();
    window.addEventListener('hashchange', handleURLHash);

    // 4. ربط المستمعات بالأحداث
    inputValue.addEventListener('input', performConversion);
    sourceUnitSelect.addEventListener('change', performConversion);
    targetUnitSelect.addEventListener('change', performConversion);
    swapButton.addEventListener('click', swapUnits);
    resetButton.addEventListener('click', returnToMainScreen); // 🔥 تم تصحيح وظيفة زر المسح/العودة

    // ربط التنقل بالواجهة
    document.querySelector('nav a[href="#home"]').addEventListener('click', returnToMainScreen);
    document.querySelector('header h1').addEventListener('click', returnToMainScreen);
});
