import { Product, StockMovement, User } from '../types';
import { supabase } from '../lib/supabase';

export interface StockAlert {
  type: 'low_stock';
  productId: string;
  productReference: string;
  productDesignation: string;
  currentStock: number;
  minStock: number;
  percentage: number;
  severity: 'warning' | 'critical';
}

export interface ConsumptionAlert {
  type: 'unusual_consumption';
  productId: string;
  productReference: string;
  productDesignation: string;
  averageDaily: number;
  recentDaily: number;
  percentageIncrease: number;
}

export type Alert = StockAlert | ConsumptionAlert;

/**
 * Détecte les produits avec stock faible
 */
export function detectLowStockAlerts(products: Product[]): StockAlert[] {
  const alerts: StockAlert[] = [];

  products.forEach(product => {
    // Ignorer les produits supprimés
    if (product.deletedAt) return;

    // Vérifier si le stock est en dessous du minimum
    if (product.currentStock <= product.minStock) {
      const percentage = product.minStock > 0
        ? (product.currentStock / product.minStock) * 100
        : 0;

      alerts.push({
        type: 'low_stock',
        productId: product.id,
        productReference: product.reference,
        productDesignation: product.designation,
        currentStock: product.currentStock,
        minStock: product.minStock,
        percentage,
        severity: percentage <= 50 ? 'critical' : 'warning',
      });
    }
  });

  return alerts;
}

/**
 * Analyse les consommations inhabituelles basées sur l'historique
 */
export function detectUnusualConsumption(
  products: Product[],
  stockMovements: StockMovement[]
): ConsumptionAlert[] {
  const alerts: ConsumptionAlert[] = [];
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  products.forEach(product => {
    // Ignorer les produits supprimés
    if (product.deletedAt) return;

    // Filtrer les sorties pour ce produit
    const exits = stockMovements.filter(
      m => m.productId === product.id && m.movementType === 'exit'
    );

    if (exits.length < 5) return; // Pas assez de données

    // Sorties des 3 derniers jours
    const recentExits = exits.filter(
      m => new Date(m.timestamp) >= threeDaysAgo
    );

    // Sorties des 30 derniers jours (hors 3 derniers jours)
    const historicalExits = exits.filter(
      m => new Date(m.timestamp) >= thirtyDaysAgo && new Date(m.timestamp) < threeDaysAgo
    );

    if (historicalExits.length === 0) return;

    // Calculer la consommation moyenne quotidienne historique
    const historicalDays = Math.max(1, (threeDaysAgo.getTime() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000));
    const historicalTotal = historicalExits.reduce((sum, m) => sum + m.quantity, 0);
    const averageDaily = historicalTotal / historicalDays;

    // Calculer la consommation moyenne quotidienne récente
    const recentDays = Math.max(1, (now.getTime() - threeDaysAgo.getTime()) / (24 * 60 * 60 * 1000));
    const recentTotal = recentExits.reduce((sum, m) => sum + m.quantity, 0);
    const recentDaily = recentTotal / recentDays;

    // Vérifier si la consommation récente est significativement supérieure
    if (averageDaily > 0) {
      const percentageIncrease = ((recentDaily - averageDaily) / averageDaily) * 100;

      // Alerte si augmentation > 50% et consommation récente > 0
      if (percentageIncrease > 50 && recentDaily > 0) {
        alerts.push({
          type: 'unusual_consumption',
          productId: product.id,
          productReference: product.reference,
          productDesignation: product.designation,
          averageDaily,
          recentDaily,
          percentageIncrease,
        });
      }
    }
  });

  return alerts;
}

/**
 * Récupère tous les utilisateurs qui ont activé les alertes
 */
export async function getUsersWithAlertsEnabled(): Promise<User[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, name, role, badge_number, alert_email, enable_stock_alerts, enable_consumption_alerts')
    .not('alert_email', 'is', null)
    .neq('alert_email', '');

  if (error || !data) {
    console.error('Erreur lors de la récupération des utilisateurs avec alertes:', error);
    return [];
  }

  return data.map(user => ({
    id: user.id,
    username: user.username,
    password: '',
    role: user.role,
    name: user.name,
    badgeNumber: user.badge_number || undefined,
    alertEmail: user.alert_email || undefined,
    enableStockAlerts: user.enable_stock_alerts ?? true,
    enableConsumptionAlerts: user.enable_consumption_alerts ?? true,
  }));
}

/**
 * Envoie les alertes par email via Edge Function
 */
export async function sendAlertEmails(
  user: User,
  stockAlerts: StockAlert[],
  consumptionAlerts: ConsumptionAlert[]
): Promise<void> {
  if (!user.alertEmail) return;

  const hasStockAlerts = user.enableStockAlerts && stockAlerts.length > 0;
  const hasConsumptionAlerts = user.enableConsumptionAlerts && consumptionAlerts.length > 0;

  if (!hasStockAlerts && !hasConsumptionAlerts) return;

  try {
    const { error } = await supabase.functions.invoke('send-alert-email', {
      body: {
        to: user.alertEmail,
        userName: user.name,
        stockAlerts: user.enableStockAlerts ? stockAlerts : [],
        consumptionAlerts: user.enableConsumptionAlerts ? consumptionAlerts : [],
      },
    });

    if (error) {
      console.error('Erreur lors de l\'envoi de l\'email d\'alerte:', error);
    } else {
      console.log(`Email d'alerte envoyé à ${user.alertEmail}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'invocation de la fonction d\'envoi d\'email:', error);
  }
}

/**
 * Vérifie et envoie toutes les alertes nécessaires
 */
export async function checkAndSendAlerts(
  products: Product[],
  stockMovements: StockMovement[]
): Promise<void> {
  console.log('Vérification des alertes...');

  // Détecter les alertes
  const stockAlerts = detectLowStockAlerts(products);
  const consumptionAlerts = detectUnusualConsumption(products, stockMovements);

  console.log(`Détecté: ${stockAlerts.length} alertes de stock, ${consumptionAlerts.length} alertes de consommation`);

  if (stockAlerts.length === 0 && consumptionAlerts.length === 0) {
    console.log('Aucune alerte à envoyer');
    return;
  }

  // Récupérer les utilisateurs avec alertes activées
  const users = await getUsersWithAlertsEnabled();

  if (users.length === 0) {
    console.log('Aucun utilisateur avec alertes activées');
    return;
  }

  // Envoyer les alertes à chaque utilisateur
  for (const user of users) {
    await sendAlertEmails(user, stockAlerts, consumptionAlerts);
  }

  console.log(`Alertes envoyées à ${users.length} utilisateur(s)`);
}
