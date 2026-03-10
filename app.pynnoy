from flask import Flask, render_template, request, jsonify
from converter import *
import json
from datetime import datetime

app = Flask(__name__)

# مسار العملات
@app.route('/currencies')
def get_currencies():
    currencies = {
        "العملات العربية": {
            "SAR": "ريال سعودي",
            "AED": "درهم إماراتي",
            "EGP": "جنيه مصري",
            "KWD": "دينار كويتي",
            "QAR": "ريال قطري",
            "OMR": "ريال عماني",
            "BHD": "دينار بحريني",
            "JOD": "دينار أردني",
            "LBP": "ليرة لبنانية",
            "SYP": "ليرة سورية",
            "IQD": "دينار عراقي",
            "LYD": "دينار ليبي",
            "TND": "دينار تونسي",
            "MAD": "درهم مغربي",
            "DZD": "دينار جزائري",
            "YER": "ريال يمني"
        },
        "العملات العالمية": {
            "USD": "دولار أمريكي",
            "EUR": "يورو",
            "GBP": "جنيه إسترليني",
            "JPY": "ين ياباني",
            "CNY": "يوان صيني",
            "INR": "روبية هندية",
            "CAD": "دولار كندي",
            "AUD": "دولار أسترالي"
        }
    }
    return jsonify(currencies)

# مسار التحويل
@app.route('/convert', methods=['POST'])
def convert():
    data = request.json
    category = data['category']
    value = float(data['value'])
    from_unit = data['from_unit']
    to_unit = data['to_unit']
    
    try:
        if category == "length":
            result = length_converter(value, from_unit, to_unit)
        elif category == "weight":
            result = weight_converter(value, from_unit, to_unit)
        elif category == "temperature":
            result = temperature_converter(value, from_unit, to_unit)
        elif category == "currency":
            result = currency_converter(value, from_unit, to_unit)
        
        return jsonify({
            "result": round(result, 6),
            "timestamp": datetime.now().isoformat(),
            "success": True
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        })

# الصفحة الرئيسية
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
