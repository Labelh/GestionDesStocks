# Edge Function: send-alert-email

Cette fonction Supabase Edge Function envoie des emails d'alerte pour les stocks faibles et les consommations inhabituelles.

## Configuration

### 1. Installer Supabase CLI

```bash
npm install -g supabase
```

### 2. Se connecter à Supabase

```bash
supabase login
```

### 3. Lier le projet

```bash
supabase link --project-ref jxymbulpvnzzysfcsxvw
```

### 4. Configurer Resend API (Service d'envoi d'emails)

1. Créer un compte sur [Resend](https://resend.com)
2. Obtenir une clé API
3. Configurer la clé dans Supabase:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 5. Déployer la fonction

```bash
supabase functions deploy send-alert-email
```

## Utilisation

La fonction est appelée automatiquement par le service d'alertes côté client.

### Exemple de requête

```typescript
const { data, error } = await supabase.functions.invoke('send-alert-email', {
  body: {
    to: 'user@example.com',
    userName: 'John Doe',
    stockAlerts: [
      {
        type: 'low_stock',
        productReference: 'REF-001',
        productDesignation: 'Produit A',
        currentStock: 5,
        minStock: 10,
        percentage: 50,
        severity: 'warning'
      }
    ],
    consumptionAlerts: [
      {
        type: 'unusual_consumption',
        productReference: 'REF-002',
        productDesignation: 'Produit B',
        averageDaily: 10,
        recentDaily: 25,
        percentageIncrease: 150
      }
    ]
  }
});
```

## Alternative: Configuration email via SMTP

Si vous préférez utiliser votre propre serveur SMTP au lieu de Resend, vous pouvez modifier la fonction pour utiliser un client SMTP Deno.

## Test local

```bash
supabase functions serve send-alert-email
```

Puis faire une requête avec curl:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-alert-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"to":"test@example.com","userName":"Test User","stockAlerts":[],"consumptionAlerts":[]}'
```

## Permissions

Assurez-vous que la fonction a les permissions nécessaires dans Supabase Dashboard:
- Settings > API > Enable Edge Functions

## Logs

Pour voir les logs de la fonction:

```bash
supabase functions logs send-alert-email
```
