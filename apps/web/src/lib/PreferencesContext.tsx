'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';
export type FontSize = 'sm' | 'md' | 'lg';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header & Navigation
    'portal_title': 'e-AROGYAM • INTEGRATED HEALTH INTELLIGENCE SYSTEM',
    'district': 'Gorakhpur District Portal',
    'live_ws': 'LIVE WS CONNECTED',
    'offline': 'OFFLINE',
    'logout': 'Logout',
    'system_title': 'e-Arogyam — Pharmaceutical Cold-Chain & Inventory Management System',
    'system_subtitle': 'Real-time cold-chain monitoring, batch traceability, and automated thermal breach response for Gorakhpur',
    'active_breaches_warning': 'ACTIVE THERMAL BREACH DETECTED',
    'tab_overview': 'SYSTEM OVERVIEW',
    'tab_inventory': 'FACILITY INVENTORY',
    'tab_scanner': 'LOGISTICS SCANNER',
    'tab_simulator': 'VIRTUAL IoT SIMULATOR',
    
    // KPI Cards
    'kpi_total_stock': 'Total Stock',
    'kpi_units_monitored': 'Units monitored',
    'kpi_thermal_breaches': 'Thermal Breaches',
    'kpi_spoiled': 'Batches SPOILED',
    'kpi_breaches_zero': '0 Breaches active',
    'kpi_low_stock': 'Low Stock (<100)',
    'kpi_restock_needed': 'Batches require restock',
    'kpi_expiring_60': 'Expiring ≤60d',
    'kpi_crit_expiry': 'Critical Expiry Window',
    'kpi_expiring_90': 'Expiring 61–90d',
    'kpi_sec_window': 'Secondary Window',
    'kpi_expiring_120': 'Expiring 91–120d',
    'kpi_mon_window': 'Monitored Window',

    // Scanner
    'scanner_title': 'GS1 Barcode & QR Logistics Scanner',
    'scanner_subtitle': 'Scan or paste GS1-128 / DataMatrix code for instant batch inward & outward verification',
    'scan_with_camera': 'Scan with Camera',
    'stop_camera': 'Stop Camera',
    'manual_input': 'Manual GS1 / Batch Input',
    'select_batch': 'Select Verified Batch',
    'batch_no': 'Batch Number',
    'medicine_name': 'Medicine Name',
    'exp_date': 'Expiry Date',
    'curr_qty': 'Current Available Stock',
    'movement_type': 'Movement Type',
    'inward': 'INWARD (Stock Receive)',
    'outward': 'OUTWARD (Dispense)',
    'confirm_inward': 'Confirm Inward Movement',
    'confirm_outward': 'Confirm Outward Movement',
    'quick_demo_qrs': 'Quick Demo QR & Barcodes (Click to auto-fill):',
    
    // Inventory
    'inv_search_placeholder': 'Search by Batch No, Medicine Name, or SKU...',
    'inv_status_all': 'All Statuses',
    'inv_status_available': 'Available',
    'inv_status_low': 'Low Stock',
    'inv_status_expiring': 'Expiring Soon',
    'inv_status_spoiled': 'Spoiled'
  },
  hi: {
    // Header & Navigation
    'portal_title': 'ई-आरोग्यम • एकीकृत स्वास्थ्य सूचना प्रणाली',
    'district': 'गोरखपुर जिला पोर्टल',
    'live_ws': 'लाइव सर्वर कनेक्टेड',
    'offline': 'ऑफ़लाइन',
    'logout': 'लॉग आउट',
    'system_title': 'ई-आरोग्यम — फार्मास्युटिकल कोल्ड-चेन एवं इन्वेंटरी प्रबंधन प्रणाली',
    'system_subtitle': 'गोरखपुर के लिए रियल-टाइम कोल्ड-चेन निगरानी, बैच ट्रेसिबिलिटी एवं स्वचालित तापमान चेतावनी',
    'active_breaches_warning': 'सक्रिय तापमान उल्लंघन पाया गया',
    'tab_overview': 'सिस्टम अवलोकन',
    'tab_inventory': 'सुविधा इन्वेंटरी',
    'tab_scanner': 'लॉजिस्टिक्स स्कैनर',
    'tab_simulator': 'वर्चुअल IoT सिम्युलेटर',
    
    // KPI Cards
    'kpi_total_stock': 'कुल स्टॉक',
    'kpi_units_monitored': 'कुल यूनिट्स',
    'kpi_thermal_breaches': 'तापमान उल्लंघन',
    'kpi_spoiled': 'बैच खराब (Spoiled)',
    'kpi_breaches_zero': '0 उल्लंघन सक्रिय',
    'kpi_low_stock': 'कम स्टॉक (<100)',
    'kpi_restock_needed': 'पुनः स्टॉक की आवश्यकता',
    'kpi_expiring_60': 'समाप्ति ≤60 दिन',
    'kpi_crit_expiry': 'गंभीर समाप्ति विंडो',
    'kpi_expiring_90': 'समाप्ति 61–90 दिन',
    'kpi_sec_window': 'मध्यम समाप्ति विंडो',
    'kpi_expiring_120': 'समाप्ति 91–120 दिन',
    'kpi_mon_window': 'निगरानी विंडो',

    // Scanner
    'scanner_title': 'GS1 बारकोड एवं क्यूआर लॉजिस्टिक्स स्कैनर',
    'scanner_subtitle': 'बैच आवक एवं जावक सत्यापन हेतु GS1-128 / डेटा मैट्रिक्स कोड स्कैन या दर्ज करें',
    'scan_with_camera': 'कैमरे से स्कैन करें',
    'stop_camera': 'कैमरा बंद करें',
    'manual_input': 'मैनुअल GS1 / बैच इनपुट',
    'select_batch': 'सत्यापित बैच चुनें',
    'batch_no': 'बैच संख्या',
    'medicine_name': 'दवा का नाम',
    'exp_date': 'समाप्ति तिथि',
    'curr_qty': 'वर्तमान उपलब्ध स्टॉक',
    'movement_type': 'मूवमेंट का प्रकार',
    'inward': 'आवक (स्टॉक प्राप्ति)',
    'outward': 'जावक (वितरण)',
    'confirm_inward': 'आवक दर्ज करें',
    'confirm_outward': 'जावक दर्ज करें',
    'quick_demo_qrs': 'त्वरित डेमो क्यूआर एवं बारकोड (ऑटो-फिल हेतु क्लिक करें):',

    // Inventory
    'inv_search_placeholder': 'बैच संख्या, दवा के नाम या SKU द्वारा खोजें...',
    'inv_status_all': 'सभी स्थितियाँ',
    'inv_status_available': 'उपलब्ध',
    'inv_status_low': 'कम स्टॉक',
    'inv_status_expiring': 'जल्द समाप्त',
    'inv_status_spoiled': 'खराब (Spoiled)'
  }
};

interface PreferencesContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  t: (key: string) => string;
}

const PreferencesContext = createContext<PreferencesContextType>({
  lang: 'en',
  setLang: () => {},
  fontSize: 'md',
  setFontSize: () => {},
  t: (key: string) => key
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');
  const [fontSize, setFontSizeState] = useState<FontSize>('md');

  useEffect(() => {
    const savedLang = localStorage.getItem('earogyam_lang') as Language;
    if (savedLang === 'en' || savedLang === 'hi') setLangState(savedLang);

    const savedSize = localStorage.getItem('earogyam_fontsize') as FontSize;
    if (savedSize === 'sm' || savedSize === 'md' || savedSize === 'lg') {
      setFontSizeState(savedSize);
      applyFontSize(savedSize);
    }
  }, []);

  const applyFontSize = (size: FontSize) => {
    const root = document.documentElement;
    if (size === 'sm') root.style.fontSize = '14px';
    else if (size === 'lg') root.style.fontSize = '18px';
    else root.style.fontSize = '16px';
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('earogyam_lang', newLang);
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    localStorage.setItem('earogyam_fontsize', newSize);
    applyFontSize(newSize);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <PreferencesContext.Provider value={{ lang, setLang, fontSize, setFontSize, t }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
