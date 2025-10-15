// =================================================================
// 1. تعريف البيانات والمُتغيرات العالمية
// =================================================================
const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
const CURRENCY_CACHE_KEY = 'currency_rates_cache';
const CURRENCY_UPDATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 ساعات

// متغيرات حالة الإعلانات (AdSense/AdMob Logic)
let interstitialCounter = 0;
const INTERSTITIAL_FREQUENCY = 2; // تحديث: أظهر الإعلان البيني كل 2 عمليات عودة
const AD_CLIENT_ID = 'ca-pub-6516738542213361'; // شفرة الناشر
const INTERSTITIAL_AD_SLOT = '1710677340'; // شفرة وحدة الإعلان البيني (يرجى مراجعة هذا)

// هيكل البيانات الأساسي للوحدات
const ALL_UNITS = {
    'length': {
        title: 'تحويل الطول',
        icon: '📏',
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
        units: {
            'celsius': { name: 'مئوية (°C)' },
            'fahrenheit': { name: 'فهرنهايت (°F)' },
            'kelvin': { name: 'كلفن (K)' },
        }
    },
    'currency': {
        title: 'تحويل العملات',
        icon: '💰',
        units: {}
    }
};

const DESIRED_CURRENCIES = {
    'USD': 'دولار أمريكي ($)',
    'EUR': 'يورو (€)',
    'SAR': 'ريال سعودي (SAR)',
    'AED': 'درهم إماراتي (AED)',
    'KWD': 'دينار كويتي (KWD)',
    'QAR': 'ريال قطري (QAR)',
    'BHD': 'دينار بحريني (BHD)',
    'OMR': 'ريال عماني (OMR)',
    'EGP': 'جنيه مصري (EGP)',
    'JOD': 'دينار أردني (JOD)',
    'IQD': 'دينار عراقي (IQD)',
    'MAD': 'درهم مغربي (MAD)',
    // ... باقي العملات ...
};

// متغيرات DOM
let currentCategory = null;
const categoryGrid = document.querySelector('.category-grid');
const mainScreen = document.getElementById('category-selection');
const converterScreen = document.getElementById('converter-screen');
const currentCategoryTitle = document.getElementById('current-category-title');
const sourceUnitSelect = document.getElementById('source-unit');
const targetUnitSelect = document.getElementById('target-unit');
const inputValue = document.getElementById('input-value');
const resultValue = document.getElementById('result-value');
const swapButton = document.getElementById('swap-units-btn');
const resetButton = document.getElementById('reset-btn');


// =================================================================
// 2. دوال التحويل الأساسية
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
    let baseValue = 0;

    if (category === 'currency') {
        const sourceRate = units[sourceUnit].rate;
        const targetRate = units[targetUnit].rate;

        baseValue = value / sourceRate;
        return baseValue * targetRate;
    } else {
        baseValue = value * units[sourceUnit].factor;
        return baseValue / units[targetUnit].factor;
    }
}

async function fetchCurrencyRates() {
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
            ALL_UNITS.currency.units[code.toLowerCase()] = {
                name: DESIRED_CURRENCIES[code],
                rate: rates[code]
            };
        }
    }
}


// =================================================================
// 3. منطق الإعلانات (AdSense Logic) - تم التحديث
// =================================================================

function showInterstitialAd() {
    // ** منطق الإعلان البيني (AdSense) **
    
    // نستخدم الصيغة الرسمية لطلب إعلان بملء الشاشة عبر AdSense
    try {
        if (window.adsbygoogle) {
            (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: AD_CLIENT_ID, // ca-pub-6516738542213361
                enable_page_level_ads: true,
                overlays: {
                    google_ad_slot: INTERSTITIAL_AD_SLOT 
                }
            });
            console.log("Interstitial ad requested via push.");
        }
    } catch (e) {
        console.error("Error showing interstitial ad:", e);
    }
}


// دالة العودة للشاشة الرئيسية (Monetization Logic)
function returnToMainScreen(shouldUpdateHash = true) {
    if (shouldUpdateHash && window.location.hash) {
        window.history.pushState("", document.title, window.location.pathname);
    }

    // 1. إخفاء شاشة التحويل وإظهار الرئيسية
    converterScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    currentCategory = null;

    // 2. منطق إظهار الإعلان البيني (يعمل كل 2 عمليات عودة)
    interstitialCounter++;
    if (interstitialCounter >= INTERSTITIAL_FREQUENCY) {
        showInterstitialAd();
        interstitialCounter = 0;
    }
}


// =================================================================
// 4. دوال بناء الواجهة والتفاعل
// =================================================================

function renderCategoryCards() {
    for (const key in ALL_UNITS) {
        const data = ALL_UNITS[key];
        const button = document.createElement('div'); // تم تغييرها إلى div لتحسين التصميم
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

    sourceUnitSelect.innerHTML = '';
    targetUnitSelect.innerHTML = '';

    const unitKeys = Object.keys(currentUnits.units);

    unitKeys.forEach(unitKey => {
        const unitData = currentUnits.units[unitKey];
        const option1 = new Option(unitData.name, unitKey);
        const option2 = new Option(unitData.name, unitKey);
        sourceUnitSelect.appendChild(option1);
        targetUnitSelect.appendChild(option2);
    });

    inputValue.value = 1;
    resultValue.value = '0';

    mainScreen.classList.add('hidden');
    converterScreen.classList.remove('hidden');

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

    if (currentCategory === 'currency' && (!source || !target)) {
        resultValue.value = 'جاري تحميل العملات...';
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
// 5. تهيئة التطبيق (نقطة البداية)
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {
    await fetchCurrencyRates();
    renderCategoryCards();

    handleURLHash();

    window.addEventListener('hashchange', handleURLHash);

    inputValue.addEventListener('input', performConversion);
    sourceUnitSelect.addEventListener('change', performConversion);
    targetUnitSelect.addEventListener('change', performConversion);
    swapButton.addEventListener('click', swapUnits);

    resetButton.addEventListener('click', () => {
        inputValue.value = 0;
        resultValue.value = 0;
        returnToMainScreen();
    });

    document.querySelector('header').addEventListener('click', returnToMainScreen);
});
