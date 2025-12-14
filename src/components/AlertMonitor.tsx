import { useAlertMonitor } from '../hooks/useAlertMonitor';

/**
 * Composant invisible qui surveille et envoie les alertes en arrière-plan
 * Active uniquement pour les managers
 * Vérifie toutes les heures par défaut
 */
export const AlertMonitor: React.FC = () => {
  useAlertMonitor({
    enabled: true,
    intervalMinutes: 60, // Vérification toutes les heures
  });

  // Ce composant ne rend rien, il exécute juste le hook en arrière-plan
  return null;
};
