'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initializeApp,
  getApps,
  type FirebaseApp,
} from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Check if Firebase is configured
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

interface TenantInfo {
  id: string;
  name: string;
  apiKey: string;
}

interface AuthContextType {
  // Firebase Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  isFirebaseConfigured: boolean;

  // Tenant
  currentTenantId: string | null;
  currentTenantName: string | null;
  tenants: TenantInfo[];
  setCurrentTenant: (tenantId: string) => void;

  // Archii API
  archiiApiKey: string | null;
  setArchiiApiKey: (key: string, tenantId: string) => void;

  // Actions
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  addTenant: (tenant: TenantInfo) => void;
  removeTenant: (tenantId: string) => void;

  // Loading states
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const TENANTS_STORAGE_KEY = 'carpi_tenants';
const CURRENT_TENANT_KEY = 'carpi_current_tenant';
const API_KEYS_PREFIX = 'carpi_api_key_';

function getStoredTenants(): TenantInfo[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(TENANTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function storeTenants(tenants: TenantInfo[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
  } catch {
    // ignore storage errors
  }
}

function getStoredCurrentTenant(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CURRENT_TENANT_KEY);
  } catch {
    return null;
  }
}

function storeCurrentTenant(tenantId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (tenantId) {
      localStorage.setItem(CURRENT_TENANT_KEY, tenantId);
    } else {
      localStorage.removeItem(CURRENT_TENANT_KEY);
    }
  } catch {
    // ignore
  }
}

function getStoredApiKey(tenantId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(`${API_KEYS_PREFIX}${tenantId}`);
  } catch {
    return null;
  }
}

function storeApiKey(tenantId: string, key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${API_KEYS_PREFIX}${tenantId}`, key);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    let firebaseApp: FirebaseApp;
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Set app after auth listener is established
    setTimeout(() => setApp(firebaseApp), 0);

    return () => unsubscribe();
  }, []);

  // Load tenants from storage
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = getStoredTenants();
      setTenants(stored);

      const storedCurrent = getStoredCurrentTenant();
      if (storedCurrent && stored.some(t => t.id === storedCurrent)) {
        setCurrentTenantId(storedCurrent);
      } else if (stored.length > 0) {
        setCurrentTenantId(stored[0].id);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const signIn = useCallback(async () => {
    if (!app || !isFirebaseConfigured) return;
    const auth = getAuth(app);
    await signInAnonymously(auth);
  }, [app]);

  const signOutUser = useCallback(async () => {
    if (!app || !isFirebaseConfigured) return;
    const auth = getAuth(app);
    await firebaseSignOut(auth);
    setCurrentTenantId(null);
    storeCurrentTenant(null);
  }, [app]);

  const setCurrentTenant = useCallback((tenantId: string) => {
    setCurrentTenantId(tenantId);
    storeCurrentTenant(tenantId);
  }, []);

  const setArchiiApiKey = useCallback((key: string, tenantId: string) => {
    storeApiKey(tenantId, key);
    // Update the tenants array with new API key
    setTenants(prev => {
      const updated = prev.map(t =>
        t.id === tenantId ? { ...t, apiKey: key } : t
      );
      storeTenants(updated);
      return updated;
    });
  }, []);

  const addTenant = useCallback((tenant: TenantInfo) => {
    setTenants(prev => {
      const exists = prev.find(t => t.id === tenant.id);
      const updated = exists
        ? prev.map(t => t.id === tenant.id ? { ...t, ...tenant } : t)
        : [...prev, tenant];
      storeTenants(updated);
      return updated;
    });
    if (tenant.apiKey) {
      storeApiKey(tenant.id, tenant.apiKey);
    }
    // Auto-select if it's the first tenant
    setCurrentTenantId(prev => prev || tenant.id);
  }, []);

  const removeTenant = useCallback((tenantId: string) => {
    setTenants(prev => {
      const updated = prev.filter(t => t.id !== tenantId);
      storeTenants(updated);
      return updated;
    });
    setCurrentTenantId(prev => {
      if (prev === tenantId) {
        const remaining = tenants.filter(t => t.id !== tenantId);
        const newId = remaining.length > 0 ? remaining[0].id : null;
        storeCurrentTenant(newId);
        return newId;
      }
      return prev;
    });
  }, [tenants]);

  const currentTenantName = currentTenantId
    ? tenants.find(t => t.id === currentTenantId)?.name || null
    : null;

  const archiiApiKey = currentTenantId
    ? getStoredApiKey(currentTenantId) || tenants.find(t => t.id === currentTenantId)?.apiKey || null
    : null;

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !isFirebaseConfigured || Boolean(currentUser),
    isFirebaseConfigured,
    currentTenantId,
    currentTenantName,
    tenants,
    setCurrentTenant,
    archiiApiKey,
    setArchiiApiKey,
    signIn,
    signOut: signOutUser,
    addTenant,
    removeTenant,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
