import { defineConfig } from 'vite';

// Los adaptadores copiados de la base leen import.meta.env.SUPABASE_URL,
// DB_MOTOR, etc. — sin el prefijo VITE_ que Vite usa por defecto. Se amplía
// envPrefix para no tener que reescribir esos archivos: la regla del sistema
// es copiarlos tal cual desde 02-bases/.
export default defineConfig({
  envPrefix: ['VITE_', 'SUPABASE_', 'FIREBASE_', 'DB_', 'AUTH_',
              'WOMPI_', 'WHATSAPP_', 'GA4_'],
});
