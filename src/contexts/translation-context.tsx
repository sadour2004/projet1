'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

interface TranslationContextType {
  locale: string
  setLocale: (locale: string) => void
  t: (key: string) => string
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
)

// French translations
const frTranslations: Record<string, string> = {
  // Navigation
  'nav.dashboard': 'Tableau de Bord',
  'nav.products': 'Produits',
  'nav.categories': 'Catégories',
  'nav.users': 'Utilisateurs',
  'nav.movements': 'Mouvements',
  'nav.browse': 'Parcourir',
  'nav.signout': 'Déconnexion',
  'nav.analytics': 'Analyses',
  'nav.inventory': 'Inventaire',
  'nav.settings': 'Paramètres',

  // Dashboard
  'dashboard.welcome': 'Bienvenue',
  'dashboard.owner': 'Propriétaire',
  'dashboard.staff': 'Personnel',
  'dashboard.role': 'Rôle',
  'dashboard.title': 'Tableau de Bord',
  'dashboard.subtitle': "Système de gestion d'inventaire",
  'dashboard.product_management': 'Gestion des Produits',
  'dashboard.product_desc':
    'Gérez votre catalogue de produits, catégories et inventaire.',
  'dashboard.manage_products': 'Gérer les Produits',
  'dashboard.manage_categories': 'Gérer les Catégories',
  'dashboard.analytics_reports': 'Analyses et Rapports',
  'dashboard.analytics_desc':
    "Consultez les rapports de ventes, analyses d'inventaire et insights.",
  'dashboard.view_analytics': 'Voir les Analyses',
  'dashboard.inventory_operations': "Opérations d'Inventaire",
  'dashboard.inventory_desc':
    'Gérez les mouvements de stock, ajustements et annulations.',
  'dashboard.manage_inventory': "Gérer l'Inventaire",
  'dashboard.record_sales': 'Enregistrer les Ventes',
  'dashboard.record_desc':
    "Enregistrez les ventes hors ligne et retours pour le suivi d'inventaire.",
  'dashboard.record_movement': 'Enregistrer un Mouvement',
  'dashboard.browse_products': 'Parcourir les Produits',
  'dashboard.browse_desc':
    'Recherchez et consultez les informations produits et niveaux de stock.',
  'dashboard.browse_catalog': 'Parcourir le Catalogue',
  'dashboard.cart_management': 'Gestion du Panier',
  'dashboard.cart_desc': 'Gérez les ventes et enregistrez les transactions',
  'dashboard.view_cart': 'Voir le Panier',
  'dashboard.unauthorized_access': 'Accès non autorisé',

  // User Management
  'users.title': 'Gestion du Personnel',
  'users.subtitle': 'Créer et gérer les comptes du personnel de votre magasin',
  'users.add': 'Ajouter un Membre du Personnel',
  'users.name': 'Nom Complet',
  'users.email': 'Adresse E-mail',
  'users.role': 'Rôle',
  'users.password': 'Mot de Passe',
  'users.create': "Créer l'Utilisateur",
  'users.generate': 'Générer',
  'users.copy': 'Copier',
  'users.search': 'Rechercher par nom ou e-mail...',
  'users.activity': 'Activité',
  'users.movements': 'mouvements',
  'users.actions': 'actions',
  'users.created': 'Date de création',
  'users.actions_btn': 'Actions',
  'users.staff_role': 'Personnel (Ventes & Stock)',
  'users.password_placeholder': 'Générer ou saisir un mot de passe',
  'users.password_help': 'Cliquez sur',
  'users.password_help_icon': 'pour générer un mot de passe sécurisé',
  'users.password_warning': 'Important:',
  'users.password_warning_text':
    "Partagez ce mot de passe avec l'utilisateur de manière sécurisée. L'utilisateur pourra le changer après sa première connexion.",
  'users.total_users': 'utilisateurs',

  // POS Interface
  'pos.title': 'Point de Vente',
  'pos.online': 'En ligne',
  'pos.search': 'Recherche de Produits',
  'pos.search_placeholder': 'Rechercher par nom ou code-barres...',
  'pos.cart': 'Panier de Vente',
  'pos.cart_empty': 'Votre panier est vide',
  'pos.cart_empty_desc': 'Recherchez et ajoutez des produits',
  'pos.stats': 'Statistiques Rapides',
  'pos.sales_today': "Ventes Aujourd'hui",
  'pos.revenue': "Chiffre d'Affaires",
  'pos.products_sold': 'Produits Vendus',
  'pos.recent_activity': 'Activité Récente',
  'pos.no_activity': 'Aucune activité récente',
  'pos.quick_actions': 'Actions Rapides',
  'pos.check_stock': 'Vérifier Stock',
  'pos.return_product': 'Retour Produit',
  'pos.reports': 'Rapports',
  'pos.finalize_sale': 'Finaliser la Vente',
  'pos.total': 'Total',
  'pos.items': 'articles',
  'pos.add_to_cart': 'Ajouter',
  'pos.quantity': 'Quantité',
  'pos.price': 'Prix',
  'pos.stock': 'Stock',
  'pos.sku': 'SKU',
  'pos.subtitle': 'Interface de vente simplifiée',
  'pos.noProductsFound': 'Aucun produit trouvé',

  // Products
  'products.title': 'Gestion des Produits',
  'products.subtitle':
    'Gérez votre catalogue de produits, catégories et inventaire',
  'products.add_product': 'Ajouter un Produit',
  'products.search_placeholder': 'Rechercher des produits...',
  'products.total_products': 'Produits Totaux',
  'products.active_products': 'Produits Actifs',
  'products.low_stock': 'Stock Faible',
  'products.out_of_stock': 'Rupture de Stock',
  'products.name': 'Nom du Produit',
  'products.description': 'Description',
  'products.price': 'Prix',
  'products.stock': 'Stock',
  'products.category': 'Catégorie',
  'products.sku': 'Code Produit',
  'products.images': 'Images',
  'products.active': 'Actif',
  'products.inactive': 'Inactif',
  'products.edit': 'Modifier',
  'products.delete': 'Supprimer',
  'products.view': 'Voir',

  // Categories
  'categories.title': 'Gestion des Catégories',
  'categories.subtitle': 'Organisez vos produits en catégories',
  'categories.add_category': 'Ajouter une Catégorie',
  'categories.name': 'Nom de la Catégorie',
  'categories.slug': 'Slug',
  'categories.products_count': 'Produits',
  'categories.edit': 'Modifier',
  'categories.delete': 'Supprimer',

  // Movements
  'movements.title': 'Gestion des Mouvements',
  'movements.subtitle': "Suivez tous les mouvements d'inventaire",
  'movements.type': 'Type',
  'movements.quantity': 'Quantité',
  'movements.date': 'Date',
  'movements.user': 'Utilisateur',
  'movements.product': 'Produit',
  'movements.note': 'Note',
  'movements.sale': 'Vente',
  'movements.return': 'Retour',
  'movements.adjustment': 'Ajustement',
  'movements.cancel_sale': 'Annuler Vente',
  'movements.loss': 'Perte',

  // Browse
  'browse.title': 'Catalogue de Produits',
  'browse.subtitle': 'Parcourez notre sélection de produits',
  'browse.search_placeholder': 'Rechercher des produits...',
  'browse.search': 'Rechercher',
  'browse.categories': 'Catégories',
  'browse.all_categories': 'Toutes les Catégories',
  'browse.no_products': 'Aucun produit trouvé',
  'browse.view_details': 'Voir les Détails',
  'browse.add_to_cart': 'Ajouter au Panier',

  // Analytics
  'analytics.title': 'Tableau de Bord Propriétaire',
  'analytics.subtitle': 'Analyses détaillées et rapports de performance',
  'analytics.total_revenue': "Chiffre d'Affaires Total",
  'analytics.total_sales': 'Ventes Totales',
  'analytics.total_products': 'Produits Totaux',
  'analytics.low_stock_items': 'Articles en Stock Faible',
  'analytics.sales_trend': 'Tendance des Ventes',
  'analytics.top_products': 'Produits les Plus Vendus',
  'analytics.low_stock_alerts': 'Alertes de Stock Faible',
  'analytics.recent_activity': 'Activité Récente',
  'analytics.loading_dashboard': 'Chargement du tableau de bord...',
  'analytics.select_time_range': 'Sélectionner la Période',
  'analytics.today': "Aujourd'hui",
  'analytics.last_7_days': '7 Derniers Jours',
  'analytics.last_30_days': '30 Derniers Jours',
  'analytics.from_last_period': 'par rapport à la période précédente',
  'analytics.total_products_in_catalog': 'Produits totaux dans le catalogue',
  'analytics.out_of_stock': 'Rupture de Stock',
  'analytics.no_top_products': 'Aucun produit top',
  'analytics.no_low_stock': 'Aucun stock faible',
  'analytics.no_recent_activity': 'Aucune activité récente',
  'analytics.units': 'unités',

  // Common
  'common.loading': 'Chargement...',
  'common.error': 'Erreur',
  'common.success': 'Succès',
  'common.cancel': 'Annuler',
  'common.save': 'Enregistrer',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.add': 'Ajouter',
  'common.search': 'Rechercher',
  'common.filter': 'Filtrer',
  'common.clear': 'Effacer',
  'common.yes': 'Oui',
  'common.no': 'Non',
  'common.confirm': 'Confirmer',
  'common.close': 'Fermer',
  'common.back': 'Retour',
  'common.next': 'Suivant',
  'common.previous': 'Précédent',
  'common.submit': 'Soumettre',
  'common.reset': 'Réinitialiser',
  'common.refresh': 'Actualiser',
  'common.export': 'Exporter',
  'common.import': 'Importer',
  'common.download': 'Télécharger',
  'common.upload': 'Téléverser',
  'common.view': 'Voir',
  'common.hide': 'Masquer',
  'common.show': 'Afficher',
  'common.select': 'Sélectionner',
  'common.select_all': 'Tout Sélectionner',
  'common.deselect_all': 'Tout Désélectionner',
  'common.actions': 'Actions',
  'common.status': 'Statut',
  'common.date': 'Date',
  'common.time': 'Heure',
  'common.amount': 'Montant',
  'common.quantity': 'Quantité',
  'common.total': 'Total',
  'common.subtotal': 'Sous-total',
  'common.tax': 'Taxe',
  'common.discount': 'Remise',
  'common.currency': 'MAD',
  'common.unknown': 'Inconnu',

  // Settings
  'settings.profile': 'Profil',
  'settings.notifications': 'Notifications',
  'settings.system': 'Système',
  'settings.email_notifications': 'Notifications par E-mail',
  'settings.email_notifications_desc': 'Recevoir des notifications par e-mail',
  'settings.low_stock_alerts': 'Alertes de Stock Faible',
  'settings.low_stock_alerts_desc': 'Alertes quand le stock est faible',
  'settings.sales_reports': 'Rapports de Ventes',
  'settings.sales_reports_desc': 'Rapports quotidiens de ventes',
  'settings.language': 'Langue',
  'settings.timezone': 'Fuseau Horaire',
  'settings.currency': 'Devise',
}

// Arabic translations
const arTranslations: Record<string, string> = {
  // Navigation
  'nav.dashboard': 'لوحة التحكم',
  'nav.products': 'المنتجات',
  'nav.categories': 'الفئات',
  'nav.users': 'المستخدمون',
  'nav.movements': 'الحركات',
  'nav.browse': 'تصفح',
  'nav.signout': 'تسجيل الخروج',
  'nav.analytics': 'التحليلات',
  'nav.inventory': 'المخزون',
  'nav.settings': 'الإعدادات',

  // Dashboard
  'dashboard.welcome': 'مرحباً',
  'dashboard.owner': 'المالك',
  'dashboard.staff': 'الموظف',
  'dashboard.role': 'الدور',
  'dashboard.title': 'لوحة التحكم',
  'dashboard.subtitle': 'نظام إدارة المخزون',
  'dashboard.product_management': 'إدارة المنتجات',
  'dashboard.product_desc': 'إدارة كتالوج المنتجات والفئات والمخزون.',
  'dashboard.manage_products': 'إدارة المنتجات',
  'dashboard.manage_categories': 'إدارة الفئات',
  'dashboard.analytics_reports': 'التحليلات والتقارير',
  'dashboard.analytics_desc': 'عرض تقارير المبيعات وتحليلات المخزون والرؤى.',
  'dashboard.view_analytics': 'عرض التحليلات',
  'dashboard.inventory_operations': 'عمليات المخزون',
  'dashboard.inventory_desc': 'إدارة حركات المخزون والتعديلات والإلغاءات.',
  'dashboard.manage_inventory': 'إدارة المخزون',
  'dashboard.record_sales': 'تسجيل المبيعات',
  'dashboard.record_desc':
    'تسجيل المبيعات غير المتصلة والمرتجعات لتتبع المخزون.',
  'dashboard.record_movement': 'تسجيل حركة',
  'dashboard.browse_products': 'تصفح المنتجات',
  'dashboard.browse_desc': 'البحث وعرض معلومات المنتجات ومستويات المخزون.',
  'dashboard.browse_catalog': 'تصفح الكتالوج',
  'dashboard.cart_management': 'إدارة السلة',
  'dashboard.cart_desc': 'إدارة المبيعات وتسجيل المعاملات',
  'dashboard.view_cart': 'عرض السلة',
  'dashboard.unauthorized_access': 'وصول غير مصرح',

  // User Management
  'users.title': 'إدارة الموظفين',
  'users.subtitle': 'إنشاء وإدارة حسابات موظفي متجرك',
  'users.add': 'إضافة عضو من الموظفين',
  'users.name': 'الاسم الكامل',
  'users.email': 'عنوان البريد الإلكتروني',
  'users.role': 'الدور',
  'users.password': 'كلمة المرور',
  'users.create': 'إنشاء المستخدم',
  'users.generate': 'توليد',
  'users.copy': 'نسخ',
  'users.search': 'البحث بالاسم أو البريد الإلكتروني...',
  'users.activity': 'النشاط',
  'users.movements': 'حركات',
  'users.actions': 'إجراءات',
  'users.created': 'تاريخ الإنشاء',
  'users.actions_btn': 'الإجراءات',
  'users.staff_role': 'الموظف (المبيعات والمخزون)',
  'users.password_placeholder': 'توليد أو إدخال كلمة مرور',
  'users.password_help': 'انقر على',
  'users.password_help_icon': 'لتوليد كلمة مرور آمنة',
  'users.password_warning': 'مهم:',
  'users.password_warning_text':
    'شارك كلمة المرور هذه مع المستخدم بطريقة آمنة. يمكن للمستخدم تغييرها بعد تسجيل الدخول الأول.',
  'users.total_users': 'مستخدمين',

  // POS Interface
  'pos.title': 'نقطة البيع',
  'pos.online': 'متصل',
  'pos.search': 'البحث عن المنتجات',
  'pos.search_placeholder': 'البحث بالاسم أو الباركود...',
  'pos.cart': 'سلة البيع',
  'pos.cart_empty': 'سلة التسوق فارغة',
  'pos.cart_empty_desc': 'ابحث وأضف المنتجات',
  'pos.stats': 'إحصائيات سريعة',
  'pos.sales_today': 'مبيعات اليوم',
  'pos.revenue': 'الإيرادات',
  'pos.products_sold': 'المنتجات المباعة',
  'pos.recent_activity': 'النشاط الأخير',
  'pos.no_activity': 'لا يوجد نشاط حديث',
  'pos.quick_actions': 'إجراءات سريعة',
  'pos.check_stock': 'فحص المخزون',
  'pos.return_product': 'إرجاع المنتج',
  'pos.reports': 'التقارير',
  'pos.finalize_sale': 'إنهاء البيع',
  'pos.total': 'المجموع',
  'pos.items': 'عناصر',
  'pos.add_to_cart': 'إضافة',
  'pos.quantity': 'الكمية',
  'pos.price': 'السعر',
  'pos.stock': 'المخزون',
  'pos.sku': 'رمز المنتج',
  'pos.subtitle': 'واجهة بيع مبسطة',
  'pos.noProductsFound': 'لم يتم العثور على منتجات',

  // Products
  'products.title': 'إدارة المنتجات',
  'products.subtitle': 'إدارة كتالوج المنتجات والفئات والمخزون',
  'products.add_product': 'إضافة منتج',
  'products.search_placeholder': 'البحث عن المنتجات...',
  'products.total_products': 'إجمالي المنتجات',
  'products.active_products': 'المنتجات النشطة',
  'products.low_stock': 'مخزون منخفض',
  'products.out_of_stock': 'نفاد المخزون',
  'products.name': 'اسم المنتج',
  'products.description': 'الوصف',
  'products.price': 'السعر',
  'products.stock': 'المخزون',
  'products.category': 'الفئة',
  'products.sku': 'رمز المنتج',
  'products.images': 'الصور',
  'products.active': 'نشط',
  'products.inactive': 'غير نشط',
  'products.edit': 'تعديل',
  'products.delete': 'حذف',
  'products.view': 'عرض',

  // Categories
  'categories.title': 'إدارة الفئات',
  'categories.subtitle': 'تنظيم منتجاتك في فئات',
  'categories.add_category': 'إضافة فئة',
  'categories.name': 'اسم الفئة',
  'categories.slug': 'المعرف',
  'categories.products_count': 'المنتجات',
  'categories.edit': 'تعديل',
  'categories.delete': 'حذف',

  // Movements
  'movements.title': 'إدارة الحركات',
  'movements.subtitle': 'تتبع جميع حركات المخزون',
  'movements.type': 'النوع',
  'movements.quantity': 'الكمية',
  'movements.date': 'التاريخ',
  'movements.user': 'المستخدم',
  'movements.product': 'المنتج',
  'movements.note': 'ملاحظة',
  'movements.sale': 'بيع',
  'movements.return': 'إرجاع',
  'movements.adjustment': 'تعديل',
  'movements.cancel_sale': 'إلغاء البيع',
  'movements.loss': 'خسارة',

  // Browse
  'browse.title': 'كتالوج المنتجات',
  'browse.subtitle': 'تصفح مجموعة منتجاتنا',
  'browse.search_placeholder': 'البحث عن المنتجات...',
  'browse.search': 'بحث',
  'browse.categories': 'الفئات',
  'browse.all_categories': 'جميع الفئات',
  'browse.no_products': 'لم يتم العثور على منتجات',
  'browse.view_details': 'عرض التفاصيل',
  'browse.add_to_cart': 'إضافة إلى السلة',

  // Analytics
  'analytics.title': 'لوحة تحكم المالك',
  'analytics.subtitle': 'تحليلات مفصلة وتقارير الأداء',
  'analytics.total_revenue': 'إجمالي الإيرادات',
  'analytics.total_sales': 'إجمالي المبيعات',
  'analytics.total_products': 'إجمالي المنتجات',
  'analytics.low_stock_items': 'عناصر مخزون منخفض',
  'analytics.sales_trend': 'اتجاه المبيعات',
  'analytics.top_products': 'المنتجات الأكثر مبيعاً',
  'analytics.low_stock_alerts': 'تنبيهات المخزون المنخفض',
  'analytics.recent_activity': 'النشاط الأخير',
  'analytics.loading_dashboard': 'جاري تحميل لوحة التحكم...',
  'analytics.select_time_range': 'اختيار الفترة الزمنية',
  'analytics.today': 'اليوم',
  'analytics.last_7_days': 'آخر 7 أيام',
  'analytics.last_30_days': 'آخر 30 يوم',
  'analytics.from_last_period': 'مقارنة بالفترة السابقة',
  'analytics.total_products_in_catalog': 'إجمالي المنتجات في الكتالوج',
  'analytics.out_of_stock': 'نفاد المخزون',
  'analytics.no_top_products': 'لا توجد منتجات رائدة',
  'analytics.no_low_stock': 'لا يوجد مخزون منخفض',
  'analytics.no_recent_activity': 'لا يوجد نشاط حديث',
  'analytics.units': 'وحدات',

  // Common
  'common.loading': 'جاري التحميل...',
  'common.error': 'خطأ',
  'common.success': 'نجح',
  'common.cancel': 'إلغاء',
  'common.save': 'حفظ',
  'common.delete': 'حذف',
  'common.edit': 'تعديل',
  'common.add': 'إضافة',
  'common.search': 'بحث',
  'common.filter': 'تصفية',
  'common.clear': 'مسح',
  'common.yes': 'نعم',
  'common.no': 'لا',
  'common.confirm': 'تأكيد',
  'common.close': 'إغلاق',
  'common.back': 'رجوع',
  'common.next': 'التالي',
  'common.previous': 'السابق',
  'common.submit': 'إرسال',
  'common.reset': 'إعادة تعيين',
  'common.refresh': 'تحديث',
  'common.export': 'تصدير',
  'common.import': 'استيراد',
  'common.download': 'تحميل',
  'common.upload': 'رفع',
  'common.view': 'عرض',
  'common.hide': 'إخفاء',
  'common.show': 'إظهار',
  'common.select': 'اختيار',
  'common.select_all': 'اختيار الكل',
  'common.deselect_all': 'إلغاء اختيار الكل',
  'common.actions': 'الإجراءات',
  'common.status': 'الحالة',
  'common.date': 'التاريخ',
  'common.time': 'الوقت',
  'common.amount': 'المبلغ',
  'common.quantity': 'الكمية',
  'common.total': 'المجموع',
  'common.subtotal': 'المجموع الفرعي',
  'common.tax': 'الضريبة',
  'common.discount': 'الخصم',
  'common.currency': 'درهم',
  'common.unknown': 'غير معروف',

  // Settings
  'settings.profile': 'الملف الشخصي',
  'settings.notifications': 'الإشعارات',
  'settings.system': 'النظام',
  'settings.email_notifications': 'إشعارات البريد الإلكتروني',
  'settings.email_notifications_desc': 'تلقي إشعارات عبر البريد الإلكتروني',
  'settings.low_stock_alerts': 'تنبيهات المخزون المنخفض',
  'settings.low_stock_alerts_desc': 'تنبيهات عندما يكون المخزون منخفضاً',
  'settings.sales_reports': 'تقارير المبيعات',
  'settings.sales_reports_desc': 'تقارير المبيعات اليومية',
  'settings.language': 'اللغة',
  'settings.timezone': 'المنطقة الزمنية',
  'settings.currency': 'العملة',
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState('fr')

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Load saved locale from localStorage
      const savedLocale = localStorage.getItem('preferred-locale')
      if (savedLocale && ['fr', 'ar'].includes(savedLocale)) {
        setLocale(savedLocale)

        // Apply RTL/LTR and font
        if (savedLocale === 'ar') {
          document.documentElement.setAttribute('dir', 'rtl')
          document.documentElement.setAttribute('lang', 'ar')
          document.documentElement.style.fontFamily =
            'Noto Sans Arabic, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
        } else {
          document.documentElement.setAttribute('dir', 'ltr')
          document.documentElement.setAttribute('lang', 'fr')
          document.documentElement.style.fontFamily =
            'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
        }
      }
    }
  }, [])

  const t = (key: string): string => {
    if (locale === 'ar') {
      return arTranslations[key] || key
    }
    return frTranslations[key] || key
  }

  const handleSetLocale = (newLocale: string) => {
    setLocale(newLocale)

    // Only run on client side
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale)

      // Apply RTL/LTR and font
      if (newLocale === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl')
        document.documentElement.setAttribute('lang', 'ar')
        document.documentElement.style.fontFamily =
          'Noto Sans Arabic, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
      } else {
        document.documentElement.setAttribute('dir', 'ltr')
        document.documentElement.setAttribute('lang', 'fr')
        document.documentElement.style.fontFamily =
          'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
      }
    }
  }

  return (
    <TranslationContext.Provider
      value={{ locale, setLocale: handleSetLocale, t }}
    >
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
