#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
==========================================
المحول الذكي الشامل - خادم Flask الرئيسي
Smart Converter PWA - Main Flask Server
الإصدار: 3.1.0 | التاريخ: 2026
==========================================
"""

import os
import json
import time
# في أعلى ملف app.py
from converter import get_exchange_rates
from functools import wraps
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple

from flask import (
    Flask, render_template, request, jsonify, 
    send_from_directory, make_response, abort
)
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# استيراد دوال التحويل من ملف converter.py
try:
    from converter import (
        length_converter, weight_converter, 
        temperature_converter, currency_converter,
        date_converter, get_exchange_rates
    )
    CONVERTER_AVAILABLE = True
    print("✅ تم استيراد دوال التحويل بنجاح")
except ImportError as e:
    print(f"⚠️ تحذير: لم يتم العثور على ملف converter.py - {e}")
    CONVERTER_AVAILABLE = False
    
    # دوال تجريبية مؤقتة (لن تعمل إلا إذا كان الملف مفقوداً)
    def length_converter(value, from_unit, to_unit): return float(value)
    def weight_converter(value, from_unit, to_unit): return float(value)
    def temperature_converter(value, from_unit, to_unit): return float(value)
    def currency_converter(value, from_unit, to_unit): return float(value)
    def date_converter(date_str, from_type, to_type): 
        return {"success": False, "error": "محول التاريخ غير متوفر"}
    def get_exchange_rates(): return {"USD": 1.0}

# ==========================================
# تهيئة التطبيق
# ==========================================
app = Flask(__name__, template_folder='templates', static_folder='static')

# إعدادات التطبيق
app.config.update(
    SECRET_KEY=os.environ.get('FLASK_SECRET_KEY', os.urandom(24).hex()),
    DEBUG=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true',
    CACHE_TIMEOUT=int(os.environ.get('CACHE_TIMEOUT', 3600)),
    RATE_LIMIT=os.environ.get('RATE_LIMIT', '100 per minute'),
    SITE_URL=os.environ.get('SITE_URL', 'https://smart-converter-plum.vercel.app'),
    SITE_NAME='المحول الذكي الشامل',
    SITE_DESCRIPTION='محول العملات والوحدات والتاريخ - أداة مجانية تعمل بدون إنترنت (PWA)',
    SITE_KEYWORDS='محول العملات, تحويل الطول, تحويل الوزن, تحويل الحرارة, تحويل التاريخ, PWA عربي',
    SITE_AUTHOR='Khaled FF',
    SITE_EMAIL=os.environ.get('SITE_EMAIL', 'khaledff220@gmail.com')
)

# تفعيل CORS
CORS(app, resources={
    r"/api/*": {"origins": [app.config['SITE_URL'], "https://smart-converter-plum.vercel.app", "http://localhost:5000"]}
})

# تهيئة محدد المعدل
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[app.config['RATE_LIMIT']],
    storage_uri="memory://",
    strategy="fixed-window"
)

# ==========================================
# دوال مساعدة
# ==========================================

def cache_control(max_age: int = 3600):
    """ديكوريتر لإضافة رؤوس التخزين المؤقت"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            response = make_response(func(*args, **kwargs))
            response.headers['Cache-Control'] = f'public, max-age={max_age}'
            response.headers['Vary'] = 'Accept-Encoding, User-Agent'
            return response
        return wrapper
    return decorator

def validate_conversion_input(data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """التحقق من صحة مدخلات التحويل"""
    required_fields = ['category', 'value', 'from_unit', 'to_unit']
    
    for field in required_fields:
        if field not in data:
            return False, f"الحقل {field} مطلوب"
    
    try:
        value = float(data['value'])
        if value < 0 and data['category'] not in ['temperature']:
            return False, "القيمة يجب أن تكون موجبة"
    except (ValueError, TypeError):
        return False, "القيمة يجب أن تكون رقماً صحيحاً"
    
    category = data['category']
    if category not in ['length', 'weight', 'temperature', 'currency']:
        return False, "نوع التحويل غير مدعوم"
    
    return True, None

def validate_date_input(data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """التحقق من صحة مدخلات تحويل التاريخ"""
    if 'date' not in data:
        return False, "حقل التاريخ مطلوب"
    
    if 'from_type' not in data or 'to_type' not in data:
        return False, "نوع التاريخ المصدر والهدف مطلوبان"
    
    from_type = data['from_type']
    to_type = data['to_type']
    
    if from_type not in ['hijri', 'gregorian'] or to_type not in ['hijri', 'gregorian']:
        return False, "نوع التاريخ يجب أن يكون hijri أو gregorian"
    
    # التحقق من صيغة التاريخ (YYYY-MM-DD)
    date_str = data['date']
    try:
        parts = date_str.split('-')
        if len(parts) != 3:
            return False, "صيغة التاريخ يجب أن تكون YYYY-MM-DD"
        year, month, day = map(int, parts)
        if month < 1 or month > 12:
            return False, "الشهر يجب أن يكون بين 1 و 12"
        if day < 1 or day > 31:
            return False, "اليوم يجب أن يكون بين 1 و 31"
    except:
        return False, "صيغة التاريخ غير صالحة"
    
    return True, None

def generate_site_metadata(page: str = 'home') -> Dict[str, Any]:
    """توليد بيانات meta ديناميكية"""
    base_metadata = {
        'site_name': app.config['SITE_NAME'],
        'site_url': app.config['SITE_URL'],
        'author': app.config['SITE_AUTHOR'],
        'email': app.config['SITE_EMAIL'],
        'current_year': datetime.now().year,
    }
    
    page_metadata = {
        'home': {
            'title': 'المحول الذكي الشامل: تحويل العملات والطول والوزن والحرارة والتاريخ',
            'description': app.config['SITE_DESCRIPTION'],
            'keywords': app.config['SITE_KEYWORDS'],
        },
        'about': {
            'title': 'من نحن - المحول الذكي الشامل',
            'description': 'تعرف على فريق المحول الذكي، مهمتنا، وقيمنا في تقديم أفضل أدوات التحويل المجانية.',
            'keywords': 'من نحن, فريق العمل, رؤية, مهمة',
        },
        'privacy': {
            'title': 'سياسة الخصوصية - المحول الذكي الشامل',
            'description': 'سياسة الخصوصية الخاصة بالمحول الذكي. تعرف على كيفية حماية بياناتك.',
            'keywords': 'سياسة خصوصية, حماية بيانات, أمان',
        }
    }
    
    return {**base_metadata, **page_metadata.get(page, page_metadata['home'])}

# ==========================================
# مسارات الصفحات الرئيسية
# ==========================================

@app.route('/')
@cache_control(max_age=3600)
def index():
    """الصفحة الرئيسية"""
    metadata = generate_site_metadata('home')
    return render_template('index.html', **metadata)

@app.route('/about')
@cache_control(max_age=7200)
def about():
    """صفحة من نحن"""
    metadata = generate_site_metadata('about')
    return render_template('about.html', **metadata)

@app.route('/privacy')
@cache_control(max_age=86400)
def privacy():
    """صفحة سياسة الخصوصية"""
    metadata = generate_site_metadata('privacy')
    return render_template('privacy.html', **metadata)

# للتوافق مع الروابط القديمة (مع .html)
@app.route('/about.html')
def about_old():
    return about()

@app.route('/privacy.html')
def privacy_old():
    return privacy()

# ==========================================
# مسارات PWA والملفات الثابتة
# ==========================================

@app.route('/manifest.json')
@cache_control(max_age=86400)
def manifest():
    """ملف manifest لتطبيق PWA"""
    return send_from_directory('.', 'manifest.json')

@app.route('/service-worker.js')
@cache_control(max_age=0)
def service_worker():
    """ملف Service Worker"""
    response = make_response(send_from_directory('.', 'service-worker.js'))
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Service-Worker-Allowed'] = '/'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response

@app.route('/robots.txt')
@cache_control(max_age=86400)
def robots():
    """ملف robots.txt"""
    content = f"""User-agent: *
Allow: /
Sitemap: {app.config['SITE_URL']}/sitemap.xml
Crawl-delay: 1
"""
    response = make_response(content)
    response.headers['Content-Type'] = 'text/plain'
    return response

@app.route('/sitemap.xml')
@cache_control(max_age=43200)
def sitemap():
    """خريطة الموقع"""
    pages = [
        {'loc': app.config['SITE_URL'], 'priority': '1.0', 'changefreq': 'daily'},
        {'loc': f"{app.config['SITE_URL']}/about", 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': f"{app.config['SITE_URL']}/privacy", 'priority': '0.3', 'changefreq': 'yearly'},
    ]
    
    sitemap_xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
"""
    for page in pages:
        sitemap_xml += f"""
  <url>
    <loc>{page['loc']}</loc>
    <lastmod>{datetime.now().strftime('%Y-%m-%d')}</lastmod>
    <changefreq>{page['changefreq']}</changefreq>
    <priority>{page['priority']}</priority>
  </url>"""
    
    sitemap_xml += "\n</urlset>"
    
    response = make_response(sitemap_xml)
    response.headers['Content-Type'] = 'application/xml'
    return response

# ==========================================
# مسارات API
# ==========================================

@app.route('/api/currencies', methods=['GET'])
@cache_control(max_age=21600)  # تخزين مؤقت لمدة 6 ساعات
@limiter.limit("30 per minute")
def get_currencies():
    """
    إرجاع قائمة العملات المدعومة مع أسعار محدثة
    """
    try:
        # استدعاء الدالة من converter.py التي تجلب الأسعار من الإنترنت
        live_rates = get_exchange_rates()
        
        if live_rates and isinstance(live_rates, dict) and len(live_rates) > 0:
            return jsonify({
                "success": True,
                "data": live_rates,
                "timestamp": datetime.now().isoformat(),
                "source": "live"  # للإشارة أن هذه أسعار حية
            })
        else:
            # إذا فشل الحصول على أسعار حية، استخدم الأسعار الافتراضية
            from converter import DEFAULT_CURRENCY_RATES
            return jsonify({
                "success": True,
                "data": DEFAULT_CURRENCY_RATES,
                "timestamp": datetime.now().isoformat(),
                "source": "default"  # للإشارة أن هذه أسعار افتراضية
            }), 200
            
    except Exception as e:
        app.logger.error(f"خطأ في جلب العملات: {str(e)}")
        return jsonify({
            "success": False,
            "error": "حدث خطأ في جلب العملات"
        }), 500

@app.route('/api/convert', methods=['POST'])
@limiter.limit("20 per minute")
def convert_api():
    """معالجة طلبات التحويل"""
    if not request.is_json:
        return jsonify({
            "success": False,
            "error": "طلب غير صالح - يجب أن يكون JSON"
        }), 400
    
    data = request.get_json()
    
    # التحقق من المدخلات
    is_valid, error_message = validate_conversion_input(data)
    if not is_valid:
        return jsonify({"success": False, "error": error_message}), 400
    
    try:
        category = data['category']
        value = float(data['value'])
        from_unit = data['from_unit']
        to_unit = data['to_unit']
        
        # التحويل حسب الفئة
        start_time = time.time()
        
        if category == "length":
            result = length_converter(value, from_unit, to_unit)
        elif category == "weight":
            result = weight_converter(value, from_unit, to_unit)
        elif category == "temperature":
            result = temperature_converter(value, from_unit, to_unit)
        elif category == "currency":
            result = currency_converter(value, from_unit, to_unit)
        else:
            return jsonify({"success": False, "error": "فئة غير مدعومة"}), 400
        
        execution_time = (time.time() - start_time) * 1000
        
        return jsonify({
            "success": True,
            "result": round(float(result), 6),
            "from": {"value": value, "unit": from_unit},
            "to": {"value": round(float(result), 6), "unit": to_unit},
            "category": category,
            "timestamp": datetime.now().isoformat(),
            "execution_time_ms": round(execution_time, 2)
        })
        
    except ValueError as e:
        return jsonify({"success": False, "error": f"خطأ في القيمة: {str(e)}"}), 400
    except KeyError as e:
        return jsonify({"success": False, "error": f"وحدة غير مدعومة: {str(e)}"}), 400
    except Exception as e:
        app.logger.error(f"خطأ في التحويل: {str(e)}")
        return jsonify({"success": False, "error": "حدث خطأ داخلي في الخادم"}), 500

@app.route('/api/convert-date', methods=['POST'])
@limiter.limit("10 per minute")
def convert_date_api():
    """
    تحويل التاريخ هجري/ميلادي
    المسار الجديد الذي طلبته
    """
    if not request.is_json:
        return jsonify({
            "success": False,
            "error": "طلب غير صالح - يجب أن يكون JSON"
        }), 400
    
    data = request.get_json()
    
    # التحقق من صحة المدخلات
    is_valid, error_message = validate_date_input(data)
    if not is_valid:
        return jsonify({
            "success": False,
            "error": error_message
        }), 400
    
    try:
        # استخراج البيانات
        date_str = data.get('date', '')
        from_type = data.get('from_type', 'hijri')
        to_type = data.get('to_type', 'gregorian')
        
        # استدعاء دالة تحويل التاريخ
        result = date_converter(date_str, from_type, to_type)
        
        # إضافة معلومات إضافية
        if result.get('success'):
            result['timestamp'] = datetime.now().isoformat()
        
        return jsonify(result)
        
    except Exception as e:
        app.logger.error(f"خطأ في تحويل التاريخ: {str(e)}")
        return jsonify({
            "success": False,
            "error": "حدث خطأ داخلي في تحويل التاريخ"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """فحص صحة الخادم"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "3.1.0",
        "environment": "production" if not app.debug else "development",
        "converter_available": CONVERTER_AVAILABLE
    })

# ==========================================
# معالجة الأخطاء
# ==========================================

@app.errorhandler(404)
def not_found(error):
    """صفحة 404"""
    if request.path.startswith('/api/'):
        return jsonify({"success": False, "error": "المسار غير موجود"}), 404
    return render_template('index.html'), 200  # توجيه إلى الصفحة الرئيسية

@app.errorhandler(429)
def rate_limit_exceeded(error):
    """تجاوز معدل الطلبات"""
    return jsonify({
        "success": False,
        "error": "لقد تجاوزت الحد المسموح من الطلبات. الرجاء المحاولة بعد دقيقة."
    }), 429

@app.errorhandler(500)
def internal_error(error):
    """خطأ داخلي"""
    app.logger.error(f"خطأ داخلي: {error}")
    if request.path.startswith('/api/'):
        return jsonify({
            "success": False,
            "error": "حدث خطأ داخلي في الخادم"
        }), 500
    return render_template('index.html'), 500

# ==========================================
# تشغيل التطبيق
# ==========================================

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 المحول الذكي الشامل - خادم Flask")
    print("=" * 60)
    print(f"📅 التاريخ: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📌 الإصدار: 3.1.0")
    print(f"🔧 البيئة: {'تطوير' if app.debug else 'إنتاج'}")
    print(f"🌐 الموقع: {app.config['SITE_URL']}")
    print(f"📧 البريد: {app.config['SITE_EMAIL']}")
    print(f"⚡ معدل الطلبات: {app.config['RATE_LIMIT']}")
    print(f"✅ دوال التحويل: {'موجودة' if CONVERTER_AVAILABLE else 'مفقودة'}")
    print("=" * 60)
    print("📌 المسارات المتاحة:")
    print("   - الصفحة الرئيسية: http://localhost:5000/")
    print("   - صفحة من نحن: http://localhost:5000/about")
    print("   - صفحة الخصوصية: http://localhost:5000/privacy")
    print("   - API العملات: http://localhost:5000/api/currencies")
    print("   - API التحويل: http://localhost:5000/api/convert")
    print("   - API تحويل التاريخ: http://localhost:5000/api/convert-date (جديد)")
    print("   - فحص الصحة: http://localhost:5000/api/health")
    print("=" * 60)
    print("✅ الخادم يعمل الآن... اضغط Ctrl+C للإيقاف")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=app.debug,
        threaded=True
    )


