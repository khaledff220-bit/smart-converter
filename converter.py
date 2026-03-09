#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import time
import json
import os
from datetime import datetime, date, timedelta

try:
    from hijri_converter import Hijri, Gregorian
    HIJRI_CONVERTER_AVAILABLE = True
except ImportError:
    HIJRI_CONVERTER_AVAILABLE = False

def get_updated_default_rates():
    return {
        "USD": 1.0, "EUR": 0.92, "GBP": 0.78, "JPY": 148.50, "CNY": 7.24,
        "INR": 86.80, "CAD": 1.43, "AUD": 1.58, "CHF": 0.88, "TRY": 34.20,
        "SAR": 3.75, "AED": 3.67, "EGP": 48.77, "KWD": 0.31, "QAR": 3.64,
        "OMR": 0.38, "BHD": 0.38, "JOD": 0.71, "LBP": 89000, "SYP": 12500,
        "IQD": 1310, "LYD": 4.87, "TND": 3.15, "MAD": 10.12, "DZD": 136.20, "YER": 250
    }

def get_exchange_rates():
    default_rates = get_updated_default_rates()
    apis = [
        {'url': 'https://open.er-api.com/v6/latest/USD', 'parser': lambda data: data.get('rates', {})},
        {'url': 'https://api.frankfurter.app/latest?from=USD', 'parser': lambda data: data.get('rates', {})}
    ]
    for api in apis:
        try:
            response = requests.get(api['url'], timeout=5)
            if response.status_code == 200:
                rates = api['parser'](response.json())
                if len(rates) > 10:
                    final_rates = default_rates.copy()
                    final_rates.update(rates)
                    return final_rates
        except:
            continue
    return default_rates

def currency_converter(value, from_currency, to_currency):
    rates = get_exchange_rates()
    val = float(value)
    if from_currency not in rates or to_currency not in rates:
        return val
    return round(val * rates[to_currency] / rates[from_currency], 6)

def length_converter(value, from_unit, to_unit):
    units = {"متر": 1, "كيلومتر": 0.001, "سنتيمتر": 100, "مليمتر": 1000, "ميل": 0.000621371, "ياردة": 1.09361, "قدم": 3.28084, "إنش": 39.3701}
    return round(float(value) * units[to_unit] / units[from_unit], 6)

def weight_converter(value, from_unit, to_unit):
    units = {"كيلوجرام": 1, "غرام": 1000, "ملغرام": 1000000, "رطل": 2.20462, "أوقية": 35.274, "طن": 0.001}
    return round(float(value) * units[to_unit] / units[from_unit], 6)

def temperature_converter(value, from_unit, to_unit):
    v = float(value)
    f, t = from_unit.lower(), to_unit.lower()
    c = v if f in ['c', 'سيليزي'] else (v-32)*5/9 if f in ['f', 'فهرنهايت'] else v-273.15
    return round(c if t in ['c', 'سيليزي'] else c*9/5+32 if t in ['f', 'فهرنهايت'] else c+273.15, 2)

def date_converter(date_str, from_type, to_type):
    try:
        y, m, d = map(int, date_str.split('-'))
        if not HIJRI_CONVERTER_AVAILABLE: return {"success": False, "error": "Library not found"}
        if from_type == 'gregorian':
            res = Gregorian(y, m, d).to_hijri()
            return {"success": True, "formatted": f"{res.day}/{res.month}/{res.year}", "to": {"year": res.year, "month": res.month, "day": res.day}}
        else:
            res = Hijri(y, m, d).to_gregorian()
            return {"success": True, "formatted": f"{res.day}/{res.month}/{res.year}", "to": {"year": res.year, "month": res.month, "day": res.day}}
    except Exception as e: return {"success": False, "error": str(e)}

def convert(category, value, from_unit, to_unit):
    try:
        if category == 'currency': res = currency_converter(value, from_unit, to_unit)
        elif category == 'length': res = length_converter(value, from_unit, to_unit)
        elif category == 'weight': res = weight_converter(value, from_unit, to_unit)
        elif category == 'temperature': res = temperature_converter(value, from_unit, to_unit)
        else: return {"success": False}
        return {"success": True, "result": res, "from": {"value": value, "unit": from_unit}, "to": {"value": res, "unit": to_unit}}
    except: return {"success": False}
