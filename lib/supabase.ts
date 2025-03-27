import { createClient } from '@supabase/supabase-js';

/**
 * Configuración del cliente Supabase.
 * 
 * Las credenciales se cargan desde las variables de entorno:
 * - NEXT_PUBLIC_SUPABASE_URL: URL de tu proyecto en Supabase
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Clave anónima para autenticación
 * 
 * Estas variables están definidas en el archivo .env.local que no se incluye en el
 * control de versiones para proteger las credenciales.
 */

// Obtener credenciales de las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Las variables de entorno de Supabase no están definidas. Por favor, crea un archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
