import requests
from datetime import datetime

def get_exchange_rates():
    try:
        response = requests.get("https://api.exchangerate.host/latest?base=USD", timeout=5)
        data = response.json()
        return data['rates']
    except:
        return {
            "USD": 1.0,
            "EUR": 0.93,
            "GBP": 0.79,
            "SAR": 3.75,
            "AED": 3.67,
            "EGP": 30.9,
            "KWD": 0.31,
            "QAR": 3.64,
            "OMR": 0.38,
            "BHD": 0.38,
            "JOD": 0.71,
            "LBP": 89000,
            "SYP": 12500,
            "IQD": 1310,
            "LYD": 4.87,
            "TND": 3.12,
            "MAD": 10.05,
            "DZD": 135.5,
            "YER": 250,
            "JPY": 150.25,
            "CNY": 7.23,
            "INR": 83.12,
            "CAD": 1.36,
            "AUD": 1.52
        }

def length_converter(value, from_unit, to_unit):
    units = {
        "متر": 1,
        "كيلومتر": 0.001,
        "سنتيمتر": 100,
        "ميل": 0.000621371,
        "ياردة": 1.09361,
        "قدم": 3.28084,
        "إنش": 39.3701
    }
    return value * units[to_unit] / units[from_unit]

def weight_converter(value, from_unit, to_unit):
    units = {
        "كيلوجرام": 1,
        "غرام": 1000,
        "رطل": 2.20462,
        "أوقية": 35.274,
        "طن": 0.001,
        "ملغرام": 1000000
    }
    return value * units[to_unit] / units[from_unit]

def temperature_converter(value, from_unit, to_unit):
    if from_unit == "سيليزي" and to_unit == "فهرنهايت":
        return (value * 9/5) + 32
    elif from_unit == "فهرنهايت" and to_unit == "سيليزي":
        return (value - 32) * 5/9
    elif from_unit == "سيليزي" and to_unit == "كلفن":
        return value + 273.15
    elif from_unit == "كلفن" and to_unit == "سيليزي":
        return value - 273.15
    elif from_unit == "فهرنهايت" and to_unit == "كلفن":
        return (value - 32) * 5/9 + 273.15
    elif from_unit == "كلفن" and to_unit == "فهرنهايت":
        return (value - 273.15) * 9/5 + 32
    else:
        return value

def currency_converter(value, from_currency, to_currency):
    rates = get_exchange_rates()
    return value * rates[to_currency] / rates[from_currency]
