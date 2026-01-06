
import { CatalogItem, ItemCategory, ItemType, Staff, RoleType, Expense, Transfer, Ticket, AuditLog, PermissionCode } from './types';

export const ALL_PERMISSIONS: PermissionCode[] = [
  'DASHBOARD_VIEW', 'POS_ACCESS', 'CATALOG_VIEW', 'CATALOG_MANAGE',
  'EXPENSES_VIEW', 'EXPENSES_MANAGE', 'TRANSFERS_VIEW', 'TRANSFERS_MANAGE',
  'TICKETS_VIEW', 'TICKETS_MANAGE', 'STAFF_MANAGE', 'AUDIT_VIEW', 'BACKUP_RESET'
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  'ROOT': [...ALL_PERMISSIONS],
  'MANAGER': ['DASHBOARD_VIEW', 'POS_ACCESS', 'CATALOG_VIEW', 'CATALOG_MANAGE', 'EXPENSES_VIEW', 'EXPENSES_MANAGE', 'TRANSFERS_VIEW', 'TRANSFERS_MANAGE', 'TICKETS_VIEW', 'TICKETS_MANAGE', 'STAFF_MANAGE'],
  'CASHIER': ['DASHBOARD_VIEW', 'POS_ACCESS', 'TICKETS_VIEW', 'TRANSFERS_VIEW'],
  'OPERATRICE DE SAISIE': ['DASHBOARD_VIEW', 'POS_ACCESS', 'TICKETS_VIEW', 'TICKETS_MANAGE'],
  'COMMERCIAL': ['DASHBOARD_VIEW', 'POS_ACCESS', 'CATALOG_VIEW', 'TRANSFERS_VIEW'],
  'TECHNICIEN': ['DASHBOARD_VIEW', 'POS_ACCESS', 'TICKETS_VIEW', 'TICKETS_MANAGE', 'CATALOG_VIEW', 'EXPENSES_VIEW', 'STAFF_MANAGE']
};

export const MOCK_STAFF: Staff[] = [
  { id: '1', full_name: 'Root Admin', role: 'ROOT', is_root: true, ui_language: 'fr', ui_theme: 'blue-dark', is_active: true, permissions: DEFAULT_ROLE_PERMISSIONS['ROOT'], pin_hash: 'ra-000001' },
  { id: '2', full_name: 'Jean Gher', role: 'TECHNICIEN', is_root: false, ui_language: 'fr', ui_theme: 'blue-dark', is_active: true, permissions: DEFAULT_ROLE_PERMISSIONS['TECHNICIEN'], pin_hash: 'jg-234590' },
  { id: '3', full_name: 'Jane Manager', role: 'MANAGER', is_root: false, ui_language: 'en', ui_theme: 'light', is_active: true, permissions: DEFAULT_ROLE_PERMISSIONS['MANAGER'], pin_hash: 'jm-111222' },
  { id: '4', full_name: 'John Cashier', role: 'CASHIER', is_root: false, ui_language: 'fr', ui_theme: 'light', is_active: true, permissions: DEFAULT_ROLE_PERMISSIONS['CASHIER'], pin_hash: 'jc-999888' },
];

export const MOCK_CATALOG: CatalogItem[] = [
  { id: '1', sku: 'IPH-13-BLK', name: 'iPhone 13', category: ItemCategory.PHONE, item_type: ItemType.PRODUCT, price_amount: 450000, stock_qty: 5, track_stock: true },
  { id: '2', sku: 'SAM-A14-SLV', name: 'Samsung A14', category: ItemCategory.PHONE, item_type: ItemType.PRODUCT, price_amount: 120000, stock_qty: 10, track_stock: true },
  { id: '3', sku: 'SVC-PHOTO-BW', name: 'Photocopie NB', category: ItemCategory.IT_SERVICE, item_type: ItemType.SERVICE, price_amount: 25, stock_qty: 0, track_stock: false },
  { id: '4', sku: 'SVC-PRINT-COL', name: 'Impression Couleur', category: ItemCategory.IT_SERVICE, item_type: ItemType.SERVICE, price_amount: 100, stock_qty: 0, track_stock: false },
  { id: '5', sku: 'SVC-TMONEY', name: 'Recharge TMoney', category: ItemCategory.RECHARGE, item_type: ItemType.SERVICE, price_amount: 0, stock_qty: 0, track_stock: false },
  { id: '6', sku: 'SVC-CASIER', name: 'Demande Casier Judiciaire', category: ItemCategory.CUSTOMER_SERVICE, item_type: ItemType.SERVICE, price_amount: 5000, stock_qty: 0, track_stock: false },
  { id: '7', sku: 'ACC-COQ-SIL', name: 'Coque Silicone', category: ItemCategory.ACCESSORY, item_type: ItemType.PRODUCT, price_amount: 2500, stock_qty: 50, track_stock: true },
];

export const MOCK_EXPENSE_CATEGORIES = [
  'Loyer', 'Electricité', 'Eau', 'Internet', 'Salaires', 'Fournitures', 'Transport', 'Autres'
];

export const MOCK_EXPENSES: Expense[] = [
  { id: '1', date: '2023-10-25', category: 'Electricité', description: 'Facture Octobre', amount: 15000, user: 'Root Admin' },
  { id: '2', date: '2023-10-26', category: 'Transport', description: 'Course marché', amount: 2000, user: 'Jane Manager' },
  { id: '3', date: '2023-10-27', category: 'Fournitures', description: 'Papier rame A4', amount: 3500, user: 'Jane Manager' },
  { id: '4', date: '2023-10-28', category: 'Internet', description: 'Abonnement Fibre', amount: 25000, user: 'Root Admin' },
  { id: '5', date: '2023-10-29', category: 'Autres', description: 'Réparation serrure', amount: 5000, user: 'John Cashier' },
];

export const MOCK_TRANSFERS: Transfer[] = [
  { id: '1', provider: 'TMONEY', type: 'IN', amount: 5000, fee_amount: 100, commission_amount: 50, customer_phone: '90112233', reference: 'TX123456', status: 'DONE', created_at: '2023-10-28 10:00' },
  { id: '2', provider: 'FLOOZ', type: 'OUT', amount: 10000, fee_amount: 0, commission_amount: 150, customer_phone: '99887766', reference: 'FLZ98765', status: 'DONE', created_at: '2023-10-28 11:30' },
  { id: '3', provider: 'TMONEY', type: 'IN', amount: 2000, fee_amount: 50, commission_amount: 25, customer_phone: '91000000', reference: 'TX000000', status: 'CANCELED', created_at: '2023-10-29 09:15' },
];

export const MOCK_TICKETS: Ticket[] = [
  { id: '1', ticket_no: 'TCK-001', title: 'Ecran cassé iPhone', type: 'IT', priority: 'HIGH', status: 'IN_PROGRESS', customer_name: 'Koffi A.', created_at: '2023-10-25', assigned_to: 'Root Admin' },
  { id: '2', ticket_no: 'TCK-002', title: 'Dossier Nationalité', type: 'CUSTOMER_SERVICE', priority: 'MEDIUM', status: 'OPEN', customer_name: 'Ama B.', created_at: '2023-10-28' },
];

export const MOCK_AUDIT: AuditLog[] = [
  { id: '1', action: 'LOGIN', actor_name: 'Root Admin', entity: 'AUTH', details: 'Successful PIN login', created_at: '2023-10-29 08:00' },
  { id: '2', action: 'SALE_CREATE', actor_name: 'Root Admin', entity: 'SALE', details: 'Sale SALE-1005 created', created_at: '2023-10-29 08:15' },
  { id: '3', action: 'EXPENSE_ADD', actor_name: 'Jane Manager', entity: 'EXPENSE', details: 'Added expense 15000', created_at: '2023-10-29 09:30' },
];

export const I18N = {
  fr: {
    nav: {
      dashboard: 'Tableau de bord',
      pos: 'Caisse',
      catalog: 'Catalogue',
      sales: 'Ventes',
      expenses: 'Dépenses',
      transfers: 'Transferts',
      tickets: 'Tickets',
      staff: 'Personnel',
      logout: 'Déconnexion',
      audit: 'Audit',
      assistant: 'Assistant IA',
      backup: 'SAUVEGARDE',
      reset: 'RÉINITIALISER'
    },
    pos: {
      search: 'Rechercher un produit...',
      sku: 'SKU',
      stock: 'Stock',
      cart: 'Panier',
      empty: 'Votre panier est vide',
      total: 'Total',
      checkout: 'Encaisser',
      pay: 'Payer',
      clear: 'Vider',
      outOfStock: 'Rupture',
      inStock: 'En stock',
      currency: 'XOF',
      itemsCount: 'articles',
      helpText: 'Scannez des produits ou appuyez sur la grille pour les ajouter.',
      confirmRemove: 'Retirer cet article du panier ?',
      paySuccess: 'Paiement de {total} XOF validé avec succès !',
      receipt: {
        title: 'REÇU DE VENTE',
        saleNo: 'N° Vente',
        date: 'Date',
        item: 'Article',
        qty: 'Qté',
        price: 'Prix',
        subtotal: 'Sous-total',
        total: 'TOTAL',
        thankYou: 'Merci de votre confiance !',
        print: 'Imprimer le reçu',
        newSale: 'Nouvelle Vente'
      }
    },
    catalog: {
      sku: 'SKU',
      name: 'Nom',
      category: 'Catégorie',
      type: 'Type',
      price: 'Prix',
      stock: 'Stock',
      addItem: 'Nouveau Produit',
      editItem: 'Modifier',
      actions: 'Actions',
      formTitle: 'Détails Produit',
      trackStock: 'Suivre Stock'
    },
    dashboard: {
      title: 'Tableau de bord',
      salesToday: 'Ventes du jour',
      transactions: 'Transactions',
      lowStock: 'Stock faible',
      openTickets: 'Tickets ouverts',
      recentSales: 'Ventes récentes',
      quickActions: 'Actions rapides',
      newSale: 'Nouvelle Vente',
      addProduct: 'Nouveau Produit',
      viewAudit: 'Voir Audit'
    },
    expenses: {
      title: 'Gestion des Dépenses',
      addExpense: 'Ajouter une dépense',
      totalExpenses: 'Total Dépenses',
      recentTransactions: 'Dépenses Récentes',
      category: 'Catégorie',
      description: 'Description',
      amount: 'Montant',
      date: 'Date',
      recordedBy: 'Enregistré par',
      actions: 'Actions',
      save: 'Enregistrer',
      cancel: 'Annuler',
      formTitle: 'Nouvelle Dépense',
      selectCategory: 'Choisir une catégorie',
      enterDescription: 'Description de la dépense',
      enterAmount: 'Montant'
    },
    transfers: {
      title: 'Transferts Mobile Money',
      newTransfer: 'Nouveau Transfert',
      provider: 'Opérateur',
      type: 'Type',
      amount: 'Montant',
      fees: 'Frais',
      commission: 'Commission',
      customer: 'Client',
      status: 'Statut',
      date: 'Date',
      formTitle: 'Opération Mobile Money',
      phone: 'Numéro Téléphone',
      reference: 'Référence Opérateur',
      deposit: 'Dépôt (Envoi)',
      withdrawal: 'Retrait',
      viewReceipt: 'Voir Reçu',
      receiptTitle: 'Reçu de Transaction',
      print: 'Imprimer',
      cancelOp: 'Annuler Opération'
    },
    tickets: {
      title: 'Tickets Support & IT',
      newTicket: 'Nouveau Ticket',
      id: 'ID',
      subject: 'Sujet',
      priority: 'Priorité',
      status: 'Statut',
      assignedTo: 'Assigné à',
      customer: 'Client'
    },
    staff: {
      title: 'Gestion du Personnel',
      addStaff: 'Ajouter Membre',
      editStaff: 'Modifier Membre',
      name: 'Nom Complet',
      role: 'Rôle',
      active: 'Actif',
      pin: 'PIN (ex: sk-123456)',
      formTitle: 'Informations Membre',
      privileges: 'Privilèges & Permissions',
      rootDeleteError: 'Impossible de supprimer ou désactiver le Root Admin.',
      theme: 'Thème UI par défaut',
      language: 'Langue UI',
      roles: {
        ROOT: 'Super Admin',
        MANAGER: 'Gérant',
        CASHIER: 'Caissier'
      },
      permissions: {
        DASHBOARD_VIEW: 'Voir Dashboard',
        POS_ACCESS: 'Accès Caisse',
        CATALOG_VIEW: 'Voir Catalogue',
        CATALOG_MANAGE: 'Gérer Produits',
        EXPENSES_VIEW: 'Voir Dépenses',
        EXPENSES_MANAGE: 'Gérer Dépenses',
        TRANSFERS_VIEW: 'Voir Transferts',
        TRANSFERS_MANAGE: 'Faire Transferts',
        TICKETS_VIEW: 'Voir Tickets',
        TICKETS_MANAGE: 'Gérer Tickets',
        STAFF_MANAGE: 'Gérer Staff',
        AUDIT_VIEW: 'Voir Audit',
        BACKUP_RESET: 'Backup & Reset'
      }
    },
    audit: {
      title: 'Journal d\'Audit',
      actor: 'Utilisateur',
      action: 'Action',
      entity: 'Module',
      details: 'Détails',
      date: 'Date Heure'
    },
    ai: {
      title: 'Assistant Alliance',
      placeholder: 'Posez une question...',
      welcome: 'Bonjour ! Je suis l\'assistant intelligent DigiKiosk. Comment puis-je vous aider aujourd\'hui ?',
      thinking: 'Réflexion...',
    },
    common: {
      welcome: 'Bienvenue',
      login: 'Connexion',
      enterPin: 'Entrez votre PIN (ex: sk-123456)',
      language: 'Langue',
      theme: 'Thème',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      confirmDelete: 'Êtes-vous sûr ?',
      actions: 'Actions'
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      pos: 'POS',
      catalog: 'Catalog',
      sales: 'Sales',
      expenses: 'Expenses',
      transfers: 'Transfers',
      tickets: 'Tickets',
      staff: 'Staff',
      logout: 'Logout',
      audit: 'Audit',
      assistant: 'AI Assistant',
      backup: 'BACKUP',
      reset: 'RESET'
    },
    pos: {
      search: 'Search for a product...',
      sku: 'SKU',
      stock: 'Stock',
      cart: 'Cart',
      empty: 'Your cart is empty',
      total: 'Total',
      checkout: 'Checkout',
      pay: 'Pay',
      clear: 'Clear',
      outOfStock: 'Out of Stock',
      status: 'Status',
      inStock: 'In Stock',
      currency: 'XOF',
      itemsCount: 'items',
      helpText: 'Scan products or tap on the grid to add items.',
      confirmRemove: 'Remove this item from cart?',
      paySuccess: 'Payment of {total} XOF successfully validated!',
      receipt: {
        title: 'SALES RECEIPT',
        saleNo: 'Sale #',
        date: 'Date',
        item: 'Item',
        qty: 'Qty',
        price: 'Price',
        subtotal: 'Subtotal',
        total: 'TOTAL',
        thankYou: 'Thank you for your business!',
        print: 'Print Receipt',
        newSale: 'New Sale'
      }
    },
    catalog: {
      sku: 'SKU',
      name: 'Name',
      category: 'Category',
      type: 'Type',
      price: 'Price',
      stock: 'Stock',
      addItem: 'New Product',
      editItem: 'Edit',
      actions: 'Actions',
      formTitle: 'Product Details',
      trackStock: 'Track Stock'
    },
    dashboard: {
      title: 'Dashboard',
      salesToday: 'Sales Today',
      transactions: 'Transactions',
      lowStock: 'Low Stock',
      openTickets: 'Open Tickets',
      recentSales: 'Recent Sales',
      quickActions: 'Quick Actions',
      newSale: 'New Sale',
      addProduct: 'New Product',
      viewAudit: 'View Audit'
    },
    expenses: {
      title: 'Expense Management',
      addExpense: 'Add Expense',
      totalExpenses: 'Total Expenses',
      recentTransactions: 'Recent Expenses',
      category: 'Category',
      description: 'Description',
      amount: 'Amount',
      date: 'Date',
      recordedBy: 'Recorded By',
      actions: 'Actions',
      save: 'Save',
      cancel: 'Cancel',
      formTitle: 'New Expense',
      selectCategory: 'Select category',
      enterDescription: 'Expense description',
      enterAmount: 'Amount'
    },
    transfers: {
      title: 'Mobile Money Transfers',
      newTransfer: 'New Transfer',
      provider: 'Provider',
      type: 'Type',
      amount: 'Amount',
      fees: 'Fees',
      commission: 'Commission',
      customer: 'Customer',
      status: 'Status',
      date: 'Date',
      formTitle: 'Mobile Money Operation',
      phone: 'Phone Number',
      reference: 'Operator Reference',
      deposit: 'Deposit (Send)',
      withdrawal: 'Withdrawal',
      viewReceipt: 'View Receipt',
      receiptTitle: 'Transaction Receipt',
      print: 'Print',
      cancelOp: 'Cancel Operation'
    },
    tickets: {
      title: 'Support & IT Tickets',
      newTicket: 'New Ticket',
      id: 'ID',
      subject: 'Subject',
      priority: 'Priority',
      status: 'Status',
      assignedTo: 'Assigned To',
      customer: 'Customer'
    },
    staff: {
      title: 'Staff Management',
      addStaff: 'Add Staff',
      editStaff: 'Edit Staff',
      name: 'Full Name',
      role: 'Role',
      active: 'Active',
      pin: 'PIN (ex: sk-123456)',
      formTitle: 'Member Information',
      privileges: 'Privileges & Permissions',
      rootDeleteError: 'Cannot delete or disable Root Admin.',
      theme: 'Default UI Theme',
      language: 'UI Language',
      roles: {
        ROOT: 'Super Admin',
        MANAGER: 'Manager',
        CASHIER: 'Cashier'
      },
      permissions: {
        DASHBOARD_VIEW: 'View Dashboard',
        POS_ACCESS: 'Access POS',
        CATALOG_VIEW: 'View Catalog',
        CATALOG_MANAGE: 'Manage Products',
        EXPENSES_VIEW: 'View Expenses',
        EXPENSES_MANAGE: 'Manage Expenses',
        TRANSFERS_VIEW: 'View Transfers',
        TRANSFERS_MANAGE: 'Make Transfers',
        TICKETS_VIEW: 'View Tickets',
        TICKETS_MANAGE: 'Manage Tickets',
        STAFF_MANAGE: 'Manage Staff',
        AUDIT_VIEW: 'View Audit',
        BACKUP_RESET: 'Backup & Reset'
      }
    },
    audit: {
      title: 'Audit Logs',
      actor: 'User',
      action: 'Action',
      entity: 'Module',
      details: 'Details',
      date: 'Date Time'
    },
    ai: {
      title: 'Alliance Assistant',
      placeholder: 'Ask a question...',
      welcome: 'Hello! I am the DigiKiosk smart assistant. How can I help you today?',
      thinking: 'Thinking...',
    },
    common: {
      welcome: 'Welcome',
      login: 'Login',
      enterPin: 'Enter your PIN (ex: sk-123456)',
      language: 'Language',
      theme: 'Theme',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirmDelete: 'Are you sure?',
      actions: 'Actions'
    }
  }
};
