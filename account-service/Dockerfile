# Multi-stage build para otimização
FROM node:18-alpine AS builder

# Instalar dependências de sistema necessárias
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Segunda stage - runtime
FROM node:18-alpine AS runtime

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S iam -u 1001

# Instalar apenas curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copiar dependências do builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --chown=iam:nodejs . .

# Criar diretório de logs
RUN mkdir -p logs && chown -R iam:nodejs logs

# Expor porta
EXPOSE 3001

# Trocar para usuário não-root
USER iam

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
