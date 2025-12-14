import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface StockAlert {
  type: 'low_stock';
  productReference: string;
  productDesignation: string;
  currentStock: number;
  minStock: number;
  percentage: number;
  severity: 'warning' | 'critical';
}

interface ConsumptionAlert {
  type: 'unusual_consumption';
  productReference: string;
  productDesignation: string;
  averageDaily: number;
  recentDaily: number;
  percentageIncrease: number;
}

interface RequestBody {
  to: string;
  userName: string;
  stockAlerts: StockAlert[];
  consumptionAlerts: ConsumptionAlert[];
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, userName, stockAlerts, consumptionAlerts }: RequestBody = await req.json();

    if (!to || !userName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construire le contenu de l'email
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Bonjour ${userName},</h2>
        <p style="color: #4b5563;">Voici un résumé des alertes détectées dans votre système de gestion des stocks :</p>
    `;

    // Alertes de stock faible
    if (stockAlerts && stockAlerts.length > 0) {
      htmlContent += `
        <div style="margin-top: 20px;">
          <h3 style="color: #dc2626;">⚠️ Alertes de Stock Faible (${stockAlerts.length})</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Produit</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Stock actuel</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Stock min</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Niveau</th>
              </tr>
            </thead>
            <tbody>
      `;

      stockAlerts.forEach((alert) => {
        const severityColor = alert.severity === 'critical' ? '#dc2626' : '#f59e0b';
        const severityText = alert.severity === 'critical' ? 'CRITIQUE' : 'Attention';

        htmlContent += `
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">
              <strong>${alert.productReference}</strong><br/>
              <span style="font-size: 0.9em; color: #6b7280;">${alert.productDesignation}</span>
            </td>
            <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${alert.currentStock}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${alert.minStock}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">
              <span style="color: ${severityColor}; font-weight: bold;">${severityText}</span>
            </td>
          </tr>
        `;
      });

      htmlContent += `
            </tbody>
          </table>
        </div>
      `;
    }

    // Alertes de consommation inhabituelle
    if (consumptionAlerts && consumptionAlerts.length > 0) {
      htmlContent += `
        <div style="margin-top: 20px;">
          <h3 style="color: #f59e0b;">📊 Alertes de Consommation Inhabituelle (${consumptionAlerts.length})</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Produit</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Moyenne habituelle</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Consommation récente</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Augmentation</th>
              </tr>
            </thead>
            <tbody>
      `;

      consumptionAlerts.forEach((alert) => {
        htmlContent += `
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">
              <strong>${alert.productReference}</strong><br/>
              <span style="font-size: 0.9em; color: #6b7280;">${alert.productDesignation}</span>
            </td>
            <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${alert.averageDaily.toFixed(1)}/jour</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${alert.recentDaily.toFixed(1)}/jour</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">
              <span style="color: #f59e0b; font-weight: bold;">+${alert.percentageIncrease.toFixed(0)}%</span>
            </td>
          </tr>
        `;
      });

      htmlContent += `
            </tbody>
          </table>
        </div>
      `;
    }

    htmlContent += `
        <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1f2937;">💡 <strong>Recommandation :</strong> Vérifiez ces produits et passez des commandes si nécessaire.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9em;">
          <p>Cet email a été généré automatiquement par votre système de gestion des stocks.</p>
          <p>Pour modifier vos préférences d'alertes, rendez-vous dans <strong>Paramètres > Alertes Intelligentes</strong>.</p>
        </div>
      </div>
    `;

    // Envoyer l'email via Resend API
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY non configurée. Email simulé.');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email simulé (RESEND_API_KEY non configurée)',
          preview: htmlContent
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Gestion des Stocks <alerts@gestionstocks.app>',
        to: [to],
        subject: `🔔 Alertes Stock - ${stockAlerts.length + consumptionAlerts.length} notification(s)`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending alert email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
