import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area,
  LineChart, Line, Treemap, ComposedChart, ReferenceLine, Sector
} from 'recharts';
import { 
  LayoutDashboard, Wallet, ArrowRightLeft, TrendingUp, PieChart as PieIcon,
  PlusCircle, Trash2, Building, DollarSign, 
  ArrowUpRight, ArrowDownRight, Sparkles, MessageSquare, Send,
  Bot, Loader2, Calendar, X, Eye, EyeOff, ShieldCheck, Activity,
  ChevronLeft, History, List, Save, Grid, Circle, TrendingDown, Edit,
  LogOut, User, Lock, Mail, AlertCircle, ArrowRight, Cloud,
  Globe, PiggyBank, Wand2, Calculator, Info, AlertTriangle, Clock,
  Utensils, Home, Car, Gamepad2, Heart, ShoppingBag, Zap, Briefcase,
  CheckCircle, LogIn, UserPlus, KeyRound, Target, Scale, Menu,
  BarChart2, LineChart as LineChartIcon
} from 'lucide-react';

import emailjs from '@emailjs/browser';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

// --- API CONFIGURATION ---
const apiKey = "AIzaSyCjcJoVxEkJG76D1yUbdocgxlmhqdPBNOE"; // Clef API pour Gemini
// --- INITIALISATION EMAILJS ---
emailjs.init("OvBeXwPPROzqE2kQL"); // Clef API pour EmailJS

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyD3EFbSF-t0j3a6cXi-P1RYPe5sc-Yvk5c",
  authDomain: "nodejsfinary.firebaseapp.com",
  projectId: "nodejsfinary",
  storageBucket: "nodejsfinary.firebasestorage.app",
  messagingSenderId: "451755528730",
  appId: "1:451755528730:web:5140e4835f4bbe98b0f7a3",
  measurementId: "G-HP09H5QM5N"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  // Ignore
}

const auth = getAuth(app);
const db = getFirestore(app);

// Utilisation de l'ID dynamique pour garantir l'accès aux bonnes données
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-wealth-app-default';

// --- CONFIGURATION & UTILS ---

const COLORS = {
  liquidite: '#3b82f6', // blue-500
  investissement: '#10b981', // emerald-500
  immobilier: '#f59e0b', // amber-500
  epargne_salariale: '#06b6d4', // cyan-500
  crypto: '#8b5cf6', // violet-500
  autre: '#64748b' // slate-500
};

// Nouvelle palette pour les dépenses
const EXPENSE_CATEGORIES = {
  'Alimentation': { color: '#f59e0b', icon: Utensils },       // Amber
  'Logement': { color: '#3b82f6', icon: Home },              // Blue
  'Transport': { color: '#ef4444', icon: Car },              // Red
  'Loisirs': { color: '#8b5cf6', icon: Gamepad2 },           // Purple
  'Santé': { color: '#10b981', icon: Heart },                // Emerald
  'Shopping': { color: '#ec4899', icon: ShoppingBag },       // Pink
  'Services': { color: '#6366f1', icon: Zap },               // Indigo
  'Autre': { color: '#94a3b8', icon: Circle }                // Slate
};

const CATEGORY_LABELS = {
  liquidite: 'Liquidités & Livrets',
  investissement: 'Bourse (PEA/CTO)',
  epargne_salariale: 'Épargne Salariale (PEE)',
  immobilier: 'Immobilier (Physique/SCPI)',
  crypto: 'Crypto-monnaies',
  autre: 'Autres (Montres, Or...)'
};

const INITIAL_ASSETS = [];
const INITIAL_TRANSACTIONS = [];

// --- FORMATTING HELPERS ---

// Fonction universelle pour formater les devises avec 2 décimales
const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return "0,00 €";
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// --- FONCTION DE NETTOYAGE IA ---
const formatAiResponse = (text) => {
  if (!text) return "";
  // Supprime les résidus de Markdown pour ne garder que le texte ou le HTML simple
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Enlever les ** (gras markdown)
    .replace(/\*(.*?)\*/g, '$1')     // Enlever les * (italique markdown)
    .replace(/#{1,6}\s?/g, '');      // Enlever les # (titres markdown)
};

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Disparaît après 5s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[300] animate-in slide-in-from-right duration-300">
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 min-w-[300px]">
        <div className="bg-green-500/20 p-2 rounded-full text-green-400">
          <CheckCircle size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-400 uppercase tracking-wider">MyWealth.io</p>
          <p className="text-sm text-slate-200">{message}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// --- DATA PROCESSING HELPERS ---

const processHistoryData = (timeRange, currentAssets) => {
  if (!currentAssets || currentAssets.length === 0) return [];

  const monthsBack = timeRange === '6M' ? 6 : timeRange === '1Y' ? 12 : timeRange === '5Y' ? 60 : 120;
  const data = [];
  const now = new Date();

  for (let i = monthsBack; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: i > 12 ? '2-digit' : undefined });
    
    let breakdown = { liquidite: 0, investissement: 0, immobilier: 0, crypto: 0, autre: 0, epargne_salariale: 0 };
    let totalNet = 0;

    currentAssets.forEach(asset => {
      let valueAtDate = 0;
      if (i === 0) {
        valueAtDate = asset.value;
      } else {
        if (asset.history && asset.history.length > 0) {
          const sortedHistory = [...asset.history].sort((a, b) => new Date(a.date) - new Date(b.date));
          const record = sortedHistory.filter(h => new Date(h.date) <= endOfMonthDate).pop();
          if (record) valueAtDate = record.value;
          else valueAtDate = 0; 
        } else {
          valueAtDate = asset.value;
        }
      }
      if (breakdown[asset.type] !== undefined) breakdown[asset.type] += valueAtDate;
      totalNet += valueAtDate;
    });
    
    data.push({ month: monthName, ...breakdown, totalNet: totalNet });
  }
  return data;
};

const processFlowData = (timeRange, transactions) => {
  const safeTransactions = transactions || [];
  const monthsBack = timeRange === '6M' ? 6 : timeRange === '1Y' ? 12 : timeRange === '5Y' ? 60 : 120;
  const data = [];
  const now = new Date();

  for (let i = monthsBack; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`; 
    
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: i > 12 ? '2-digit' : undefined });
    const monthTrans = safeTransactions.filter(t => t.date.startsWith(monthKey));
    
    const revenus = monthTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const depenses = monthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const solde = revenus - depenses;

    data.push({ month: monthName, rawDate: monthKey, revenus, depenses, solde });
  }
  return data;
};

// --- API HELPER ---
async function callGeminiAPI(systemPrompt, userPrompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          tools: [{ google_search: {} }]
        })
      }
    );
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolé, je n'ai pas pu analyser les données.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Une erreur est survenue avec l'assistant. Vérifiez la clé API.";
  }
}

// --- UI COMPONENTS ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 transform scale-100 transition-all">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <div className="p-2 bg-red-50 rounded-full"><AlertTriangle size={24} /></div>
          <h3 className="text-lg font-bold text-slate-900">{title || "Confirmer"}</h3>
        </div>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">{message || "Êtes-vous sûr de vouloir supprimer cet élément ?"}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors text-sm">Annuler</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors shadow-sm text-sm">Oui, supprimer</button>
        </div>
      </div>
    </div>
  );
};

const ProfileModal = ({ isOpen, onClose, userProfile, onUpdate, assets, transactions, onRestore }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    monthlyIncome: '',
    financialGoal: 'freedom',
    riskProfile: 'balanced',
    emailReports: false
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        birthDate: userProfile.birthDate || '',
        monthlyIncome: userProfile.monthlyIncome || '',
        financialGoal: userProfile.financialGoal || 'freedom',
        riskProfile: userProfile.riskProfile || 'balanced',
        emailReports: userProfile.emailReports || false
      });
    }
  }, [isOpen, userProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleExport = () => {
    const dataToExport = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      profile: userProfile,
      assets: assets,
      transactions: transactions
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_wealth_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (window.confirm("Voulez-vous vraiment restaurer ces données ? Cela remplacera votre patrimoine et vos transactions actuels.")) {
          onRestore(json);
        }
      } catch (err) {
        alert("Fichier invalide.");
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><User size={24} className="text-blue-600"/> Mon Profil</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full"><X size={20}/></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onUpdate(formData); onClose(); }} className="space-y-5">
            {/* IDENTITÉ */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom</label>
                    <input type="text" name="firstName" className="w-full p-2.5 rounded-lg border border-slate-300 outline-none" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom</label>
                    <input type="text" name="lastName" className="w-full p-2.5 rounded-lg border border-slate-300 outline-none" value={formData.lastName} onChange={handleChange} required />
                </div>
            </div>

            {/* DONNÉES FINANCIÈRES (ORIGINALES) */}
            <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2"><Activity size={16}/> Données Financières</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Date de naissance</label>
                        <input type="date" name="birthDate" className="w-full p-2.5 rounded-lg border border-slate-300 outline-none" value={formData.birthDate} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Revenu Mensuel Net (€)</label>
                        <input type="number" name="monthlyIncome" className="w-full p-2.5 rounded-lg border border-slate-300 outline-none" value={formData.monthlyIncome} onChange={handleChange} />
                    </div>
                </div>
                
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Objectif Principal</label>
                    <select name="financialGoal" className="w-full p-2.5 rounded-lg border border-slate-300 outline-none bg-white" value={formData.financialGoal} onChange={handleChange}>
                        <option value="freedom">Liberté Financière / FIRE</option>
                        <option value="retirement">Préparer sa retraite</option>
                        <option value="real_estate">Achat Immobilier</option>
                        <option value="safety">Épargne de précaution</option>
                        <option value="growth">Croissance du capital</option>
                        <option value="other">Autre</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Profil de Risque</label>
                    <select name="riskProfile" className="w-full p-2.5 rounded-lg border border-slate-300 outline-none bg-white" value={formData.riskProfile} onChange={handleChange}>
                        <option value="prudent">Prudent (Sécurité avant tout)</option>
                        <option value="balanced">Équilibré (Risque modéré)</option>
                        <option value="dynamic">Dynamique (Performance max)</option>
                    </select>
                </div>
            </div>

            {/* SÉCURITÉ & BACKUP (NOUVEAU) */}
            <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-green-600"/> Sécurité & Sauvegarde</h4>
                
                <div className="flex items-start gap-3 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <input type="checkbox" id="emailReports" name="emailReports" checked={formData.emailReports} onChange={handleChange} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                    <label htmlFor="emailReports" className="text-[11px] text-blue-900 font-medium leading-tight">
                        Recevoir un rapport d'analyse mensuel (inclut une sauvegarde automatique de vos données).
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={handleExport} className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
                        <Save size={20} className="text-blue-500 group-hover:scale-110 transition-transform mb-1"/>
                        <span className="text-[10px] font-bold uppercase text-blue-600">Exporter Sauvegarde</span>
                    </button>
                    <button type="button" onClick={() => fileInputRef.current.click()} className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                        <Cloud size={20} className="text-slate-400 group-hover:text-indigo-600 mb-1"/>
                        <span className="text-[10px] font-bold uppercase text-slate-500">Importer Sauvegarde</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                </div>
            </div>

            <div className="flex gap-3 justify-end mt-4 border-t border-slate-100 pt-4">
                <Button variant="secondary" onClick={onClose} type="button">Annuler</Button>
                <Button type="submit" disabled={loading}>Enregistrer</Button>
            </div>
        </form>
      </div>
    </div>
  );
};

const InactivityModal = ({ isOpen, onStayConnected }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full border border-slate-200 text-center">
        <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <Clock size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Êtes-vous toujours là ?</h3>
        <p className="text-slate-600 mb-6">
          Pour votre sécurité, vous serez déconnecté automatiquement dans moins de 5 minutes en raison d'inactivité.
        </p>
        <button 
          onClick={onStayConnected} 
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold transition-all shadow-lg hover:shadow-indigo-200"
        >
          Rester connecté
        </button>
      </div>
    </div>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-300 hover:shadow-md transition-all duration-300 p-4 md:p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false, type="button" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 justify-center";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100",
    danger: "text-red-600 hover:bg-red-50",
    magic: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-md",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100",
    icon: "p-2 hover:bg-slate-100 rounded-full",
    google: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
  };
  return (
    <button onClick={onClick} type={type} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SparklineCard = ({ title, value, data, dataKey, color, icon: Icon, percentage }) => {
  // On crée un ID unique et valide (sans espaces) pour le dégradé SVG
  const gradientId = `grad-${title.replace(/\s+/g, '-')}`;
  const hasData = data && data.length > 0 && data.some(d => d.value > 0);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-300 hover:shadow-md transition-all duration-300 overflow-hidden relative flex flex-col justify-between h-32 md:h-40 hover:border-indigo-200 bg-slate-50/50`}>
      <div className="p-4 md:p-5 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-900">{value}</h3>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
            <Icon size={20} style={{ color: color }} />
          </div>
        </div>
        {percentage && hasData && (
          <div className="mt-2 flex items-center">
             <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${parseFloat(percentage) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {parseFloat(percentage) >= 0 ? '+' : ''}{percentage}%
             </span>
             <span className="text-[10px] text-slate-400 ml-2 hidden sm:inline">vs fin mois dernier</span>
          </div>
        )}
      </div>

      {/* ZONE DU GRAPHIQUE */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.6}/>
                  <stop offset="100%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={2} 
                fill={`url(#${gradientId})`} // Utilisation de l'ID nettoyé
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-end justify-center pb-2 opacity-50">
            <div className="w-full h-1 bg-slate-100"></div>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  const parseContent = (text) => {
    // Sécurité : si le texte est vide ou null
    if (!text) return "";
    if (isUser) return text;
    
    // On utilise la fonction de nettoyage définie plus haut
    const cleanText = formatAiResponse(text);
    
    return cleanText.split('\n').map((line, index) => {
      let content = line;
      let isHeader2 = line.startsWith('## ');
      let isHeader3 = line.startsWith('### ');
      let isList = line.trim().match(/^[-*]\s/);

      if (isHeader2) content = line.replace('## ', '');
      if (isHeader3) content = line.replace('### ', '');
      if (isList) content = line.replace(/^[-*]\s/, '');

      // Logique pour transformer les <b> en vrais éléments HTML gras
      const parts = content.split(/(<b>.*?<\/b>)/g);
      const renderedLine = parts.map((part, i) => {
        if (part.startsWith('<b>') && part.endsWith('</b>')) {
          return <strong key={i} className="font-bold text-slate-900">{part.replace(/<\/?b>/g, '')}</strong>;
        }
        return part;
      });

      if (isHeader2) return <h3 key={index} className="text-lg font-bold text-indigo-700 mt-4 mb-2">{renderedLine}</h3>;
      if (isHeader3) return <h4 key={index} className="text-base font-bold text-indigo-900 mt-3 mb-1">{renderedLine}</h4>;
      if (isList) return (
        <div key={index} className="flex gap-2 ml-1 mb-1">
          <span className="text-indigo-400 mt-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0 block"></span>
          <span className="text-slate-700">{renderedLine}</span>
        </div>
      );
      if (!line.trim()) return <div key={index} className="h-2"></div>;
      return <p key={index} className="mb-1 text-slate-700 leading-relaxed">{renderedLine}</p>;
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] md:max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 rounded-bl-none'}`}>
        {parseContent(message.content)}
      </div>
    </div>
  );
};

const EmptyState = ({ title, description, actionLabel, onAction, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
    <div className="p-4 bg-white rounded-full shadow-sm mb-4"><Icon size={32} className="text-slate-400" /></div>
    <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 mb-6 max-w-xs">{description}</p>
    {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
  </div>
);

// --- INTERACTIVE CHART COMPONENT ---
const InteractiveBudgetChart = ({ cashflowData, transactions, hasFlowData, onMonthSelect, onCategorySelect }) => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

// Gère le clic sur une barre (Mois)
const handleExpenseBarClick = (data) => {
  if (data && data.payload) {
    const monthKey = data.payload.rawDate;
    setSelectedMonth(data.payload);
    setActiveIndex(-1); // On réinitialise la catégorie
    if (onMonthSelect) onMonthSelect(monthKey);
    if (onCategorySelect) onCategorySelect(null);
  }
};

// Gère le clic sur une part du camembert (Catégorie + Dé-sélection)
const handlePieClick = (data, index) => {
  const isDeselecting = activeIndex === index;
  const newIndex = isDeselecting ? -1 : index;
  setActiveIndex(newIndex);
  
  if (onCategorySelect) {
    onCategorySelect(isDeselecting ? null : data.name);
  }
};

// Gère le bouton retour (Reset total)
const handleBack = () => {
  setSelectedMonth(null);
  setActiveIndex(-1);
  if (onMonthSelect) onMonthSelect(null);
  if (onCategorySelect) onCategorySelect(null);
};

  const onPieEnter = useCallback((_, index) => setActiveIndex(index), []);
  const onPieLeave = useCallback(() => setActiveIndex(-1), []);

  const pieData = useMemo(() => {
    if (!selectedMonth || !transactions) return [];
    const monthKey = selectedMonth.rawDate;
    const monthTransactions = transactions.filter(t => 
      t.date.startsWith(monthKey) && t.type === 'expense'
    );
    const categoryTotals = {};
    monthTransactions.forEach(t => {
      const cat = t.category || 'Autre';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });
    return Object.keys(categoryTotals).map(cat => ({ name: cat, value: categoryTotals[cat] })).sort((a,b) => b.value - a.value);
  }, [selectedMonth, transactions]);

  const totalExpenses = useMemo(() => pieData.reduce((sum, item) => sum + item.value, 0), [pieData]);
  const activeItem = activeIndex !== -1 ? pieData[activeIndex] : null;
  const centerLabel = activeItem ? activeItem.name : "Dépensé";
  const centerValue = activeItem ? activeItem.value : totalExpenses;
  const centerColor = activeItem && EXPENSE_CATEGORIES[activeItem.name] ? EXPENSE_CATEGORIES[activeItem.name].color : '#1e293b'; 
  const centerSubLabel = activeItem ? `${((activeItem.value / totalExpenses) * 100).toFixed(1)}%` : "Total";

  const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }) => {
    if (percent < 0.02) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const CategoryIcon = EXPENSE_CATEGORIES[payload.name]?.icon || Circle;
    return (
      <g pointerEvents="none">
        <foreignObject x={x - 12} y={y - 12} width={24} height={24}>
          <div className="flex items-center justify-center w-full h-full text-white drop-shadow-md">
             <CategoryIcon size={16} strokeWidth={2.5} />
          </div>
        </foreignObject>
      </g>
    );
  }, []);

  return (
    <div className="h-96 w-full relative transition-all duration-300 flex flex-col min-h-[384px] min-w-[300px]">
      {!hasFlowData && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
          <p className="text-slate-400 text-sm font-medium">Aucune donnée</p>
        </div>
      )}
      {selectedMonth ? (
        <div className="h-full w-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
           <div className="flex justify-between items-center mb-1 px-2">
             <div className="flex items-center gap-2">
                <button onClick={handleBack} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="Retour au graphique global">
                  <ChevronLeft size={24}/>
                </button>
                <div>
                    <h4 className="font-bold text-slate-800 text-lg leading-tight">{selectedMonth.month} {selectedMonth.rawDate?.split('-')[0]}</h4>
                    <p className="text-xs text-slate-500">Détail des dépenses</p>
                </div>
             </div>
           </div>
           <div className="flex-1 relative min-h-[260px]">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">Aucune dépense ce mois-ci</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70} 
                    outerRadius={105} 
                    paddingAngle={4} 
                    dataKey="value" 
                    label={renderCustomizedLabel} 
                    labelLine={false} 
                    animationDuration={800}
                  >
                    {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={EXPENSE_CATEGORIES[entry.name]?.color || EXPENSE_CATEGORIES['Autre'].color} 
                          stroke="none"
                          onClick={() => handlePieClick(entry, index)} // Ajout du clic
                          className="cursor-pointer"
                          opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.3} 
                          style={{ transition: 'opacity 0.2s ease', outline: 'none' }}
                        />
                      ))}
                    </Pie>
                 </PieChart>
               </ResponsiveContainer>
             )}
             {pieData.length > 0 && (
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0" style={{top: '0'}}>
                 <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">{centerSubLabel}</span>
                 <span className="text-3xl font-extrabold transition-colors duration-200" style={{ color: centerColor }}>{formatCurrency(centerValue)}</span>
                 <span className="text-sm font-bold text-slate-600 mt-1 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 shadow-sm">{centerLabel}</span>
               </div>
             )}
           </div>
           <div className="mt-4 flex flex-wrap justify-center gap-2 px-2 overflow-y-auto max-h-24 no-scrollbar">
                  {pieData.map((entry, index) => {
                      const CatIcon = EXPENSE_CATEGORIES[entry.name]?.icon || Circle;
                      const color = EXPENSE_CATEGORIES[entry.name]?.color || '#94a3b8';
                      const isSelected = activeIndex === index;
                      return (
                        <div 
                          key={entry.name} 
                          onClick={() => handlePieClick(entry, index)} // Ajout du clic pour filtrer
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all cursor-pointer flex-shrink-0 ${isSelected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-100 scale-105' : 'bg-white border-slate-100'}`}
                        >
                        <div className="p-1 rounded-full" style={{ backgroundColor: color + '20', color: color }}><CatIcon size={10} /></div>
                        <span className="text-[10px] font-semibold text-slate-700">{entry.name}</span>
                        <span className="text-[10px] text-slate-500">{totalExpenses > 0 ? Math.round((entry.value / totalExpenses) * 100) : 0}%</span>
                    </div>
                  );
              })}
           </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={cashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <RechartsTooltip 
              cursor={{fill: '#f1f5f9'}} 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(4px)',
                padding: '8px 12px',
                fontSize: '12px'
              }} 
              offset={25}
              allowEscapeViewBox={{ x: false, y: true }}
              formatter={(value) => formatCurrency(value)} 
              wrapperStyle={{ pointerEvents: 'none' }} 
            />
            <Bar dataKey="revenus" name="Revenus" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={16} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={handleExpenseBarClick}/>
            <Bar dataKey="depenses" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={handleExpenseBarClick} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};


// --- COMPOSANTS VUES & DETAILS ---

const AssetDetailOverlay = ({ asset, onClose, onUpdate }) => {
  const isComposite = ['investissement', 'crypto', 'immobilier', 'autre', 'epargne_salariale'].includes(asset.type);
  const [activeTab, setActiveTab] = useState(isComposite ? 'composition' : 'history'); 
  const [viewMode, setViewMode] = useState('asset'); 
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [newPosition, setNewPosition] = useState({ name: '', value: '' });
  const [newAssetHistoryPoint, setNewAssetHistoryPoint] = useState({ date: new Date().toISOString().split('T')[0], value: asset.value });
  const [currentBalanceUpdate, setCurrentBalanceUpdate] = useState(Number(asset.value || 0).toFixed(2));
  const [newPosHistoryPoint, setNewPosHistoryPoint] = useState({ date: new Date().toISOString().split('T')[0], value: '' });
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState(null); 
  const [focusedPosId, setFocusedPosId] = useState(null);
  const [movementConfig, setMovementConfig] = useState(null); 
  const [movementData, setMovementData] = useState({ positionId: '', amount: '' });

  const handleExecuteMovement = (e) => {
    e.preventDefault();
    const amount = parseFloat(movementData.amount);
    if (isNaN(amount) || amount <= 0 || !movementData.positionId) return;

    const today = new Date().toISOString().split('T')[0];
    const movementType = movementConfig.type; // 'buy' ou 'sell'

    const updatedPositions = asset.positions.map(p => {
      // 1. Mise à jour de la poche Cash
      if (p.isCash) {
        const delta = movementType === 'buy' ? -amount : amount;
        return { ...p, value: parseFloat((p.value + delta).toFixed(2)) };
      }

      // 2. Mise à jour du support et fusion dans son historique
      if (p.id.toString() === movementData.positionId.toString()) {
        const currentInvested = (typeof p.totalInvested === 'number') ? p.totalInvested : 0;
        const delta = movementType === 'buy' ? amount : -amount;
        const newValue = parseFloat((p.value + delta).toFixed(2));
        
        // On met à jour ou on crée le point d'historique pour aujourd'hui
        let updatedHistory = [...(p.history || [])];
        const existingIdx = updatedHistory.findIndex(h => h.date === today);
        
        if (existingIdx >= 0) {
          updatedHistory[existingIdx] = { 
            ...updatedHistory[existingIdx], 
            value: newValue,
            movementTag: movementType // On ajoute le tag sur le point existant
          };
        } else {
          updatedHistory.push({ date: today, value: newValue, movementTag: movementType });
        }

        return { 
          ...p, 
          value: newValue,
          totalInvested: parseFloat((currentInvested + delta).toFixed(2)),
          history: updatedHistory
        };
      }
      return p;
    });

    onUpdate({ ...asset, positions: updatedPositions });
    setMovementConfig(null);
    setMovementData({ positionId: '', amount: '' });
  };

  // Calculs avancés pour PEA/CTO
  const metrics = useMemo(() => {
    const cashPos = (asset.positions || []).find(p => p.isCash);
    const cashValue = cashPos ? cashPos.value : 0;
    
    if (!isComposite) return { totalInvested: asset.value, plusValue: 0, plusValuePct: 0, cash: cashValue };
    
    const supports = (asset.positions || []).filter(p => !p.isCash);
    const totalInvestedInSupports = supports.reduce((acc, pos) => acc + (pos.totalInvested || 0), 0);
    const currentSupportsValue = supports.reduce((acc, pos) => acc + pos.value, 0);

    const plusValue = currentSupportsValue - totalInvestedInSupports;
    const plusValuePct = totalInvestedInSupports > 0 ? (plusValue / totalInvestedInSupports) * 100 : 0;

    return { totalInvested: totalInvestedInSupports, plusValue, plusValuePct, cash: cashValue };
  }, [asset, isComposite]);

  const { totalInvested, plusValue, plusValuePct, cash } = metrics;

  useEffect(() => {
    if (selectedPosition) {
      const updatedPos = asset.positions?.find(p => p.id === selectedPosition.id);
      if (updatedPos) setSelectedPosition(updatedPos);
    }
  }, [asset, selectedPosition]);

  const getChartData = (history, currentValue, currentInvested) => {
    const uniqueHistoryMap = new Map();
    (history || []).forEach(item => uniqueHistoryMap.set(item.date, item));
    const today = new Date().toISOString().split('T')[0];
    // On ajoute la valeur investie au point d'aujourd'hui
    uniqueHistoryMap.set(today, { 
      date: today, 
      value: currentValue, 
      investedValue: currentInvested 
    });
    return Array.from(uniqueHistoryMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  

  const rebuildGlobalHistory = (currentPositions) => {
    const allDates = new Set();
    currentPositions.forEach(pos => { if (pos.history) pos.history.forEach(h => allDates.add(h.date)); });
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
    return sortedDates.map(date => {
      const totalAtDate = currentPositions.reduce((sum, pos) => {
        const sortedPosHistory = [...(pos.history || [])].sort((a,b) => new Date(a.date) - new Date(b.date));
        const exactMatch = sortedPosHistory.find(h => h.date === date);
        if (exactMatch) return sum + exactMatch.value;
        const previousEntries = sortedPosHistory.filter(h => h.date < date);
        const lastEntry = previousEntries.length > 0 ? previousEntries[previousEntries.length - 1] : null;
        return sum + (lastEntry ? lastEntry.value : 0);
      }, 0);
      return { date, value: totalAtDate };
    });
  };

  const assetChartData = useMemo(() => 
    getChartData(asset.history, asset.value, totalInvested), 
    [asset, totalInvested]
  );

  const positionChartData = useMemo(() => selectedPosition ? getChartData(selectedPosition.history, selectedPosition.value) : [], [selectedPosition]);

  const handleUpdateBalance = (e) => {
    e.preventDefault();
    const newValue = Math.round(parseFloat(currentBalanceUpdate) * 100) / 100;
    if (isNaN(newValue)) return;
    const today = new Date().toISOString().split('T')[0];
    const historyWithoutToday = (asset.history || []).filter(h => h.date !== today);
    const updatedHistory = [...historyWithoutToday, { date: today, value: newValue }];
    onUpdate({ ...asset, value: newValue, history: updatedHistory });
  };

  const handleAddPosition = (e) => {
    e.preventDefault();
    if (!newPosition.name) return;
    const today = new Date().toISOString().split('T')[0];
    
    // Création d'un support vide (valeur 0) avec un PRU (totalInvested) à 0
    const newPos = { 
      id: Date.now(), 
      name: newPosition.name, 
      value: 0, 
      totalInvested: 0, 
      history: [{ date: today, value: 0 }] 
    };

    const updatedPositions = [...(asset.positions || []), newPos];
    // La valorisation totale du PEA inclut désormais ce nouveau support (à 0€) + le Cash
    const newTotal = updatedPositions.reduce((acc, p) => acc + p.value, 0);
    const newAssetHistory = rebuildGlobalHistory(updatedPositions);
    
    onUpdate({ ...asset, positions: updatedPositions, value: newTotal, history: newAssetHistory });
    setNewPosition({ name: '', value: '' });
  };

  const handleDeletePosition = (posId) => {
    const updatedPositions = asset.positions.filter(p => p.id !== posId);
    const newTotal = updatedPositions.reduce((acc, p) => acc + p.value, 0);
    const newAssetHistory = rebuildGlobalHistory(updatedPositions);
    onUpdate({ ...asset, positions: updatedPositions, value: newTotal, history: newAssetHistory });
  };

    const handleAddAssetHistory = (e) => {
    e.preventDefault();
    if (!newAssetHistoryPoint.date || !newAssetHistoryPoint.value) return;
    const newValue = Math.round(parseFloat(newAssetHistoryPoint.value) * 100) / 100;
    const date = newAssetHistoryPoint.date;
    const historyWithoutDate = (asset.history || []).filter(h => h.date !== date);
    const updatedHistory = [...historyWithoutDate, { date: date, value: newValue }];
    updatedHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    const today = new Date().toISOString().split('T')[0];
    const latestPastEntry = [...updatedHistory].reverse().find(h => h.date <= today);
    const newCurrentValue = latestPastEntry ? latestPastEntry.value : asset.value;
    onUpdate({ ...asset, history: updatedHistory, value: newCurrentValue });
    setNewAssetHistoryPoint({ ...newAssetHistoryPoint, value: '' }); 
  };

  const handleDeleteAssetHistory = (idx) => {
    const sortedHistory = [...(asset.history || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const itemToDelete = sortedHistory[idx];
    const updatedHistory = asset.history.filter(h => h !== itemToDelete);
    updatedHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    const today = new Date().toISOString().split('T')[0];
    const latestPastEntry = [...updatedHistory].reverse().find(h => h.date <= today);
    const newCurrentValue = latestPastEntry ? latestPastEntry.value : (updatedHistory.length === 0 ? 0 : asset.value);
    onUpdate({ ...asset, history: updatedHistory, value: newCurrentValue });
  };

  const handleAddPositionHistory = (e) => {
    e.preventDefault();
    if (!newPosHistoryPoint.date || !newPosHistoryPoint.value) return;
    const newValue = parseFloat(newPosHistoryPoint.value);
    const date = newPosHistoryPoint.date;
    
    const historyWithoutDate = (selectedPosition.history || []).filter(h => h.date !== date);
    const updatedHistory = [...historyWithoutDate, { date: date, value: newValue }];
    updatedHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const today = new Date().toISOString().split('T')[0];
    const latestPastEntry = [...updatedHistory].reverse().find(h => h.date <= today);
    const newPosValue = latestPastEntry ? latestPastEntry.value : selectedPosition.value;

    const updatedPositions = asset.positions.map(p => {
      if (p.id === selectedPosition.id) {
        // LOGIQUE : Si le total investi est à 0, on considère que la première 
        // valeur renseignée est l'investissement de départ (PRU).
        const newTotalInvested = (p.totalInvested || 0) === 0 ? newPosValue : p.totalInvested;
        return { ...p, history: updatedHistory, value: newPosValue, totalInvested: newTotalInvested };
      }
      return p;
    });

    const newAssetTotal = updatedPositions.reduce((sum, p) => sum + p.value, 0);
    const newAssetHistory = rebuildGlobalHistory(updatedPositions);
    onUpdate({ ...asset, positions: updatedPositions, value: newAssetTotal, history: newAssetHistory });
    setNewPosHistoryPoint({ ...newPosHistoryPoint, value: '' });
  };

  const handleDeletePositionHistory = (idx) => {
    const sortedHistory = [...(selectedPosition.history || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const itemToDelete = sortedHistory[idx];
    const updatedHistory = selectedPosition.history.filter(h => h !== itemToDelete);
    updatedHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    const today = new Date().toISOString().split('T')[0];
    const latestPastEntry = [...updatedHistory].reverse().find(h => h.date <= today);
    const newPosValue = latestPastEntry ? latestPastEntry.value : (updatedHistory.length === 0 ? 0 : selectedPosition.value);
    const updatedPositions = asset.positions.map(p => p.id === selectedPosition.id ? { ...p, history: updatedHistory, value: newPosValue } : p);
    const newAssetTotal = updatedPositions.reduce((sum, p) => sum + p.value, 0);
    const newAssetHistory = rebuildGlobalHistory(updatedPositions);
    onUpdate({ ...asset, positions: updatedPositions, value: newAssetTotal, history: newAssetHistory });
  };

  const executeDelete = () => {
    if (!deleteConfig) return;
    const { type, id } = deleteConfig;
    if (type === 'position') handleDeletePosition(id);
    if (type === 'assetHistory') handleDeleteAssetHistory(id);
    if (type === 'posHistory') handleDeletePositionHistory(id);
    setDeleteConfig(null);
  };

  const handleAnalyzeAsset = async () => {
    setIsAnalyzing(true);
    const context = `Analyse l'actif: ${asset.name} (${asset.type}). Markdown.`;
    try {
        const result = await callGeminiAPI("Expert Bourse. Utilise ## pour les titres, - pour les listes, et <b> pour mettre en gras les mots importants. Interdiction d'utiliser les caractères * ou **.", context);
        setAiAnalysis(result);
    } catch (e) { setAiAnalysis("Erreur."); }
    setIsAnalyzing(false);
  };

return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 text-slate-900">
    <ConfirmationModal 
      isOpen={!!deleteConfig} 
      onClose={() => setDeleteConfig(null)} 
      onConfirm={executeDelete} 
    />
    
    <div className="bg-white md:rounded-2xl shadow-2xl w-full max-w-4xl h-full md:h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
      
      {/* --- VUE DÉTAIL DE L'ACTIF --- */}
      {viewMode === 'asset' && (
        <>
          {/* EN-TÊTE */}
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
            <div>
              <button onClick={onClose} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 mb-2 text-sm font-medium">
                <ChevronLeft size={16} /> Retour
              </button>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Building size={20} className="text-blue-600"/>{asset.name}
              </h2>
              <p className="text-slate-500 text-xs md:text-sm">{asset.institution} • {CATEGORY_LABELS[asset.type]}</p>
            </div>
            <div className="text-right">
              <p className="text-xs md:text-sm text-slate-500">Valorisation Actuelle</p>
              <p className="text-xl md:text-3xl font-bold text-blue-600">{formatCurrency(asset.value)}</p>
            </div>
          </div>

          {/* NAVIGATION PAR ONGLETS */}
          <div className="flex border-b border-slate-100 bg-white px-4 md:px-6">
            {isComposite && (
              <button 
                onClick={() => setActiveTab('composition')}
                className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'composition' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
              >
                Composition
              </button>
            )}
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
            >
              Historique
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'analysis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
            >
              Analyse IA ✨
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            
            {/* CONTENU ONGLET : COMPOSITION */}
            {activeTab === 'composition' && isComposite && (
              <>
                {['investissement', 'epargne_salariale', 'crypto'].includes(asset.type) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-[10px] uppercase font-bold text-indigo-600 mb-1">Cash Disponible</p>
                      <p className="text-sm font-bold text-indigo-700">
                        {formatCurrency(asset.positions?.find(p => p.isCash)?.value || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Versé (PRU)</p>
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(totalInvested)}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 md:col-span-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Plus-Value Latente</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${plusValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {plusValue >= 0 ? '+' : ''}{formatCurrency(plusValue)}
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${plusValue >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {plusValuePct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-6">
                    <Card className="h-fit bg-slate-50/50 border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <ArrowRightLeft size={18} className="text-blue-600"/> Mouvement Interne
                      </h3>
                      {!movementConfig ? (
                        <>
                          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                            Déplacez vos fonds entre vos <b>espèces</b> et vos <b>supports</b>.
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setMovementConfig({type: 'buy'})} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all group">
                              <PlusCircle size={18} className="mb-1 text-blue-600 group-hover:scale-110 transition-transform"/>
                              <span className="text-[10px] font-bold uppercase tracking-wider">Acheter</span>
                            </button>
                            <button onClick={() => setMovementConfig({type: 'sell'})} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all group">
                              <ArrowRightLeft size={18} className="mb-1 text-blue-600 group-hover:rotate-180 transition-transform duration-500"/>
                              <span className="text-[10px] font-bold uppercase tracking-wider">Vendre</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <form onSubmit={handleExecuteMovement} className="space-y-3 animate-in fade-in zoom-in-95">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase text-indigo-600">{movementConfig.type === 'buy' ? 'Achat de support' : 'Vente de support'}</span>
                            <button onClick={() => setMovementConfig(null)} className="text-indigo-400 hover:text-indigo-600"><X size={14}/></button>
                          </div>
                          <select className="w-full p-2 text-xs rounded-lg border border-indigo-200" value={movementData.positionId} onChange={(e) => setMovementData({...movementData, positionId: e.target.value})} required>
                            <option value="">Sélectionner un support...</option>
                            {asset.positions.filter(p => !p.isCash).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input type="number" placeholder="Montant (€)" className="w-full p-2 text-xs rounded-lg border border-indigo-200" value={movementData.amount} onChange={(e) => setMovementData({...movementData, amount: e.target.value})} required />
                          <Button type="submit" className="w-full text-xs py-2 bg-indigo-600 text-white">Confirmer</Button>
                        </form>
                      )}
                    </Card>

                    <Card className="h-fit bg-slate-50/50 border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PlusCircle size={20} className="text-blue-600"/> Ajouter une ligne</h3>
                      <form onSubmit={handleAddPosition} className="space-y-4">
                        <input type="text" className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: ETF S&P 500" value={newPosition.name} onChange={(e) => setNewPosition({...newPosition, name: e.target.value})} />
                        <Button type="submit" className="w-full justify-center" disabled={!newPosition.name}>Créer la ligne</Button>
                      </form>
                    </Card>
                  </div>

                  <Card className="lg:col-span-2 overflow-hidden flex flex-col border-slate-200 p-0">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">Lignes détenues</h3>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px]">
                      {(!asset.positions || asset.positions.filter(p => !p.isCash).length === 0) ? (
                        <div className="p-10 text-center text-slate-400">Aucune ligne investie.</div>
                      ) : (
                        asset.positions.filter(p => !p.isCash).map(pos => {
                          // Calcul de la performance de la ligne
                          const posPerf = pos.value - (pos.totalInvested || 0);
                          const posPct = pos.totalInvested > 0 ? (posPerf / pos.totalInvested) * 100 : 0;
                          
                          return (
                            <div 
                              key={pos.id} 
                              className="p-4 flex items-center justify-between hover:bg-slate-50 transition group cursor-pointer" 
                              onClick={() => { setSelectedPosition(pos); setViewMode('position'); }}
                            >
                              {/* À GAUCHE : Nom et PRU */}
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-slate-700 truncate">{pos.name}</span>
                              </div>
                              
                              {/* À DROITE : Valeur et Indicateur de Performance */}
                              <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="text-right flex flex-col items-end">
                                  <span className="font-bold text-slate-900">{formatCurrency(pos.value)}</span>
                                  
                                  {/* Tag de performance (Montant + Pourcentage) */}
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${posPerf >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {posPerf >= 0 ? '+' : ''}{posPct.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Bouton de suppression */}
                                {!pos.isCash && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfig({ type: 'position', id: pos.id }); }} 
                                  className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={16} />
                                </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card>
                </div>
              </>
            )}

            {/* CONTENU ONGLET : HISTORIQUE */}
            {activeTab === 'history' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                <div className="space-y-6">
                  {isComposite ? (
                    <Card className="h-fit bg-indigo-50 border-indigo-100">
                      <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Info size={20} /> Mode Synchronisé</h3>
                      <p className="text-sm text-indigo-800 leading-relaxed">L'historique est calculé automatiquement en additionnant l'historique de chaque ligne.</p>
                    </Card>
                  ) : (
                    <Card className="h-fit border-blue-200 bg-blue-50">
                      <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Edit size={20}/> Mettre à jour</h3>
                      <form onSubmit={handleUpdateBalance} className="space-y-4">
                        <input type="number" step="0.01" className="w-full p-3 rounded-lg border border-blue-200" value={currentBalanceUpdate} onChange={(e) => setCurrentBalanceUpdate(e.target.value)} />
                        <Button type="submit" className="w-full">Valider</Button>
                      </form>
                    </Card>
                  )}
                  {!isComposite && (
                    <Card className="h-fit bg-slate-50/50 border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={20}/> Point passé</h3>
                      <form onSubmit={handleAddAssetHistory} className="space-y-4">
                        <input type="date" className="w-full p-2 rounded-lg border border-slate-300" value={newAssetHistoryPoint.date} onChange={(e) => setNewAssetHistoryPoint({...newAssetHistoryPoint, date: e.target.value})} />
                        <input type="number" step="0.01" className="w-full p-2 rounded-lg border border-slate-300" value={newAssetHistoryPoint.value} onChange={(e) => setNewAssetHistoryPoint({...newAssetHistoryPoint, value: e.target.value})} />
                        <Button type="submit" className="w-full" variant="secondary">Enregistrer</Button>
                      </form>
                    </Card>
                  )}
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Évolution du solde</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={assetChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                          <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card className="overflow-hidden border-slate-200 p-0">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 font-bold">Historique Global</div>
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                      {(!asset.history || asset.history.length === 0) ? <div className="p-4 text-center text-slate-400">Aucun historique.</div> : [...asset.history].sort((a,b) => new Date(b.date) - new Date(a.date)).map((point, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center group hover:bg-slate-50">
                          <span className="text-sm text-slate-600 flex items-center gap-2">
                            {new Date(point.date).toLocaleDateString()}
                            {new Date(point.date) > new Date() && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">Prév.</span>}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-900">{formatCurrency(point.value)}</span>
                            {!isComposite && <button onClick={() => setDeleteConfig({ type: 'assetHistory', id: idx })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* CONTENU ONGLET : ANALYSE */}
            {activeTab === 'analysis' && (
              <div className="flex flex-col h-full animate-in fade-in duration-300">
                <Button onClick={handleAnalyzeAsset} disabled={isAnalyzing} className="mx-auto mb-6 bg-indigo-600 text-white">
                  {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles className="mr-2" size={18} />} Lancer l'analyse
                </Button>
                {aiAnalysis && <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 overflow-y-auto max-h-[400px]"><MessageBubble message={{ role: 'assistant', content: aiAnalysis }} /></div>}
              </div>
            )}
          </div>
        </>
      )}

      {/* --- VUE DÉTAIL D'UNE POSITION --- */}
      {viewMode === 'position' && selectedPosition && (
        <>
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
            <div>
              <button onClick={() => setViewMode('asset')} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 mb-2 text-sm font-medium"><ChevronLeft size={16} /> Retour</button>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><TrendingDown size={24} className="text-purple-600"/>{selectedPosition.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Valeur Actuelle (Marché)</p>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(selectedPosition.value)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 bg-white border-b border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Versé</p>
              <p className="text-sm font-bold text-slate-700">{formatCurrency(selectedPosition.totalInvested || 0)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Performance</p>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${(selectedPosition.value - (selectedPosition.totalInvested || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(selectedPosition.value - (selectedPosition.totalInvested || 0))}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${(selectedPosition.value - (selectedPosition.totalInvested || 0)) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedPosition.totalInvested > 0 ? (((selectedPosition.value - selectedPosition.totalInvested) / selectedPosition.totalInvested) * 100).toFixed(2) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="h-fit bg-slate-50/50 border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={20} className="text-purple-600"/> Évolution</h3>
                <form onSubmit={handleAddPositionHistory} className="space-y-4">
                  <input type="date" className="w-full p-2 rounded-lg border border-slate-300" value={newPosHistoryPoint.date} onChange={(e) => setNewPosHistoryPoint({...newPosHistoryPoint, date: e.target.value})} />
                  <input type="number" className="w-full p-2 rounded-lg border border-slate-300" placeholder="0.00" value={newPosHistoryPoint.value} onChange={(e) => setNewPosHistoryPoint({...newPosHistoryPoint, value: e.target.value})} />
                  <Button type="submit" className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white">Enregistrer</Button>
                </form>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <Card className="border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4">Performance Historique</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={positionChartData}>
                        <defs>
                          <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4}/>
                            <stop offset="90%" stopColor="#9333ea" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                        <Area type="monotone" dataKey="value" stroke="#9333ea" fillOpacity={1} fill="url(#colorPos)" />
                        
                        {/* AJOUT : Lignes verticales pour les achats (vert) et ventes (rouge) */}
                        {(selectedPosition.history || [])
                          .filter(h => h.movementTag)
                          .map((h, idx) => (
                            <ReferenceLine 
                              key={idx} 
                              x={h.date} 
                              stroke={h.movementTag === 'buy' ? '#22c55e' : '#ef4444'} 
                              strokeWidth={2}
                              strokeDasharray="3 3"
                            />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="overflow-hidden border-slate-200 p-0">
                  <div className="bg-slate-50 p-4 border-b border-slate-100 font-bold">Historique de la ligne</div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                    {[...(selectedPosition.history || [])]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((point, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50 group">
                          <span className="text-sm text-slate-600 flex items-center gap-2">
                            {new Date(point.date).toLocaleDateString()}
                            
                            {/* AFFICHAGE DU TAG SI MOUVEMENT */}
                            {point.movementTag && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${point.movementTag === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {point.movementTag === 'buy' ? 'ACHAT' : 'VENTE'}
                              </span>
                            )}
                            
                            {!point.movementTag && new Date(point.date) > new Date() && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">Prév.</span>
                            )}
                          </span>
                          
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-900">{formatCurrency(point.value)}</span>
                            <button 
                              onClick={() => setDeleteConfig({ type: 'posHistory', id: idx })} 
                              className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);
};

const DashboardView = ({ assets, transactions, setActiveTab, onDeleteTransaction, userProfile }) => {
  const [timeRange, setTimeRange] = useState('6M');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chartMode, setChartMode] = useState('global'); // 'global' (Area) or 'detailed' (StackedBar)
  const [forecast, setForecast] = useState(null);
  const [isForecasting, setIsForecasting] = useState(false);
  const [txAnalysis, setTxAnalysis] = useState(null);
  const [isTxAnalyzing, setIsTxAnalyzing] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [focusedTxId, setFocusedTxId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(-1);
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);

  // Calcul des transactions filtrées
  const filteredTransactions = useMemo(() => {
    let result = [...(transactions || [])];
    if (filterMonth) {
      result = result.filter(t => t.date.startsWith(filterMonth));
    }
    if (filterCategory) {
      result = result.filter(t => t.category === filterCategory);
    }
    return result;
  }, [transactions, filterMonth, filterCategory]);

  // Mapping des icônes pour le patrimoine
  const ASSET_ICONS = {
    liquidite: PiggyBank,
    investissement: TrendingUp,
    epargne_salariale: Briefcase,
    immobilier: Home,
    crypto: Zap,
    autre: Circle
  };

  const renderAssetLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) => {
    if (percent < 0.05) return null; // On n'affiche pas l'icône si la part est trop petite
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const Icon = ASSET_ICONS[payload.type] || Circle;
    return (
      <g pointerEvents="none">
        <foreignObject x={x - 10} y={y - 10} width={20} height={20}>
          <div className="flex items-center justify-center w-full h-full text-white drop-shadow-md">
            <Icon size={14} strokeWidth={2.5} />
          </div>
        </foreignObject>
      </g>
    );
  };

  const evolutionData = useMemo(() => processHistoryData(timeRange, assets), [timeRange, assets]);
  const cashflowHistoryData = useMemo(() => processFlowData(timeRange, transactions), [timeRange, transactions]);

  const netWorth = assets ? assets.reduce((acc, item) => acc + item.value, 0) : 0;
   
  const liquidities = assets ? assets.filter(a => a.type === 'liquidite').reduce((acc, a) => acc + a.value, 0) : 0;
  const investments = assets ? assets.filter(a => ['investissement', 'crypto', 'immobilier', 'epargne_salariale'].includes(a.type)).reduce((acc, a) => acc + a.value, 0) : 0;

  const netWorthHistory = evolutionData.map(d => ({ date: d.month, value: d.totalNet }));
  const liquidityHistory = evolutionData.map(d => ({ date: d.month, value: d.liquidite }));
  const investmentHistory = evolutionData.map(d => ({ date: d.month, value: d.investissement + d.crypto + d.immobilier + d.epargne_salariale }));

  const allocationData = assets && assets.length > 0 ? Object.keys(COLORS).map(type => {
    const value = assets.filter(a => a.type === type).reduce((sum, a) => sum + a.value, 0);
    return { name: CATEGORY_LABELS[type], value, type };
  }).filter(d => d.value > 0) : [];

  const getGrowth = (data, keys) => {
    if (!data || data.length < 2) return "0.0";
    const current = keys.reduce((sum, k) => sum + (data[data.length - 1][k] || 0), 0);
    const previous = keys.reduce((sum, k) => sum + (data[data.length - 2][k] || 0), 0);
    if (previous === 0) return current === 0 ? "0.0" : "100.0";
    return ((current - previous) / Math.abs(previous) * 100).toFixed(1);
  };

  const netWorthGrowth = getGrowth(evolutionData, ['totalNet']);
  const investmentsGrowth = getGrowth(evolutionData, ['investissement', 'crypto', 'immobilier', 'epargne_salariale']);
  const liquiditiesGrowth = getGrowth(evolutionData, ['liquidite']);

  const handleAnalyzeDashboard = async () => {
    setIsAnalyzing(true);
    const context = `Analyse le patrimoine: ${netWorth}€. Evolution: ${netWorthGrowth}%.`;
    try {
      const result = await callGeminiAPI("Expert finance. Utilise ## pour les titres, - pour les listes, et <b> pour mettre en gras les mots importants. Interdiction d'utiliser les caractères * ou **.", context);
      setAiAnalysis(result);
    } catch (e) { setAiAnalysis("Erreur."); }
    setIsAnalyzing(false);
  };

  const handleForecast = async () => {
    setIsForecasting(true);
    try {
      const resultText = await callGeminiAPI("Expert prévision. Utilise ## pour les titres, - pour les listes, et <b> pour mettre en gras les mots importants. Interdiction d'utiliser les caractères * ou **.", `Flux: ${JSON.stringify(cashflowHistoryData.slice(-3))}. JSON: {revenus, depenses, solde, conseil}`);
      const jsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      setForecast(JSON.parse(jsonStr));
    } catch (e) { setForecast({ revenus: 0, depenses: 0, solde: 0, conseil: "Erreur." }); }
    setIsForecasting(false);
  };

  const handleTxAnalysis = async () => {
    setIsTxAnalyzing(true);
    try {
      const result = await callGeminiAPI("Analyste budget. Utilise ## pour les titres, - pour les listes, et <b> pour mettre en gras les mots importants. Interdiction d'utiliser les caractères * ou **.", `Transac: ${JSON.stringify(transactions.slice(0, 5))}`);
      setTxAnalysis(result);
    } catch (e) { setTxAnalysis("Erreur."); }
    setIsTxAnalyzing(false);
  };

  const formatWealth = (value) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + ' M€';
    } else if (value >= 10000) {
       return (value / 1000).toFixed(0) + ' k€';
    }
    return formatCurrency(value);
  };

  const hasFlowData = useMemo(() => cashflowHistoryData.some(d => d.revenus > 0 || d.depenses > 0), [cashflowHistoryData]);

  // --- ÉTAPE A : Chargement initial ---
  // Si assets est strictement null, on affiche le loader pour éviter le clignotement
  if (assets === null || transactions === null) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  // --- ÉTAPE B : Compte réellement vide ---
  // Si assets est un tableau vide [], c'est que Firebase a répondu "rien trouvé"
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-in fade-in">
        <div className="p-6 bg-white rounded-full shadow-lg text-blue-600 mb-2"><TrendingUp size={48} /></div>
        <h2 className="text-2xl font-bold text-slate-800">Bienvenue {userProfile?.firstName || ''} sur votre Tableau de Bord</h2>
        <Button onClick={() => setActiveTab('assets')} className="shadow-lg hover:scale-105 transition-transform">Commencer maintenant <ArrowRight size={18} /></Button>
      </div>
    );
  }

  // Configuration du graphique "Global"
  const renderGlobalChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={evolutionData}>
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5}/>
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10}/>
        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
        <RechartsTooltip 
          cursor={{stroke: '#cbd5e1', strokeWidth: 1}} 
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)', // Fond transparent
            backdropFilter: 'blur(4px)',               // Effet de flou
            padding: '8px 12px',
            fontSize: '12px'
          }} 
          offset={25}                                  // Décale la bulle du doigt
          allowEscapeViewBox={{ x: false, y: true }}
          wrapperStyle={{ pointerEvents: 'none' }}
          formatter={(value) => [formatCurrency(value), 'Patrimoine Net']}
        />
        <Area type="monotone" dataKey="totalNet" stroke="#2563eb" strokeWidth={3} fill="url(#gradTotal)" />
      </AreaChart>
    </ResponsiveContainer>
  );

  // Configuration du graphique "Détail"
  const renderDetailedChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={evolutionData} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10}/>
        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
        <RechartsTooltip 
          cursor={{fill: '#f8fafc'}} 
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(4px)',
            padding: '8px 12px',
            fontSize: '11px' // Un peu plus petit car il y a beaucoup de lignes
          }}
          offset={25}
          allowEscapeViewBox={{ x: false, y: true }}
          wrapperStyle={{ pointerEvents: 'none' }}
          formatter={(value, name) => [formatCurrency(value), CATEGORY_LABELS[name] || name]}
          itemSorter={(item) => -item.value}
        />
        <Bar dataKey="liquidite" name={CATEGORY_LABELS.liquidite} stackId="a" fill={COLORS.liquidite} radius={[0, 0, 4, 4]} />
        <Bar dataKey="investissement" name={CATEGORY_LABELS.investissement} stackId="a" fill={COLORS.investissement} />
        <Bar dataKey="epargne_salariale" name={CATEGORY_LABELS.epargne_salariale} stackId="a" fill={COLORS.epargne_salariale} />
        <Bar dataKey="immobilier" name={CATEGORY_LABELS.immobilier} stackId="a" fill={COLORS.immobilier} />
        <Bar dataKey="crypto" name={CATEGORY_LABELS.crypto} stackId="a" fill={COLORS.crypto} />
        <Bar dataKey="autre" name={CATEGORY_LABELS.autre} stackId="a" fill={COLORS.autre} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
   
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900 bg-slate-100 min-h-screen p-4 pb-24 md:pb-8">
      <ConfirmationModal isOpen={!!transactionToDelete} onClose={() => setTransactionToDelete(null)} onConfirm={() => { onDeleteTransaction(transactionToDelete); setTransactionToDelete(null); }} message="Supprimer cette opération ?" />
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div>
            {userProfile?.firstName && <h1 className="text-2xl font-bold text-slate-800">Bonjour, {userProfile.firstName} 👋</h1>}
        </div>
        <div className="flex gap-2"><Button variant="magic" onClick={handleAnalyzeDashboard} disabled={isAnalyzing} className="text-xs px-3 py-1.5">{isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{isAnalyzing ? "..." : "Analyser"}</Button><div className="bg-white p-1 rounded-lg border border-slate-300 shadow-sm flex">{['6M', '1Y', '5Y', 'ALL'].map(range => (<button key={range} onClick={() => setTimeRange(range)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>{range === 'ALL' ? 'Tout' : range}</button>))}</div></div>
      </div>
      {aiAnalysis && <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 relative mb-4"><button onClick={() => setAiAnalysis(null)} className="absolute top-2 right-2 text-indigo-400"><X size={16} /></button><div className="flex gap-3"><div className="bg-white p-2 rounded-full h-fit text-indigo-600"><Bot size={20} /></div><div className="text-sm text-indigo-900 whitespace-pre-line">{aiAnalysis}</div></div></div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SparklineCard title="Patrimoine Net" value={`${formatCurrency(netWorth)}`} data={netWorthHistory} dataKey="value" color="#3b82f6" icon={Wallet} percentage={netWorthGrowth} />
        <SparklineCard title="Actifs Financiers" value={`${formatCurrency(investments)}`} data={investmentHistory} dataKey="value" color="#10b981" icon={TrendingUp} percentage={investmentsGrowth} />
        <SparklineCard title="Liquidités" value={`${formatCurrency(liquidities)}`} data={liquidityHistory} dataKey="value" color="#f59e0b" icon={PiggyBank} percentage={liquiditiesGrowth} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2 flex flex-col border-slate-300 min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600 shrink-0"/> 
              <span className="leading-tight">Évolution du Patrimoine</span>
            </h3>
            
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 w-full sm:w-auto justify-center">
                <button 
                  onClick={() => setChartMode('global')} 
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${chartMode === 'global' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LineChartIcon size={14} /> Global
                </button>
                <button 
                  onClick={() => setChartMode('detailed')} 
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${chartMode === 'detailed' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <BarChart2 size={14} /> Détail
                </button>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
             {chartMode === 'global' ? renderGlobalChart() : renderDetailedChart()}
          </div>
        </Card>
        
        <Card className="border-slate-300 flex flex-col relative min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 absolute top-6 left-6 z-10">
            <PieIcon size={20} className="text-blue-600"/> Répartition
          </h3>
          
          <div className="flex-1 w-full relative mt-12 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie 
                        data={allocationData} 
                        innerRadius={70} 
                        outerRadius={105}
                        paddingAngle={4} 
                        dataKey="value"
                        label={renderAssetLabel}
                        labelLine={false}
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                        animationDuration={800}
                        tabIndex={-1}
                        style={{ outline: 'none' }}
                      >
                          {allocationData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[entry.type] || '#cbd5e1'} 
                              stroke="none"
                              opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.4}
                              style={{ transition: 'opacity 0.2s ease', outline: 'none' }}
                            />
                          ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', fontSize: '12px', padding: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        offset={20}
                        wrapperStyle={{ pointerEvents: 'none' }}
                        formatter={(value) => [formatCurrency(value), 'Valeur']}
                        allowEscapeViewBox={{ x: false, y: true }} 
                      />
                  </PieChart>
              </ResponsiveContainer>

              {/* Texte Central Dynamique */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0" style={{top: '0'}}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {activeIndex !== -1 ? `${((allocationData[activeIndex].value / netWorth) * 100).toFixed(1)}%` : "Total"}
                  </span>
                  <span className="text-2xl font-extrabold transition-colors duration-200" style={{ color: activeIndex !== -1 ? COLORS[allocationData[activeIndex].type] : '#1e293b' }}>
                    {formatWealth(activeIndex !== -1 ? allocationData[activeIndex].value : netWorth)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 mt-1 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
                    {activeIndex !== -1 ? allocationData[activeIndex].name : "Patrimoine"}
                  </span>
              </div>
          </div>

          {/* Légende Interactive */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 px-2 overflow-y-auto max-h-24 no-scrollbar pb-2">
              {allocationData.map((entry, index) => (
                  <div 
                    key={entry.type} 
                    onClick={() => {
                        // Logique de dé-sélection pour le patrimoine
                        const newIndex = activeIndex === index ? -1 : index;
                        setActiveIndex(newIndex);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all cursor-pointer ${activeIndex === index ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100 scale-105' : 'bg-white border-slate-100'}`}
                  >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[entry.type] }} />
                      <span className="text-[10px] font-bold text-slate-700">{entry.name}</span>
                  </div>
              ))}
          </div>
      </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="relative border-slate-300">
          <div className="mb-6">
            {/* En-tête : Empilé sur mobile, aligné sur desktop */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft size={20} className="text-purple-600 shrink-0"/> 
                <span className="leading-tight">Revenus & Dépenses</span>
              </h3>
              
              <Button 
                variant="magic" 
                onClick={handleForecast} 
                disabled={isForecasting} 
                className="text-xs px-4 py-2 h-9 w-full sm:w-auto shadow-sm"
              >
                {isForecasting ? <Loader2 size={14} className="animate-spin" /> : <Calculator size={14} />}
                <span>Prévision</span>
              </Button>
            </div>
            
            {/* Encadré d'information plus aéré */}
            <div className="flex items-start gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
              <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 shrink-0 mt-0.5">
                <Info size={9} />
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cliquez sur les barres de <strong className="text-slate-900">dépenses</strong> pour voir le détail par catégorie.
              </p>
            </div>
          </div>
            {forecast && <div className="absolute top-16 left-6 right-6 z-20 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-indigo-100 shadow-lg"><div className="flex justify-between"><h4 className="font-bold text-indigo-900">Prévision IA</h4><button onClick={() => setForecast(null)}><X size={16}/></button></div><div className="grid grid-cols-3 gap-4 mb-3 text-center"><div className="p-2 bg-green-50 rounded-lg"><p className="text-xs text-green-700">Revenus</p><p className="font-bold">{formatCurrency(forecast.revenus)}</p></div><div className="p-2 bg-red-50 rounded-lg"><p className="text-xs text-red-700">Dépenses</p><p className="font-bold">{formatCurrency(forecast.depenses)}</p></div></div><p className="text-xs text-slate-600 italic">{forecast.conseil}</p></div>}
            
            <InteractiveBudgetChart 
              cashflowData={cashflowHistoryData} 
              transactions={transactions} 
              hasFlowData={hasFlowData}
              onMonthSelect={setFilterMonth}      // Connexion au filtre de mois
              onCategorySelect={setFilterCategory} // Connexion au filtre de catégorie
          />
        </Card>
        <Card className="flex flex-col relative border-slate-300 h-[560px]"> {/* Hauteur fixe pour éviter l'étirement */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 shrink-0">
            <div className="flex items-center gap-2">
              <List size={20} className="text-blue-600 shrink-0"/> 
              <span className="leading-tight text-lg font-bold text-slate-800">Dernières Opérations</span>
              {(filterMonth || filterCategory) && (
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100 animate-in fade-in">
                  Filtré
                </span>
              )}
            </div>
            <Button variant="magic" onClick={handleTxAnalysis} disabled={isTxAnalyzing} className="text-xs px-4 py-2 h-9 w-full sm:w-auto">
              {isTxAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Analyser
            </Button>
          </div>

          {/* Zone de liste défilante */}
          <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
            <div className="space-y-2">
              {(!filteredTransactions || filteredTransactions.length === 0) ? (
                <div className="p-10 text-center text-slate-400 italic text-sm">Aucune opération trouvée</div>
              ) : (
                filteredTransactions.map(t => (
                  <div 
                    key={t.id} 
                    className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200 group cursor-pointer"
                    onClick={() => setFocusedTxId(focusedTxId === t.id ? null : t.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 text-sm truncate">{t.label}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                          {/* Ajout du tag Prév. pour les transactions futures */}
                          {new Date(t.date) > new Date() && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">Prév.</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-slate-800'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                      {t.category && <p className="text-[9px] text-slate-400 uppercase font-bold">{t.category}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ... AssetsView, BudgetView, AiAdvisorView remain largely the same, skipped for brevity but would be here ...

const AssetsView = ({ assets, setAssets }) => {
  // Ajoutez ceci au tout début :
  if (assets === null) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;
  }
  const [newAsset, setNewAsset] = useState({ name: '', institution: '', value: '', type: 'liquidite' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [focusedAssetId, setFocusedAssetId] = useState(null);

  const isCompositeType = (type) => ['investissement', 'crypto', 'immobilier', 'autre', 'epargne_salariale'].includes(type);

  const handleAdd = (e) => {
    e.preventDefault();
    // On vérifie que le nom est bien saisi
    if (!newAsset.name) return;

    const isComposite = isCompositeType(newAsset.type);
    const today = new Date().toISOString().split('T')[0];
    
    // Si c'est un compte Bourse/Investissement, on crée la poche Cash (Espèces)
    // Elle aura 'isCash: true' pour être identifiée par nos nouveaux KPI et filtres
    const initialPositions = isComposite ? [
      { 
        id: 'cash_pouch', 
        name: '💰 Espèces', 
        value: 0, 
        isCash: true, 
        history: [{ date: today, value: 0 }] 
      }
    ] : [];

    // La valeur initiale globale est 0 pour un PEA (car elle dépend des positions/cash)
    // Pour un Livret, on prend la valeur saisie dans le formulaire
    const initialValue = isComposite ? 0 : (parseFloat(newAsset.value) || 0);

    const newAssetObj = { 
      ...newAsset, 
      id: Date.now(), 
      value: initialValue, 
      positions: initialPositions,
      history: [{ date: today, value: initialValue }] 
    };

    // Mise à jour de l'état local et sauvegarde en base de données
    const updatedAssets = [...(assets || []), newAssetObj];
    setAssets(updatedAssets);
    
    // Réinitialisation du formulaire
    setNewAsset({ name: '', institution: '', value: '', type: 'liquidite' });
    setIsFormOpen(false);
  };

  const handleDelete = (id) => setAssets(assets.filter(a => a.id !== id));
  const handleUpdateAsset = (updatedAsset) => {
    // Si c'est un investissement, on s'assure qu'il y a une poche espèces
    if (['investissement', 'epargne_salariale', 'crypto'].includes(updatedAsset.type)) {
      const hasCash = updatedAsset.positions?.some(p => p.isCash);
      if (!hasCash) {
        updatedAsset.positions = [
          { id: 'cash_pouch', name: '💰 Espèces non investies', value: 0, isCash: true, history: [] },
          ...(updatedAsset.positions || [])
        ];
      }
    }
    setAssets(assets.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    setSelectedAsset(updatedAsset);
  };
  const groupedAssets = useMemo(() => { const groups = {}; assets.forEach(asset => { if (!groups[asset.type]) groups[asset.type] = []; groups[asset.type].push(asset); }); return groups; }, [assets]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 text-slate-900 pb-24 md:pb-8">
      <ConfirmationModal isOpen={!!assetToDelete} onClose={() => setAssetToDelete(null)} onConfirm={() => { handleDelete(assetToDelete); setAssetToDelete(null); }} message="Supprimer ce compte ?" />
      {selectedAsset && (<AssetDetailOverlay key={selectedAsset.id} asset={selectedAsset} onClose={() => setSelectedAsset(null)} onUpdate={handleUpdateAsset} />)}
      {(!assets || assets.length === 0) ? (<EmptyState title="Aucun actif" description="Ajoutez votre premier compte." actionLabel="Ajouter" onAction={() => setIsFormOpen(true)} icon={Wallet} />) : (<div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Mes Actifs</h2><Button onClick={() => setIsFormOpen(!isFormOpen)} variant="primary"><PlusCircle size={20} /> Ajouter</Button></div>)}
      {isFormOpen && (
        <Card className="bg-blue-50 border-blue-100">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"><div className="lg:col-span-1"><label className="block text-xs font-semibold text-slate-600 mb-1">Type</label><select className="w-full p-2 rounded-lg border border-slate-300" value={newAsset.type} onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}>{Object.keys(CATEGORY_LABELS).map(key => (<option key={key} value={key}>{CATEGORY_LABELS[key]}</option>))}</select></div><div className="lg:col-span-1"><label className="block text-xs font-semibold text-slate-600 mb-1">Nom</label><input type="text" className="w-full p-2 rounded-lg border border-slate-300" value={newAsset.name} onChange={(e) => setNewAsset({...newAsset, name: e.target.value})} /></div><div className="lg:col-span-1"><label className="block text-xs font-semibold text-slate-600 mb-1">Banque</label><input type="text" className="w-full p-2 rounded-lg border border-slate-300" value={newAsset.institution} onChange={(e) => setNewAsset({...newAsset, institution: e.target.value})} /></div>{isCompositeType(newAsset.type) ? <div className="lg:col-span-1 pb-2 text-center text-xs text-slate-500 italic">Valeur auto</div> : <div className="lg:col-span-1"><label className="block text-xs font-semibold text-slate-600 mb-1">Valeur</label><input type="number" className="w-full p-2 rounded-lg border border-slate-300" value={newAsset.value} onChange={(e) => setNewAsset({...newAsset, value: e.target.value})} /></div>}<Button type="submit" className="w-full">Ajouter</Button></form>
        </Card>
      )}
      <div className="grid gap-6">{Object.keys(groupedAssets).map(type => (<Card key={type} className="overflow-hidden border-slate-200 p-0 md:p-0"><div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-700 flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[type] }}></span>{CATEGORY_LABELS[type]}</h3><span className="font-bold text-slate-900">{formatCurrency(groupedAssets[type].reduce((sum, a) => sum + a.value, 0))}</span></div><div className="divide-y divide-slate-100">{groupedAssets[type].map(asset => (
        <div 
          key={asset.id} 
          className="p-4 flex justify-between items-center hover:bg-slate-50 transition group border-b border-slate-50 last:border-0 cursor-pointer"
          onClick={() => setFocusedAssetId(focusedAssetId === asset.id ? null : asset.id)}
        >
          <div className="flex items-center gap-4 overflow-hidden min-w-0"><div className="bg-slate-100 p-2 rounded-lg text-slate-500 flex-shrink-0"><Building size={20} /></div><div className="min-w-0 truncate"><p className="font-semibold text-slate-800 truncate">{asset.name}</p><p className="text-sm text-slate-500 truncate">{asset.institution}</p></div></div><div className="flex items-center gap-4 flex-shrink-0"><span className="font-bold text-slate-700">{formatCurrency(asset.value)}</span>
          {/* Modif ici: utilisation de focusedAssetId pour mobile et group-hover pour desktop */}
          <div className={`${focusedAssetId === asset.id ? 'flex' : 'hidden md:group-hover:flex'} gap-1 transition-all`}>
            <button onClick={() => setSelectedAsset(asset)} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"><Eye size={18} /></button><button onClick={() => setAssetToDelete(asset.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={18} /></button>
          </div></div>
        </div>
      ))}</div></Card>))}</div>
    </div>
  );
};

const BudgetView = ({ transactions, assets, onAddTransaction, onDeleteTransaction, onUpdateTransaction }) => {
  if (transactions === null || assets === null) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  // À ajouter au début de BudgetView
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);

  const filteredTransactions = useMemo(() => {
    let result = [...(transactions || [])];
    if (filterMonth) result = result.filter(t => t.date.startsWith(filterMonth));
    if (filterCategory) result = result.filter(t => t.category === filterCategory);
    return result;
  }, [transactions, filterMonth, filterCategory]);

  const [newTrans, setNewTrans] = useState({ date: new Date().toISOString().split('T')[0], label: '', amount: '', type: 'expense', category: 'Autre' });
  const [selectedAccount, setSelectedAccount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [editId, setEditId] = useState(null);
  const [timeRange, setTimeRange] = useState('6M');
  const [focusedTxId, setFocusedTxId] = useState(null);

  const cashflowHistoryData = useMemo(() => processFlowData(timeRange, transactions), [timeRange, transactions]);
  
  const selectableAccounts = useMemo(() => 
    assets ? assets.filter(a => ['liquidite', 'investissement', 'epargne_salariale', 'crypto'].includes(a.type)) : [], 
    [assets]
  );
  const hasFlowData = useMemo(() => cashflowHistoryData.some(d => d.revenus > 0 || d.depenses > 0), [cashflowHistoryData]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTrans.label || !newTrans.amount) return;
    
    const finalDate = newTrans.date ? newTrans.date : new Date().toISOString().split('T')[0];

    const transaction = { 
      ...newTrans, 
      date: finalDate, 
      id: editId || Date.now(), 
      amount: parseFloat(newTrans.amount) 
    };

    if (newTrans.type === 'transfer') {
      transaction.fromId = selectedAccount;
      transaction.toId = transferTo;
      if (!transaction.fromId || !transaction.toId || transaction.fromId === transaction.toId) return;
    } else {
      transaction.linkedAssetId = selectedAccount;
    }

    if (editId) {
        onUpdateTransaction(transaction);
        setEditId(null);
    } else {
        onAddTransaction(transaction, selectedAccount);
    }
    
    setNewTrans({ date: new Date().toISOString().split('T')[0], label: '', amount: '', type: 'expense', category: 'Autre' });
    setSelectedAccount('');
    setTransferTo('');
  };

  const startEdit = (t) => {
      setEditId(t.id);
      setNewTrans({ date: t.date, label: t.label, amount: t.amount, type: t.type, category: t.category });
      if (t.type === 'transfer') {
          setSelectedAccount(t.fromId || '');
          setTransferTo(t.toId || '');
      } else {
          setSelectedAccount(t.linkedAssetId || '');
          setTransferTo('');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditId(null);
      setNewTrans({ date: new Date().toISOString().split('T')[0], label: '', amount: '', type: 'expense', category: 'Autre' });
      setSelectedAccount('');
      setTransferTo('');
  };

  const handleAiParse = async () => {
    if (!aiInput) return;
    setIsAiProcessing(true);
    const accountNames = selectableAccounts.map(a => a.name).join(', ');
    const userPrompt = `CONTEXTE :
    - Comptes disponibles : ${accountNames}.
    - Catégories autorisées : ${Object.keys(EXPENSE_CATEGORIES).join(', ')}.
    - Date d'aujourd'hui : ${new Date().toLocaleDateString('fr-FR')}.
    - Analyse l'entrée utilisateur suivante : "${aiInput}"

    GUIDE DE CLASSIFICATION (Utilise ces exemples pour choisir la catégorie) :
    - Alimentation : Supermarchés (Lidl, Leclerc), restaurants, boulangerie, UberEats.
    - Logement : Loyer, charges, électricité, bricolage (Leroy Merlin, Castorama).
    - Transport : Essence, parking, péage, train (SNCF), Uber, bus.
    - Loisirs : Cinéma, abonnement jeux vidéo, sorties, Netflix, Spotify.
    - Santé : Pharmacie, médecin, dentiste, mutuelle.
    - Shopping : Vêtements, Amazon, High-tech, décoration.
    - Services : Facture téléphone, internet, assurance, banque.
    - Autre : Si rien ne correspond.

    INSTRUCTIONS DE SORTIE (JSON UNIQUEMENT) :
    - Extrais le "label" (le nom du marchand ou la description de l'achat).
    - Extrais la date au format YYYY-MM-DD (interprète "hier", "lundi dernier", etc.).
    - Extrais le montant (nombre pur).
    - Détermine le type : 'expense' (dépense, achat), 'income' (revenu, remboursement, salaire) ou 'transfer' (virement).
    - Pour la catégorie, sois précis en te basant sur le marchand.
    - Si type='transfer', extrais 'accountFrom' et 'accountTo' depuis la liste des comptes.
    - Si type='expense' ou 'income', extrais 'accountName' (le compte impacté).

    Réponds uniquement avec le JSON sans texte avant ou après.
  `;
    try {
      const resultText = await callGeminiAPI("Extraction transaction JSON.", userPrompt);
      const data = JSON.parse(resultText.replace(/```json/g, '').replace(/```/g, '').trim());
      setNewTrans({ 
        date: data.date || new Date().toISOString().split('T')[0], 
        label: data.label || '', 
        amount: data.amount || '', 
        type: data.type || 'expense', 
        category: data.category || 'Autre' 
      });
      
      if (data.type === 'transfer') {
        if (data.accountFrom) {
          const foundFrom = selectableAccounts.find(a => a.name.toLowerCase() === data.accountFrom.toLowerCase());
          if (foundFrom) setSelectedAccount(foundFrom.id);
        }
        if (data.accountTo) {
          const foundTo = selectableAccounts.find(a => a.name.toLowerCase() === data.accountTo.toLowerCase());
          if (foundTo) setTransferTo(foundTo.id);
        }
      } else {
        if (data.accountName) {
          const found = selectableAccounts.find(a => a.name.toLowerCase() === data.accountName.toLowerCase());
          if (found) setSelectedAccount(found.id);
        }
      }
      setAiInput('');
    } catch (e) { alert("Erreur IA: " + e.message); } finally { setIsAiProcessing(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-right duration-300 text-slate-900 pb-24 md:pb-8">
      <div className="lg:col-span-1 space-y-6">
        <Card className="bg-slate-50/50 border-indigo-200"><h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Sparkles size={18} className="text-indigo-600" /> Saisie Rapide IA</h3><p className="text-xs text-indigo-700 mb-3">Ex: "Virement de 100€ du Livret A vers Compte Courant hier" ou "McDo 15€"</p><div className="flex gap-2"><input type="text" className="flex-1 p-2 text-sm rounded-lg border border-indigo-200" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiParse()} /><button onClick={handleAiParse} disabled={isAiProcessing || !aiInput} className="bg-indigo-600 text-white p-2 rounded-lg">{isAiProcessing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}</button></div></Card>
        <Card className="sticky top-6 bg-slate-50/50 border-slate-200"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">{editId ? <Edit size={20} className="text-blue-600"/> : <PlusCircle size={20} />} {editId ? "Modifier l'opération" : "Nouvelle Opération"}</h3><form onSubmit={handleAdd} className="space-y-4"><div><label className="block text-xs font-semibold text-slate-600 mb-1">Type</label><div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => setNewTrans({...newTrans, type: 'expense'})} className={`py-2 rounded-lg text-xs font-medium ${newTrans.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-white border border-slate-200'}`}>Dépense</button><button type="button" onClick={() => setNewTrans({...newTrans, type: 'income'})} className={`py-2 rounded-lg text-xs font-medium ${newTrans.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-white border border-slate-200'}`}>Revenu</button><button type="button" onClick={() => setNewTrans({...newTrans, type: 'transfer'})} className={`py-2 rounded-lg text-xs font-medium ${newTrans.type === 'transfer' ? 'bg-blue-100 text-blue-700' : 'bg-white border border-slate-200'}`}>Virement</button></div></div>
        
        <div><label className="block text-xs font-semibold text-slate-600 mb-1">{newTrans.type === 'transfer' ? "Compte Débité (Source)" : "Compte (Optionnel)"}</label><select className="w-full p-2 rounded-lg border border-slate-300" value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}><option value="">-- Aucun --</option>{selectableAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        
        {newTrans.type === 'transfer' && (
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">Compte Crédité (Destination)</label><select className="w-full p-2 rounded-lg border border-slate-300" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}><option value="">-- Aucun --</option>{selectableAccounts.filter(a => a.id != selectedAccount).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        )}
        
        <div><label className="block text-xs font-semibold text-slate-600 mb-1">Montant</label><input type="number" className="w-full p-2 rounded-lg border border-slate-300" value={newTrans.amount} onChange={(e) => setNewTrans({...newTrans, amount: e.target.value})} /></div><div><label className="block text-xs font-semibold text-slate-600 mb-1">Libellé</label><input type="text" className="w-full p-2 rounded-lg border border-slate-300" value={newTrans.label} onChange={(e) => setNewTrans({...newTrans, label: e.target.value})} /></div>
        
        {/* CATEGORY SELECTOR FOR EXPENSES */}
        {newTrans.type === 'expense' && (
            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catégorie</label>
                <select 
                    className="w-full p-2 rounded-lg border border-slate-300" 
                    value={newTrans.category || 'Autre'} 
                    onChange={(e) => setNewTrans({...newTrans, category: e.target.value})}
                >
                    {Object.keys(EXPENSE_CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
        )}
        
        <div><label className="block text-xs font-semibold text-slate-600 mb-1">Date</label><input type="date" className="w-full p-2 rounded-lg border border-slate-300" value={newTrans.date} onChange={(e) => setNewTrans({...newTrans, date: e.target.value})} /></div>
        <div className="flex gap-2">
            {editId && <Button type="button" variant="secondary" className="flex-1" onClick={cancelEdit}>Annuler</Button>}
            <Button className="flex-1" type="submit">{editId ? "Modifier" : "Enregistrer"}</Button>
        </div>
        </form></Card>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <ConfirmationModal isOpen={!!transactionToDelete} onClose={() => setTransactionToDelete(null)} onConfirm={() => { onDeleteTransaction(transactionToDelete); setTransactionToDelete(null); }} message="Supprimer cette opération ?" />
        
        <Card className="relative border-slate-200">
          <div className="mb-6">
            {/* En-tête : Empilé sur mobile, aligné sur desktop */}
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ArrowRightLeft size={20} className="text-purple-600"/> Revenus & Dépenses</h3>
            <div className="flex items-start gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
              <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 shrink-0 mt-0.5">
                <Info size={9} />
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cliquez sur les barres de <strong className="text-slate-900">dépenses</strong> pour voir le détail par catégorie.
              </p>
            </div>
          </div>
             <InteractiveBudgetChart 
                cashflowData={cashflowHistoryData} 
                transactions={transactions} 
                hasFlowData={hasFlowData}
                onMonthSelect={setFilterMonth}      // Connexion au filtre de mois
                onCategorySelect={setFilterCategory} // Connexion au filtre de catégorie
            />
        </Card>

        <Card className="flex flex-col relative border-slate-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <List size={20} className="text-blue-600 shrink-0"/> 
            <span className="leading-tight text-lg font-bold text-slate-800">Dernières Opérations</span>
            
            {/* Badge de filtre dynamique */}
            {(filterMonth || filterCategory) && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100 animate-in fade-in">
                Filtré
              </span>
            )}
          </div>
          
          
        </div>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 italic">
                Aucune transaction pour les filtres sélectionnés.
              </div>
            ) : (
              filteredTransactions.map(t => (
                <div 
                  key={t.id} 
                  className={`p-4 flex items-center justify-between hover:bg-white transition group border-b border-slate-50 last:border-0 group cursor-pointer ${editId === t.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                  onClick={() => setFocusedTxId(focusedTxId === t.id ? null : t.id)}
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <div className={`p-2 rounded-full flex-shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600' : t.type === 'transfer' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                      {t.type === 'income' ? <ArrowUpRight size={16} /> : t.type === 'transfer' ? <ArrowRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="font-medium text-slate-800 truncate">{t.label}</p>
                      <div className="flex gap-2 items-center">
                        <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                        {/* Ajout du tag Prév. */}
                        {new Date(t.date) > new Date() && (
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">Prév.</span>
                        )}
                        {t.type === 'expense' && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{t.category || 'Autre'}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : t.type === 'transfer' ? 'text-blue-600' : 'text-slate-800'}`}>
                      {t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <div className={`${focusedTxId === t.id ? 'flex' : 'hidden md:group-hover:flex'} gap-1 transition-all`}>
                      <button onClick={(e) => { e.stopPropagation(); startEdit(t); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setTransactionToDelete(t.id); }} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const AiAdvisorView = ({ assets, transactions, userProfile }) => {
  if (assets === null || transactions === null) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;
  
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Bonjour ! Je suis votre conseiller financier intelligent. Comment puis-je vous aider aujourd'hui ?" }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async (customPrompt = null, label = null) => {
    const userMessage = customPrompt || input;
    if (!userMessage.trim()) return;

    // Si c'est un bouton, on affiche un label plus joli dans le chat
    const displayMessage = label || userMessage;
    const newMessages = [...messages, { role: 'user', content: displayMessage }];
    
    setMessages(newMessages); 
    setInput(''); 
    setIsLoading(true);

    // On injecte le profil de risque et les objectifs dans le contexte
    const risk = userProfile?.riskProfile || 'balanced';
    const goal = userProfile?.financialGoal || 'growth';

    const systemPrompt = `
      Tu es un conseiller financier expert. 
      Profil utilisateur : Risque ${risk}, Objectif : ${goal}.
      Patrimoine : ${JSON.stringify(assets)}. 
      Dernières transactions : ${JSON.stringify(transactions.slice(0, 10))}.
      
      CONSIGNE : Réponds de manière concise (max 15 lignes). 
      INTERDICTION : N'utilise JAMAIS de Markdown (*, **, #).
      FORMAT : Utilise des retours à la ligne simples et des listes avec des tirets (-).
    `;

    try {
        const aiResponse = await callGeminiAPI(systemPrompt, userMessage);
        setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
    } catch (e) { 
        setMessages([...newMessages, { role: 'assistant', content: "Désolé, je rencontre une difficulté technique. Réessayez dans une minute." }]); 
    }
    setIsLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] animate-in fade-in pb-20 md:pb-0">
      {/* Sidebar - Actions Rapides */}
      <div className="lg:col-span-1 space-y-4 overflow-y-auto no-scrollbar">
        <Card className="bg-indigo-50 border-indigo-100 p-4">
          <div className="flex items-center gap-2 mb-4 text-indigo-800 font-bold">
            <Sparkles size={18} />
            <span>Analyses Flash</span>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => handleSend("Fais un bilan de santé global de mon patrimoine.", "📊 Bilan de santé global")} 
                    className="w-full text-left p-3 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 flex items-center gap-2">
              <Activity size={14} /> Bilan de santé
            </button>

            <button onClick={() => handleSend("Analyse mes dépenses récentes et identifie des économies possibles.", "💸 Analyse des dépenses")} 
                    className="w-full text-left p-3 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 flex items-center gap-2">
              <ArrowDownRight size={14} /> Analyse dépenses
            </button>

            <button onClick={() => handleSend("Calcule si mon épargne de précaution (liquidités) couvre au moins 4 mois de mes dépenses moyennes.", "🛡️ Sécurité & Précaution")} 
                    className="w-full text-left p-3 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 flex items-center gap-2">
              <ShieldCheck size={14} /> Épargne de précaution
            </button>

            <button onClick={() => handleSend("En fonction de mon profil de risque, suggère une meilleure répartition de mon patrimoine.", "📈 Optimiser l'allocation")} 
                    className="w-full text-left p-3 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 flex items-center gap-2">
              <Scale size={14} /> Arbitrage & Risque
            </button>

            <button onClick={() => handleSend("Estime ma capacité d'apport pour un projet immobilier sans vider mes comptes d'investissement.", "🏠 Projet Immobilier")} 
                    className="w-full text-left p-3 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 flex items-center gap-2">
              <Home size={14} /> Capacité Immobilière
            </button>
          </div>
        </Card>

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
           <p className="text-[10px] text-blue-700 font-bold uppercase mb-1">Status API</p>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-blue-900 font-medium">Assistant prêt à l'emploi</span>
           </div>
        </div>
      </div>

      {/* Zone de Chat */}
      <div className="lg:col-span-3 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><Bot size={20} className="text-indigo-600"/> Conseiller MyWealth</h3>
          <span className="text-[10px] bg-slate-200 px-2 py-1 rounded-full text-slate-600 font-bold">MODE EXPERT</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30" ref={scrollRef}>
          {messages.map((msg, idx) => (<MessageBubble key={idx} message={msg} />))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" />
                <span className="text-sm text-slate-500 italic">Analyse en cours...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Posez une question sur vos finances..."
              className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              disabled={isLoading} 
            />
            <Button variant="magic" disabled={isLoading || !input.trim()} type="submit">
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- AUTHENTICATION COMPONENTS ---

const LoginScreen = ({ onLogin, onEmailLogin, onEmailRegister, onGoogleLogin, onForgotPassword }) => {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Nouveaux champs pour inscription
  const [birthDate, setBirthDate] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [financialGoal, setFinancialGoal] = useState('freedom');
  const [riskProfile, setRiskProfile] = useState('balanced');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const handleGoogleClick = async () => {
    setError('');
    setSuccess('');
    try {
      await onGoogleLogin();
    } catch (e) {
      console.error("Erreur Google Auth:", e);
      let msg = e.message;
      if (msg.includes('auth/popup-closed-by-user')) {
        msg = "La fenêtre de connexion a été fermée.";
      } else if (msg.includes('auth/unauthorized-domain')) {
        msg = "DOMAINE NON AUTORISÉ : Ajoutez ce domaine dans la Console Firebase > Authentication > Settings > Authorized domains.";
      } else if (msg.includes('auth/popup-blocked')) {
        msg = "Pop-up bloquée par le navigateur. Veuillez l'autoriser.";
      } else if (msg.includes('auth/cancelled-popup-request')) {
        msg = "Trop de pop-ups. Réessayez.";
      }
      setError(msg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');
    setSuccess('');
    
    try {
      if (view === 'register') {
        if (!firstName || !lastName) {
          setError("Nom et Prénom requis");
          return;
        }
        await onEmailRegister(email, password, { 
            firstName, 
            lastName,
            birthDate,
            monthlyIncome,
            financialGoal,
            riskProfile
        });
      } else if (view === 'login') {
        await onEmailLogin(email, password);
      } else if (view === 'forgot') {
        await onForgotPassword(resetEmail);
        setSuccess("Email de réinitialisation envoyé ! Vérifiez vos spams.");
      }
    } catch (e) {
      let msg = e.message;
      if (msg.includes('auth/invalid-email')) msg = "Email invalide.";
      else if (msg.includes('auth/user-not-found')) msg = "Compte inexistant. Vérifiez vos identifiants.";
      else if (msg.includes('auth/wrong-password')) msg = "Mot de passe incorrect.";
      else if (msg.includes('auth/email-already-in-use')) msg = "Cet email est déjà utilisé.";
      else if (msg.includes('auth/weak-password')) msg = "Le mot de passe doit faire au moins 6 caractères.";
      else if (msg.includes('auth/invalid-credential')) msg = "Identifiants invalides.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <Card className="w-full max-w-lg p-8 shadow-xl border-0">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-blue-100 rounded-full text-blue-600 mb-4"><TrendingUp size={40} /></div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">MyWealth.io</h1>
          <p className="text-slate-500">
            {view === 'register' ? "Créez votre compte sécurisé" : view === 'forgot' ? "Récupération de compte" : "Gérez votre patrimoine intelligemment"}
          </p>
        </div>

        {view !== 'forgot' && (
          <div className="mb-6">
            <Button variant="google" className="w-full mb-4 flex items-center justify-center gap-3 py-3" onClick={handleGoogleClick}>
              <Globe size={18} className="text-blue-600" />
              Continuer avec Google
            </Button>
            {error && error.includes("Pop-up") && (
                <div className="text-xs text-center text-slate-500 mb-2">
                    Si le pop-up reste blanc, essayez de désactiver vos extensions (AdBlock) ou utilisez un autre navigateur.
                </div>
            )}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">Ou avec email</span></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {view === 'register' && (
            <div className="space-y-4 animate-in slide-in-from-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Prénom *</label>
                    <input type="text" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom *</label>
                    <input type="text" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>
                
                {/* Optional Financial Profile Fields during Registration */}
                <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-bold text-indigo-600 mb-3 flex items-center gap-1"><Sparkles size={12}/> Personnaliser mon profil (Optionnel)</p>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Date Naissance</label>
                            <input type="date" className="w-full p-2 rounded-lg border border-slate-300 text-sm" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Revenu Mensuel</label>
                            <input type="number" className="w-full p-2 rounded-lg border border-slate-300 text-sm" placeholder="€" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Objectif Principal</label>
                        <select className="w-full p-2 rounded-lg border border-slate-300 text-sm bg-white" value={financialGoal} onChange={(e) => setFinancialGoal(e.target.value)}>
                            <option value="freedom">Liberté Financière / FIRE</option>
                            <option value="retirement">Préparer sa retraite</option>
                            <option value="real_estate">Achat Immobilier</option>
                            <option value="safety">Épargne de précaution</option>
                            <option value="growth">Croissance du capital</option>
                            <option value="other">Autre</option>
                        </select>
                    </div>
                </div>
            </div>
          )}

          {view !== 'forgot' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input type="email" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe *</label>
                <input type="password" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </>
          ) : (
            <div className="animate-in fade-in">
              <label className="block text-sm font-medium text-slate-700 mb-1">Votre email</label>
              <input type="email" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="exemple@email.com" required />
            </div>
          )}

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-center gap-2 font-medium border border-red-200"><AlertCircle size={16} className="shrink-0"/> <span>{error}</span></div>}
          {success && <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg flex items-center gap-2"><CheckCircle size={16}/> {success}</div>}

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            {view === 'register' ? "Créer un compte" : view === 'forgot' ? "Envoyer le lien" : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-center text-sm">
          {view === 'login' && (
            <>
              <button onClick={() => setView('forgot')} className="text-slate-500 hover:text-blue-600 transition-colors">Mot de passe oublié ?</button>
              <div className="text-slate-600">Pas encore de compte ? <button onClick={() => setView('register')} className="font-bold text-blue-600 hover:underline">S'inscrire</button></div>
            </>
          )}
          
          {(view === 'register' || view === 'forgot') && (
            <button onClick={() => setView('login')} className="text-blue-600 hover:underline flex items-center justify-center gap-1">
              <ChevronLeft size={14} /> Retour à la connexion
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assets, setAssets] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  
// Message envoie auto mail
const [toast, setToast] = useState(null); 

const showToast = (msg) => setToast({ message: msg });


 // --- AUTO LOGOUT LOGIC (VERSION PERSISTANTE) ---
  const [showAutoLogoutModal, setShowAutoLogoutModal] = useState(false);
  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  // Seuils de sécurité
  const WARNING_THRESHOLD = 5 * 60 * 1000; // Alerte à 5 minutes
  const LOGOUT_THRESHOLD = 10 * 60 * 1000; // Déconnexion à 10 minutes

  // Fonction pour vérifier si le temps est écoulé (même après un refresh)
  const checkInactivity = useCallback(() => {
    if (!user) return;

    const lastActivity = parseInt(localStorage.getItem('lastActivity') || Date.now());
    const elapsed = Date.now() - lastActivity;

    if (elapsed >= LOGOUT_THRESHOLD) {
      handleLogout();
      setShowAutoLogoutModal(false);
      localStorage.removeItem('lastActivity');
    } else if (elapsed >= WARNING_THRESHOLD) {
      setShowAutoLogoutModal(true);
    }
  }, [user]);

  const startTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    const lastActivity = parseInt(localStorage.getItem('lastActivity') || Date.now());
    const elapsed = Date.now() - lastActivity;

    // Timer pour l'affichage de la modale d'alerte
    if (elapsed < WARNING_THRESHOLD) {
      warningTimerRef.current = setTimeout(() => {
        setShowAutoLogoutModal(true);
      }, WARNING_THRESHOLD - elapsed);
    } else {
      setShowAutoLogoutModal(true);
    }

    // Timer pour la déconnexion automatique
    logoutTimerRef.current = setTimeout(() => {
      handleLogout();
      setShowAutoLogoutModal(false);
      localStorage.removeItem('lastActivity');
    }, LOGOUT_THRESHOLD - elapsed);
  };

  const resetActivity = () => {
    // Sauvegarde de l'instant T dans la mémoire physique du navigateur
    localStorage.setItem('lastActivity', Date.now().toString());
    if (showAutoLogoutModal) setShowAutoLogoutModal(false);
    startTimers();
  };

  const confirmPresence = () => {
    resetActivity(); // Met à jour le localStorage et relance les compteurs
  };

  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    let lastRun = Date.now();

    const handleUserActivity = () => {
      // On limite l'écriture en mémoire à une fois toutes les 2 secondes pour les performances
      if (Date.now() - lastRun > 2000) {
        resetActivity();
        lastRun = Date.now();
      }
    };

    // Vérification immédiate au chargement/re-chargement de la page
    checkInactivity();
    startTimers();

    events.forEach(event => window.addEventListener(event, handleUserActivity));
    
    // Détection du retour sur l'onglet (crucial pour le verrouillage mobile)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
        startTimers();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [user, checkInactivity]);

  // --- AUTH STATE & DATA FETCHING ---

  useEffect(() => { 
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => { 
      setUser(currentUser); 
      if (currentUser) {
         // Load User Profile Data (Name/Surname)
         try {
         const profileDoc = await getDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'info'));
         if (profileDoc.exists()) {
             const data = profileDoc.data();
             setUserProfile(data);
         } else {
                 // Try to init profile from Auth provider data (e.g. Google)
                 if (currentUser.displayName) {
                     const names = currentUser.displayName.split(' ');
                     const newProfile = { 
                         firstName: names[0], 
                         lastName: names.length > 1 ? names.slice(1).join(' ') : '',
                         email: currentUser.email 
                     };
                     await setDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'info'), newProfile);
                     setUserProfile(newProfile);
                 }
             }
         } catch(e) { 
             console.error("Error fetching profile", e); 
             // Silent fail for profile load, not critical
         }
      } else {
          setUserProfile(null);
      }
      setLoading(false); 
    }); 
    return () => unsubAuth(); 
  }, []);

  // --- DÉCLENCHEUR DE RAPPORT MENSUEL AUTOMATIQUE ---
  const isProcessingReport = useRef(false); 

  useEffect(() => {
      if (user && userProfile && assets !== null && transactions !== null && !isProcessingReport.current) {
          const today = new Date();
          const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
          const lastReport = userProfile.lastMonthlyReportDate;

          if (userProfile.emailReports && lastReport !== currentMonthKey) {
              isProcessingReport.current = true; // On verrouille
              triggerMonthlyProcess(user, userProfile, currentMonthKey, false)
                  .finally(() => { isProcessingReport.current = false; });
          }
      }
  }, [user, userProfile, assets, transactions]);

  useEffect(() => {
    if (!user) return;
    
    // Ajout d'une gestion d'erreur robuste pour les listeners Firestore
    const unsubAssets = onSnapshot(
      doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'assets'), 
      (docSnapshot) => { 
        if (docSnapshot.exists()) {setAssets(docSnapshot.data().items || []); 
      }
	  else {
        setAssets([]); 
      }
    },
      (error) => {
        console.error("Erreur lecture Assets:", error);
        alert("Erreur de connexion aux données (Assets). Vérifiez vos droits d'accès.");
      }
    );

    const unsubTrans = onSnapshot(
      doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'transactions'), 
      (docSnapshot) => { 
        if (docSnapshot.exists()) setTransactions(docSnapshot.data().items || []); 
        else setTransactions([]); 
      },
      (error) => {
        console.error("Erreur lecture Transactions:", error);
      }
    );

    return () => { unsubAssets(); unsubTrans(); };
  }, [user]);

  const saveAssets = async (newAssets) => { 
    if (!user) return; 
    try { 
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'assets'), { items: newAssets }); 
    } catch (e) { 
      console.error("Erreur sauvegarde Assets:", e);
      alert("Impossible d'enregistrer : " + e.message); // Feedback utilisateur
    } 
  };

  const saveTransactions = async (newTransactions) => { 
    if (!user) return; 
    try { 
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'transactions'), { items: newTransactions }); 
    } catch (e) { 
      console.error("Erreur sauvegarde Transactions:", e); 
      alert("Impossible d'enregistrer la transaction : " + e.message);
    } 
  };

  const handleSetAssets = (newAssets) => { setAssets(newAssets); saveAssets(newAssets); };
  const handleSetTransactions = (newTransactions) => { setTransactions(newTransactions); saveTransactions(newTransactions); };

  // --- AUTH ACTIONS ---

  const handleLogin = async () => signInAnonymously(auth);
  
  const handleEmailLogin = async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
  };

  const handleEmailRegister = async (email, password, profileData) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user profile in Firestore immediately
      await setDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid, 'profile', 'info'), {
          ...profileData,
          email,
          createdAt: new Date().toISOString()
      });
  };

  const handleGoogleLogin = async () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' }); 
      auth.useDeviceLanguage(); 
      await signInWithPopup(auth, provider);
  };

  const handleForgotPassword = async (email) => {
      await sendPasswordResetEmail(auth, email);
  };

  const handleLogout = () => signOut(auth);

  const handleUpdateProfile = async (formData) => {
    if (!user) return;
    try {
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
        await setDoc(profileRef, formData, { merge: true });
        setUserProfile(prev => ({ ...prev, ...formData }));
    } catch (e) {
        console.error("Error updating profile:", e);
        alert("Erreur lors de la mise à jour du profil.");
    }
  };


  // --- TRANSACTION HELPERS (Keep existing logic) ---
  
  const updateAssetHistoryWithDelta = (asset, date, delta) => {
    const prevHistory = asset.history || [];
    let updatedHistory = prevHistory.map(h => { 
      if (new Date(h.date) >= new Date(date)) { 
        // Si c'est un investissement et que le delta est positif (virement entrant), 
        // on augmente aussi la valeur investie
        const isInvestedCompte = ['investissement', 'epargne_salariale', 'crypto'].includes(asset.type);
        const investedDelta = isInvestedCompte ? delta : 0;
        return { 
          ...h, 
          value: parseFloat((h.value + delta).toFixed(2)),
          investedValue: (h.investedValue || h.value) + investedDelta
        }; 
      } 
      return h; 
    });
    
    const exists = updatedHistory.some(h => h.date === date);
    if (!exists) {
      const sorted = [...updatedHistory].sort((a,b) => new Date(a.date) - new Date(b.date));
      const previousEntry = [...sorted].reverse().find(h => new Date(h.date) < new Date(date));
      const baseValue = previousEntry ? previousEntry.value : 0; 
      const baseInvested = previousEntry ? (previousEntry.investedValue || previousEntry.value) : 0;
      const isInvestedCompte = ['investissement', 'epargne_salariale', 'crypto'].includes(asset.type);
      const investedDelta = isInvestedCompte ? delta : 0;
      
      updatedHistory.push({ 
        date: date, 
        value: parseFloat((baseValue + delta).toFixed(2)),
        investedValue: baseInvested + investedDelta
      });
    }
    updatedHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    return updatedHistory;
  };

  // --- GESTIONNAIRES DE TRANSACTIONS (VERSION PROJETÉE) ---

  // --- GESTIONNAIRES DE TRANSACTIONS (VERSION TEMPS RÉEL) ---

  const handleCreateTransaction = (transaction, impactedAssetId) => {
    let currentAssets = [...assets];

    const applyTransactionToAsset = (assetId, date, delta) => {
      const idx = currentAssets.findIndex(a => a.id.toString() === assetId.toString());
      if (idx === -1) return;

      const asset = currentAssets[idx];
      const updatedHistory = updateAssetHistoryWithDelta(asset, date, delta);
      
      // LOGIQUE : On cherche le point le plus récent qui n'est pas dans le futur
      const today = new Date().toISOString().split('T')[0];
      const sortedHistory = [...updatedHistory].sort((a, b) => a.date.localeCompare(b.date));
      const latestPastOrPresent = [...sortedHistory].reverse().find(h => h.date <= today);
      
      const currentRealValue = latestPastOrPresent 
        ? latestPastOrPresent.value 
        : parseFloat((asset.value + (date <= today ? delta : 0)).toFixed(2));

      // Mise à jour de la poche Cash pour les comptes composites
      const isComposite = ['investissement', 'epargne_salariale', 'crypto'].includes(asset.type);
      let positions = asset.positions || [];
      
      if (isComposite) {
        if (!positions.some(p => p.isCash)) {
          positions.push({ id: 'cash_pouch', name: '💰 Espèces', value: 0, isCash: true, history: [] });
        }
        
        const otherPosValue = positions.filter(p => !p.isCash).reduce((sum, p) => sum + p.value, 0);
        positions = positions.map(p => 
          p.isCash ? { ...p, value: parseFloat((currentRealValue - otherPosValue).toFixed(2)) } : p
        );
      }

      currentAssets[idx] = { 
        ...asset, 
        value: currentRealValue, 
        positions: positions, 
        history: updatedHistory 
      };
    };

    if (transaction.type === 'transfer') {
      if (transaction.fromId) applyTransactionToAsset(transaction.fromId, transaction.date, -transaction.amount);
      if (transaction.toId) applyTransactionToAsset(transaction.toId, transaction.date, transaction.amount);
    } else if (impactedAssetId) {
      const delta = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
      applyTransactionToAsset(impactedAssetId, transaction.date, delta);
    }

    const newTransactions = [transaction, ...transactions];
    setTransactions(newTransactions);
    saveTransactions(newTransactions);
    setAssets(currentAssets);
    saveAssets(currentAssets);
  };

  const handleUpdateTransaction = (updatedTransaction) => {
    const originalTransaction = transactions.find(t => t.id === updatedTransaction.id);
    if (!originalTransaction) return;

    let currentAssets = [...assets];
    const today = new Date().toISOString().split('T')[0];

    const applyDeltaToAsset = (assetId, date, delta) => {
      const idx = currentAssets.findIndex(a => a.id.toString() === assetId.toString());
      if (idx === -1) return;
      const asset = currentAssets[idx];
      
      const updatedHistory = updateAssetHistoryWithDelta(asset, date, delta);
      const sortedHistory = [...updatedHistory].sort((a, b) => a.date.localeCompare(b.date));
      const latestPastOrPresent = [...sortedHistory].reverse().find(h => h.date <= today);
      const currentRealValue = latestPastOrPresent ? latestPastOrPresent.value : asset.value;

      const isComposite = ['investissement', 'epargne_salariale', 'crypto'].includes(asset.type);
      let positions = asset.positions || [];
      
      if (isComposite) {
        const otherPosValue = positions.filter(p => !p.isCash).reduce((sum, p) => sum + p.value, 0);
        positions = positions.map(p => 
          p.isCash ? { ...p, value: parseFloat((currentRealValue - otherPosValue).toFixed(2)) } : p
        );
      }

      currentAssets[idx] = { ...asset, value: currentRealValue, positions, history: updatedHistory };
    };

    if (originalTransaction.type === 'transfer') {
      if (originalTransaction.fromId) applyDeltaToAsset(originalTransaction.fromId, originalTransaction.date, originalTransaction.amount);
      if (originalTransaction.toId) applyDeltaToAsset(originalTransaction.toId, originalTransaction.date, -originalTransaction.amount);
    } else if (originalTransaction.linkedAssetId) {
      let revDelta = originalTransaction.type === 'expense' ? originalTransaction.amount : -originalTransaction.amount;
      applyDeltaToAsset(originalTransaction.linkedAssetId, originalTransaction.date, revDelta);
    }

    if (updatedTransaction.type === 'transfer') {
      if (updatedTransaction.fromId) applyDeltaToAsset(updatedTransaction.fromId, updatedTransaction.date, -updatedTransaction.amount);
      if (updatedTransaction.toId) applyDeltaToAsset(updatedTransaction.toId, updatedTransaction.date, updatedTransaction.amount);
    } else if (updatedTransaction.linkedAssetId) {
      let delta = updatedTransaction.type === 'expense' ? -updatedTransaction.amount : updatedTransaction.amount;
      applyDeltaToAsset(updatedTransaction.linkedAssetId, updatedTransaction.date, delta);
    }

    setAssets(currentAssets);
    saveAssets(currentAssets);
    const newTxList = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
    setTransactions(newTxList);
    saveTransactions(newTxList);
  };

  const handleDeleteTransaction = (transactionId) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    let currentAssets = [...assets];
    const today = new Date().toISOString().split('T')[0];

    const applyDeltaToAsset = (assetId, date, delta) => {
      const idx = currentAssets.findIndex(a => a.id.toString() === assetId.toString());
      if (idx === -1) return;
      const asset = currentAssets[idx];
      
      const updatedHistory = updateAssetHistoryWithDelta(asset, date, delta);
      const sortedHistory = [...updatedHistory].sort((a, b) => a.date.localeCompare(b.date));
      const latestPastOrPresent = [...sortedHistory].reverse().find(h => h.date <= today);
      const currentRealValue = latestPastOrPresent ? latestPastOrPresent.value : asset.value;

      const isComposite = ['investissement', 'epargne_salariale', 'crypto'].includes(asset.type);
      let positions = asset.positions || [];
      
      if (isComposite) {
        const otherPosValue = positions.filter(p => !p.isCash).reduce((sum, p) => sum + p.value, 0);
        positions = positions.map(p => 
          p.isCash ? { ...p, value: parseFloat((currentRealValue - otherPosValue).toFixed(2)) } : p
        );
      }

      currentAssets[idx] = { ...asset, value: currentRealValue, positions, history: updatedHistory };
    };

    if (transaction.type === 'transfer') {
        if (transaction.fromId) applyDeltaToAsset(transaction.fromId, transaction.date, transaction.amount);
        if (transaction.toId) applyDeltaToAsset(transaction.toId, transaction.date, -transaction.amount);
    } else if (transaction.linkedAssetId) {
       let reverseDelta = transaction.type === 'expense' ? transaction.amount : -transaction.amount;
       applyDeltaToAsset(transaction.linkedAssetId, transaction.date, reverseDelta);
    }

    const newTransactions = transactions.filter(t => t.id !== transactionId);
    setTransactions(newTransactions);
    saveTransactions(newTransactions);
    setAssets(currentAssets);
    saveAssets(currentAssets);
  };

  const handleRestoreBackup = async (backupData) => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Restaurer les Assets [cite: 412]
      if (backupData.assets) {
        await handleSetAssets(backupData.assets);
      }
      // 2. Restaurer les Transactions [cite: 412]
      if (backupData.transactions) {
        await handleSetTransactions(backupData.transactions);
      }
      // 3. Restaurer le profil si présent 
      if (backupData.profile) {
        await handleUpdateProfile(backupData.profile);
      }
      alert("Restauration terminée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      alert("Une erreur est survenue lors de la restauration.");
    } finally {
      setLoading(false);
    }
  };

  const triggerMonthlyProcess = async (currentUser, profile, monthKey, isManual = false) => {
    if (!assets || !transactions) return;

    const aiSummary = await callGeminiAPI(
      "Tu es un expert financier. Analyse ces données et fais un résumé court (10 lignes max). " +
      "IMPORTANT : N'utilise JAMAIS de Markdown. Utilise uniquement : <br/>, <b>, et <ul>/<li>.",
      `Patrimoine actuel: ${JSON.stringify(assets)}. Transactions: ${JSON.stringify(transactions?.slice(0, 10))}`
    );

    const backupJSON = JSON.stringify({ assets, transactions, profile, date: monthKey });

    try {
      await emailjs.send("service_htd01wn", "template_ac5mdxf", {
        to_email: profile.email || currentUser.email,
        user_name: profile.firstName,
        month: monthKey,
        report_content: aiSummary,
        backup_data: backupJSON
      });

      if (!isManual) {
        const profileRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'info');
        await setDoc(profileRef, { lastMonthlyReportDate: monthKey }, { merge: true });
        setUserProfile(prev => ({ ...prev, lastMonthlyReportDate: monthKey }));
      }

      showToast(isManual ? "Votre rapport a été envoyé par mail !" : "Nouveau bilan mensuel généré et envoyé !");
    } catch (error) {
      console.error("Erreur lors du processus :", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 bg-slate-50">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
        onGoogleLogin={handleGoogleLogin}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-20 md:pb-0">
      <InactivityModal isOpen={showAutoLogoutModal} onStayConnected={confirmPresence} />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onUpdate={handleUpdateProfile}
        assets={assets}
        transactions={transactions}
        onRestore={handleRestoreBackup}
        onSendReport={() => {
          const today = new Date();
          const monthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
          triggerMonthlyProcess(user, userProfile, monthKey + " (Manuel)", true);
        }}
      />

      {/* TOP NAVIGATION (DESKTOP) */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 md:px-8 hidden md:block">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><TrendingUp size={20} /></div>
            <span className="font-bold text-xl tracking-tight text-slate-800">MyWealth<span className="text-blue-600">.io</span></span>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'assets', label: 'Patrimoine', icon: Wallet },
              { id: 'budget', label: 'Budget & Flux', icon: ArrowRightLeft },
              { id: 'advisor', label: 'Conseiller IA ✨', icon: Sparkles, magic: true }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : tab.magic ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <tab.icon size={16} className={tab.magic ? "text-indigo-500" : ""} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {userProfile ? (
              <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full font-medium border border-slate-200 hover:bg-slate-100 transition-colors">
                <User size={12} className="text-blue-500" /> {userProfile.firstName}
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium"><Cloud size={12} /> Sauvegardé</div>
            )}
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Déconnexion"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      {/* MOBILE TOP BAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 h-14 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white"><TrendingUp size={18} /></div>
          <span className="font-bold text-lg text-slate-800">MyWealth</span>
        </div>
        <div className="flex items-center gap-2">
          {userProfile && (
            <button onClick={() => setIsProfileModalOpen(true)} className="p-2 bg-slate-50 rounded-full text-blue-600">
              <User size={18} />
            </button>
          )}
          <button onClick={handleLogout} className="p-2 text-slate-400"><LogOut size={18} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {activeTab === 'dashboard' && <DashboardView assets={assets} transactions={transactions} setActiveTab={setActiveTab} onDeleteTransaction={handleDeleteTransaction} userProfile={userProfile} />}
        {activeTab === 'assets' && <AssetsView assets={assets} setAssets={handleSetAssets} />}
        {activeTab === 'budget' && (
          <BudgetView
            transactions={transactions}
            assets={assets}
            onAddTransaction={handleCreateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
          />
        )}
        {activeTab === 'advisor' && <AiAdvisorView assets={assets} transactions={transactions} userProfile={userProfile} />}
      </main>

      {/* BOTTOM NAVIGATION (MOBILE) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 pb-safe">
        <div className="flex justify-around items-center h-16">
          {[
            { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
            { id: 'assets', label: 'Actifs', icon: Wallet },
            { id: 'budget', label: 'Budget', icon: ArrowRightLeft },
            { id: 'advisor', label: 'Conseil', icon: Sparkles, magic: true }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? (tab.magic ? "text-indigo-500" : "text-blue-600") : ""} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}