'use strict';

// ==========================================
// المحول الذكي الشامل - الإصدار المتقدم 3.0
// ==========================================

const App = {
    // تهيئة التطبيق
    init: async function() {
        console.log('🚀 بدء تشغيل المحول الذكي...');
        this.initTheme();
        this.initMobileNav();
        this.initFaq();
        this.renderTools();
        this.setupEventListeners();
	await this.loadCurrencies();  // ❗ أضف هذا السطر
        console.log('✅ تم التهيئة بنجاح');
    },

    // الوضع المظلم
    initTheme: function() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            toggle.textContent = '☀️';
        }
        
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            toggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    },

    // قائمة الجوال
    initMobileNav: function() {
        const toggle = document.querySelector('.nav-toggle');
        const menu = document.querySelector('.nav-menu');
        if (!toggle || !menu) return;
        
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
        });
    },

    // عرض أدوات التحويل
    renderTools: function() {
        const grid = document.getElementById('tools-grid');
        if (!grid) {
            console.error('❌ tools-grid غير موجود');
            return;
        }
        
        grid.innerHTML = '';
        
        // إنشاء بطاقات الأدوات
        const tools = [
            {
                id: 'currency',
                icon: '💰',
                title: 'تحويل العملات',
                desc: 'تحويل بين جميع العملات العربية والعالمية',
                type: 'currency'
            },
            {
                id: 'length',
                icon: '📏',
                title: 'تحويل الطول',
                desc: 'متر، قدم، إنش، كيلومتر...',
                type: 'unit',
                units: ['متر', 'كيلومتر', 'سنتيمتر', 'مليمتر', 'ميل', 'ياردة', 'قدم', 'إنش']
            },
            {
                id: 'weight',
                icon: '⚖️',
                title: 'تحويل الوزن',
                desc: 'كيلوجرام، رطل، أوقية، طن...',
                type: 'unit',
                units: ['كيلوجرام', 'غرام', 'ملغرام', 'رطل', 'أوقية', 'طن']
            },
            {
                id: 'temperature',
                icon: '🌡️',
                title: 'تحويل الحرارة',
                desc: 'سيليزي، فهرنهايت، كلفن',
                type: 'unit',
                units: ['سيليزي', 'فهرنهايت', 'كلفن']
            },
            {
                id: 'date',
                icon: '📅',
                title: 'تحويل التاريخ',
                desc: 'هجري ↔ ميلادي بدقة',
                type: 'date'
            }
        ];
        
        tools.forEach(tool => {
            const card = this.createToolCard(tool);
            grid.appendChild(card);
        });
        
        console.log('✅ تم إنشاء', tools.length, 'أدوات');
    },

    // إنشاء بطاقة أداة
    createToolCard: function(tool) {
        const card = document.createElement('article');
        card.id = tool.id;
        card.className = 'tool-card';
        
        let content = `
            <div class="tool-header">${tool.icon} ${tool.title}</div>
            <div class="tool-body">
                <p>${tool.desc}</p>
        `;
        
        // إضافة محتوى مختلف حسب نوع الأداة
        if (tool.type === 'date') {
            content += this.createDateConverter();
        } else if (tool.type === 'currency') {
            content += this.createCurrencyConverter();
        } else if (tool.type === 'unit') {
            content += this.createUnitConverter(tool.id, tool.units);
        }
        
        content += `</div>`;
        card.innerHTML = content;
        
        return card;
    },

    // إنشاء محول العملات
createCurrencyConverter: function() {
    // لا نستخدم window.currenciesData نهائياً
    // سنترك القوائم فارغة مؤقتاً، وسيملؤها loadCurrencies لاحقاً
    return `
        <div class="converter-box" id="currency-converter">
            <div class="input-group">
                <input type="number" id="currency-amount" value="1" step="any" min="0">
                <select id="currency-from" class="currency-select">
                    <option value="">جاري تحميل العملات...</option>
                </select>
            </div>

            <div class="swap-button" id="swap-currencies" title="تبديل العملات">🔄</div>

            <div class="input-group result">
                <input type="text" id="currency-result" readonly value="0" placeholder="النتيجة">
                <select id="currency-to" class="currency-select">
                    <option value="">جاري تحميل العملات...</option>
                </select>
            </div>

            <button class="convert-btn" id="convert-currency">تحويل العملات</button>
        </div>
    `;
},

    // إنشاء محول الوحدات
    createUnitConverter: function(id, units) {
        return `
            <div class="converter-box" id="${id}-converter">
                <div class="input-group">
                    <input type="number" id="${id}-amount" value="1" step="any">
                    <select id="${id}-from">
                        ${units.map(u => `<option value="${u}">${u}</option>`).join('')}
                    </select>
                </div>
                <div class="swap-button" id="swap-${id}">🔄</div>
                <div class="input-group result">
                    <input type="text" id="${id}-result" readonly value="0">
                    <select id="${id}-to">
                        ${units.map(u => `<option value="${u}" ${u === units[1] ? 'selected' : ''}>${u}</option>`).join('')}
                    </select>
                </div>
                <button class="convert-btn" id="convert-${id}">تحويل</button>
            </div>
        `;
    },

    // إنشاء محول التاريخ
    createDateConverter: function() {
        return `
            <div class="converter-box" id="date-converter">
                <div class="input-group">
                    <input type="text" 
                           id="date-input" 
                           placeholder="YYYY-MM-DD" 
                           value="1445-09-01" 
                           class="date-input">
                </div>
                <div class="input-group">
                    <select id="date-from-type" class="date-select">
                        <option value="hijri">هجري</option>
                        <option value="gregorian">ميلادي</option>
                    </select>
                    <span class="swap-icon" id="swap-date-types">🔄</span>
                    <select id="date-to-type" class="date-select">
                        <option value="gregorian">ميلادي</option>
                        <option value="hijri">هجري</option>
                    </select>
                </div>
                <button class="convert-btn" id="convert-date">تحويل التاريخ</button>
                <div class="input-group result">
                    <input type="text" 
                           id="date-result" 
                           readonly 
                           placeholder="النتيجة" 
                           class="date-result">
                </div>
            </div>
        `;
    },

    // إعداد مستمعي الأحداث
    setupEventListeners: function() {
        // عملات
        document.getElementById('convert-currency')?.addEventListener('click', () => this.convertCurrency());
        document.getElementById('swap-currencies')?.addEventListener('click', () => this.swapCurrencies());
        
        // طول
        document.getElementById('convert-length')?.addEventListener('click', () => this.convertUnit('length'));
        document.getElementById('swap-length')?.addEventListener('click', () => this.swapUnits('length'));
        
        // وزن
        document.getElementById('convert-weight')?.addEventListener('click', () => this.convertUnit('weight'));
        document.getElementById('swap-weight')?.addEventListener('click', () => this.swapUnits('weight'));
        
        // حرارة
        document.getElementById('convert-temperature')?.addEventListener('click', () => this.convertUnit('temperature'));
        document.getElementById('swap-temperature')?.addEventListener('click', () => this.swapUnits('temperature'));
        
        // تاريخ
        document.getElementById('convert-date')?.addEventListener('click', () => this.convertDate());
        document.getElementById('swap-date-types')?.addEventListener('click', () => this.swapDateTypes());
        
        const dateInput = document.getElementById('date-input');
        if (dateInput) {
            dateInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.convertDate();
                }
            });
        }
    },

    // تحويل العملات
convertCurrency: async function() {
    const amount = document.getElementById('currency-amount').value;
    const fromSelect = document.getElementById('currency-from');
    const toSelect = document.getElementById('currency-to');
    const resultField = document.getElementById('currency-result');
    
    if (!amount || amount <= 0) {
        resultField.value = '❌ الرجاء إدخال قيمة صحيحة';
        return;
    }
    
    // الحصول على رموز العملات فقط (القيمة هي الرمز)
    const fromCurrency = fromSelect.value;
    const toCurrency = toSelect.value;
    
    try {
        const response = await fetch('/api/convert', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                category: 'currency',
                value: amount,
                from_unit: fromCurrency,
                to_unit: toCurrency
            })
        });
        
        const data = await response.json();
        if (data.success) {
            resultField.value = data.result.toFixed(2);
            
            // تسجيل التحويل الناجح (للتحليلات)
            console.log(`✅ تحويل: ${amount} ${fromCurrency} → ${data.result} ${toCurrency}`);
        } else {
            resultField.value = '❌ خطأ في التحويل';
        }
    } catch (error) {
        console.error('❌ خطأ في تحويل العملات:', error);
        resultField.value = '❌ خطأ في الاتصال';
    }
},

    // تحويل الوحدات
    convertUnit: async function(category) {
        const amount = document.getElementById(`${category}-amount`).value;
        const from = document.getElementById(`${category}-from`).value;
        const to = document.getElementById(`${category}-to`).value;
        const resultField = document.getElementById(`${category}-result`);
        
        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ category, value: amount, from_unit: from, to_unit: to })
            });
            const data = await response.json();
            if (data.success) {
                resultField.value = data.result;
            } else {
                resultField.value = 'خطأ';
            }
        } catch (error) {
            resultField.value = 'خطأ';
        }
    },

    // تحويل التاريخ
    convertDate: async function() {
        const input = document.getElementById('date-input');
        const fromType = document.getElementById('date-from-type');
        const toType = document.getElementById('date-to-type');
        const result = document.getElementById('date-result');
        
        if (!input || !fromType || !toType || !result) return;
        
        const dateValue = input.value.trim();
        
        if (!dateValue) {
            result.value = '❌ الرجاء إدخال التاريخ';
            return;
        }
        
        try {
            const response = await fetch('/api/convert-date', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    date: dateValue,
                    from_type: fromType.value,
                    to_type: toType.value
                })
            });
            
            const data = await response.json();
            if (data.success) {
                result.value = data.formatted || '✅ تم التحويل';
            } else {
                result.value = '❌ ' + (data.error || 'فشل التحويل');
            }
        } catch (error) {
            result.value = '❌ خطأ في الاتصال';
        }
    },

    // تبديل العملات
swapCurrencies: function() {
    const fromSelect = document.getElementById('currency-from');
    const toSelect = document.getElementById('currency-to');
    
    if (!fromSelect || !toSelect) return;
    
    // حفظ القيم الحالية
    const fromValue = fromSelect.value;
    const toValue = toSelect.value;
    
    // الحصول على النصوص المعروضة (للعرض فقط)
    const fromText = fromSelect.options[fromSelect.selectedIndex].text;
    const toText = toSelect.options[toSelect.selectedIndex].text;
    
    // تبديل القيم (الرموز)
    fromSelect.value = toValue;
    toSelect.value = fromValue;
    
    // تسجيل عملية التبديل
    console.log(`🔄 تبديل العملات: ${fromValue}, ↔ ${toValue}`);
},



// تحميل قائمة العملات من السيرفر
loadCurrencies: async function() {
    try {
        const response = await fetch('/api/currencies');
        const data = await response.json();
        
        if (data.success && data.data) {
            // تحويل بيانات العملات إلى مصفوفة
            const currencies = [];
            
            // السيرفر يرسل العملات مباشرة ككائن (object)
            // مثلاً: { "AED": 3.67, "USD": 1.0, "SAR": 3.75, ... }
            for (const [code, rate] of Object.entries(data.data)) {
                // إضافة اسم عربي للعملة (اختياري للعرض)
                const currencyNames = {
                    'USD': 'الدولار الأمريكي',
                    'EUR': 'اليورو الأوروبي',
                    'GBP': 'الجنيه الإسترليني',
                    'JPY': 'الين الياباني',
                    'CNY': 'اليوان الصيني',
                    'INR': 'الروبية الهندية',
                    'CAD': 'الدولار الكندي',
                    'AUD': 'الدولار الأسترالي',
                    'CHF': 'الفرنك السويسري',
                    'TRY': 'الليرة التركية',
                    'SAR': 'الريال السعودي',
                    'AED': 'الدرهم الإماراتي',
                    'EGP': 'الجنيه المصري',
                    'KWD': 'الدينار الكويتي',
                    'QAR': 'الريال القطري',
                    'OMR': 'الريال العماني',
                    'BHD': 'الدينار البحريني',
                    'JOD': 'الدينار الأردني',
                    'LBP': 'الليرة اللبنانية',
                    'SYP': 'الليرة السورية',
                    'IQD': 'الدينار العراقي',
                    'LYD': 'الدينار الليبي',
                    'TND': 'الدينار التونسي',
                    'MAD': 'الدرهم المغربي',
                    'DZD': 'الدينار الجزائري',
                    'YER': 'الريال اليمني'
                };
                
                const name = currencyNames[code] || code;
                
                // تحديد أهمية العملة لترتيبها (العملات الأكثر استخداماً أولاً)
                let importance = 0;
                const importantCurrencies = ['USD', 'SAR', 'EGP', 'AED', 'EUR', 'KWD', 'GBP'];
                if (importantCurrencies.includes(code)) {
                    importance = 100 - importantCurrencies.indexOf(code);
                }
                
                currencies.push({ 
                    code: code, 
                    name: name,
                    importance: importance,
                    rate: rate 
                });
            }
            
            // ترتيب العملات حسب الأهمية (الأعلى أولاً)
            currencies.sort((a, b) => b.importance - a.importance);
            
            // تحديث القوائم المنسدلة
            this.updateCurrencySelects(currencies);
            console.log(`✅ تم تحديث ${currencies.length} عملة من السيرفر`);
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل العملات:', error);
        // استخدام العملات الافتراضية في حالة الفشل
        this.useDefaultCurrencies();
    }
},

// استخدام العملات الافتراضية (إذا فشل الاتصال)
useDefaultCurrencies: function() {
    const defaultCurrencies = [
        { code: 'USD', name: 'الدولار الأمريكي', importance: 100 },
        { code: 'SAR', name: 'الريال السعودي', importance: 99 },
        { code: 'EGP', name: 'الجنيه المصري', importance: 98 },
        { code: 'AED', name: 'الدرهم الإماراتي', importance: 97 },
        { code: 'EUR', name: 'اليورو الأوروبي', importance: 96 },
        { code: 'KWD', name: 'الدينار الكويتي', importance: 95 },
        { code: 'GBP', name: 'الجنيه الإسترليني', importance: 94 },
        { code: 'TRY', name: 'الليرة التركية', importance: 93 },
        { code: 'CNY', name: 'اليوان الصيني', importance: 92 },
        { code: 'JPY', name: 'الين الياباني', importance: 91 }
    ];
    
    this.updateCurrencySelects(defaultCurrencies);
    console.log('⚠️ استخدام العملات الافتراضية');
},



// تحديث القوائم المنسدلة بالعملات
updateCurrencySelects: function(currencies) {
    const findElements = () => {
        const fromSelect = document.getElementById('currency-from');
        const toSelect = document.getElementById('currency-to');
        return { fromSelect, toSelect };
    };

    let { fromSelect, toSelect } = findElements();
    let attempts = 0;
    const maxAttempts = 10;

    if (!fromSelect || !toSelect) {
        console.log('⏳ انتظار تحميل عناصر العملات...');
        const waitForElements = setInterval(() => {
            attempts++;
            ({ fromSelect, toSelect } = findElements());
            if (fromSelect && toSelect) {
                clearInterval(waitForElements);
                console.log(`✅ تم العثور على العناصر بعد ${attempts} محاولة`);
                this.populateCurrencySelects(fromSelect, toSelect, currencies);
            } else if (attempts >= maxAttempts) {
                clearInterval(waitForElements);
                console.error('❌ لم يتم العثور على عناصر العملات');
            }
        }, 100);
        return;
    }
    this.populateCurrencySelects(fromSelect, toSelect, currencies);
},

// الدالة المساعدة (تأكد من وجودها هنا)
populateCurrencySelects: function(fromSelect, toSelect, currencies) {
    console.log('🔄 ملء القوائم بـ', currencies.length, 'عملة');
    const options = currencies.map(c =>
        `<option value="${c.code}">${c.code} - ${c.name}</option>`
    ).join('');

    fromSelect.innerHTML = options;
    toSelect.innerHTML = options;

    if (currencies.length > 0) {
        const usdIndex = currencies.findIndex(c => c.code === 'USD');
        fromSelect.selectedIndex = usdIndex !== -1 ? usdIndex : 0;
        const sarIndex = currencies.findIndex(c => c.code === 'SAR');
        toSelect.selectedIndex = sarIndex !== -1 ? sarIndex : Math.min(1, currencies.length - 1);
    }
},



    // تبديل الوحدات
    swapUnits: function(type) {
        const from = document.getElementById(`${type}-from`);
        const to = document.getElementById(`${type}-to`);
        [from.value, to.value] = [to.value, from.value];
    },

    // تبديل أنواع التاريخ
    swapDateTypes: function() {
        const from = document.getElementById('date-from-type');
        const to = document.getElementById('date-to-type');
        [from.value, to.value] = [to.value, from.value];
    },

    // الأسئلة الشائعة
    initFaq: function() {
        const faqGrid = document.getElementById('faq-grid');
        if (!faqGrid) return;
        
        const faqs = [
            { q: 'ما هي ميزة تطبيق الويب التقدمي (PWA)؟', a: 'يتيح لك تثبيت التطبيق على هاتفك واستخدامه بدون إنترنت.' },
            { q: 'هل أسعار العملات حية ومحدثة؟', a: 'نعم، يتم تحديثها كل 6 ساعات.' },
            { q: 'هل يمكن تحويل التاريخ الهجري؟', a: 'نعم، يدعم المحول تحويل التاريخ بين هجري وميلادي.' }
        ];
        
        faqGrid.innerHTML = faqs.map(faq => `
            <div class="faq-item">
                <h3 class="faq-question">${faq.q}</h3>
                <div class="faq-answer">${faq.a}</div>
            </div>
        `).join('');
        
        document.querySelectorAll('.faq-question').forEach(q => {
            q.addEventListener('click', () => {
                q.parentElement.classList.toggle('active');
            });
        });
    }
};

// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', () => App.init());
