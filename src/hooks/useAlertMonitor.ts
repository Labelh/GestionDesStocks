import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContextSupabase';
import { checkAndSendAlerts } from '../services/alertService';

interface UseAlertMonitorOptions {
  enabled?: boolean;
  intervalMinutes?: number;
}

/**
 * Hook personnalisé pour surveiller et envoyer les alertes automatiquement
 *
 * @param options.enabled - Active ou désactive la surveillance (par défaut: true pour les managers uniquement)
 * @param options.intervalMinutes - Intervalle de vérification en minutes (par défaut: 60)
 */
export function useAlertMonitor(options: UseAlertMonitorOptions = {}) {
  const { currentUser, products, stockMovements } = useApp();
  const {
    enabled = currentUser?.role === 'manager',
    intervalMinutes = 60
  } = options;

  const lastCheckRef = useRef<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performCheck = useCallback(async () => {
    if (!enabled || !currentUser || currentUser.role !== 'manager') {
      return;
    }

    const now = new Date();
    console.log(`[AlertMonitor] Vérification des alertes à ${now.toLocaleTimeString()}`);

    try {
      await checkAndSendAlerts(products, stockMovements);
      lastCheckRef.current = now;
    } catch (error) {
      console.error('[AlertMonitor] Erreur lors de la vérification des alertes:', error);
    }
  }, [enabled, currentUser, products, stockMovements]);

  useEffect(() => {
    if (!enabled) {
      // Nettoyer l'intervalle si désactivé
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Vérification initiale après 30 secondes (laisser le temps au chargement des données)
    const initialTimeout = setTimeout(() => {
      performCheck();
    }, 30000);

    // Vérification périodique
    intervalRef.current = setInterval(() => {
      performCheck();
    }, intervalMinutes * 60 * 1000);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMinutes, performCheck]);

  // Fonction pour forcer une vérification manuelle
  const forceCheck = useCallback(() => {
    performCheck();
  }, [performCheck]);

  return {
    lastCheck: lastCheckRef.current,
    forceCheck,
  };
}
