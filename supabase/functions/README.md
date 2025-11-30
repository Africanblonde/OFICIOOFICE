# Supabase Edge Functions

Este diretório contém Edge Functions do Supabase.

## create-user

Função que permite administradores criarem usuários completos (com credenciais de autenticação).

### Uso

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'senha123',
    userData: {
      name: 'Nome do Usuário',
      role: 'WORKER',
      locationId: 'location-uuid',
      jobTitle: 'Cargo',
      defaultDailyGoal: 10,
      dailyRate: 236.5,
      halfDayRate: 118,
      absencePenalty: 95,
      bonusPerUnit: 10
    }
  })
});
```

### Deploy

```bash
supabase functions deploy create-user
```
