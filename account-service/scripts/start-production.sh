#!/bin/bash

# Script de inicialização para produção
set -e

echo "🚀 Iniciando IAM Account Service..."

# Verificar variáveis de ambiente obrigatórias
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ Variável de ambiente $1 é obrigatória"
        exit 1
    fi
}

echo "🔍 Verificando variáveis de ambiente..."
check_env_var "DATABASE_HOST"
check_env_var "DATABASE_NAME"
check_env_var "DATABASE_USER"
check_env_var "DATABASE_PASSWORD"
check_env_var "JWT_SECRET"

# Configurar defaults
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PORT=${REDIS_PORT:-6379}

echo "📋 Configuração:"
echo "   - Environment: $NODE_ENV"
echo "   - Port: $PORT"
echo "   - Database: $DATABASE_HOST:5432/$DATABASE_NAME"
echo "   - Redis: $REDIS_HOST:$REDIS_PORT"

# Esperar serviços ficarem prontos
echo "⏳ Aguardando dependências..."

# Aguardar PostgreSQL
until PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c '\q' 2>/dev/null; do
    echo "   Aguardando PostgreSQL..."
    sleep 2
done
echo "   ✅ PostgreSQL pronto"

# Aguardar Redis (opcional)
if command -v redis-cli &> /dev/null; then
    until redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null; do
        echo "   Aguardando Redis..."
        sleep 1
    done
    echo "   ✅ Redis pronto"
fi

# Executar migrações se necessário
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🔄 Executando migrações..."
    # Aqui você adicionaria seu comando de migração
    # node scripts/migrate.js
fi

# Cleanup de tokens expirados na inicialização
if [ "$CLEANUP_ON_START" = "true" ]; then
    echo "🧹 Executando cleanup de tokens expirados..."
    node scripts/cleanup-tokens.js || echo "   ⚠️ Cleanup falhou, continuando..."
fi

echo "🎯 Iniciando aplicação..."
exec node server.js
