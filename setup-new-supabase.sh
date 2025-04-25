#!/bin/bash

# Script para configurar la nueva instancia de Supabase
# Usando la URL y API Key del nuevo proyecto de Supabase

# Definir variables desde el archivo de credenciales
SUPABASE_URL="https://mknkuuzezzjrxbmsboau.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbmt1dXplenpqcnhibXNib2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDI2OTAsImV4cCI6MjA2MTExODY5MH0.eEY22QZvPzyHjqhATHULZ3ooC5j6rwWmazTFyZmmhAY"

# Ejecutar la migración SQL
echo "Aplicando migración SQL al nuevo proyecto de Supabase..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "query": "$(cat ./supabase/migrations/01_create_tables.sql)"
}
EOF

echo "\n\nConfiguración completada. No olvides guardar el archivo supabase-credentials.txt como .env.local"
