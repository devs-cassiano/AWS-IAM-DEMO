-- Migration: Create token_blacklist table
-- File: migrations/006_create_token_blacklist.sql

-- Criar tabela para blacklist de tokens
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    token_type VARCHAR(20) NOT NULL DEFAULT 'access', -- 'access', 'refresh'
    user_id UUID,
    account_id UUID,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(100) DEFAULT 'logout', -- 'logout', 'admin_revoke', 'security'
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_account ON token_blacklist(account_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_type ON token_blacklist(token_type);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_created ON token_blacklist(created_at);

-- Foreign keys
ALTER TABLE token_blacklist 
    ADD CONSTRAINT fk_token_blacklist_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE token_blacklist 
    ADD CONSTRAINT fk_token_blacklist_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Check constraints
ALTER TABLE token_blacklist 
    ADD CONSTRAINT chk_token_type 
    CHECK (token_type IN ('access', 'refresh'));

ALTER TABLE token_blacklist 
    ADD CONSTRAINT chk_expires_after_revoked 
    CHECK (expires_at > revoked_at);

-- Function para cleanup automático
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM token_blacklist WHERE expires_at <= NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
        RAISE NOTICE 'Cleaned up % expired tokens', deleted_count;
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE token_blacklist IS 'Armazena tokens JWT revogados para segurança';
COMMENT ON COLUMN token_blacklist.token_hash IS 'Hash SHA-256 do token (não armazena o token completo)';
COMMENT ON COLUMN token_blacklist.reason IS 'Motivo da revogação: logout, admin_revoke, security';
COMMENT ON COLUMN token_blacklist.expires_at IS 'Quando o token expira naturalmente (para cleanup)';
COMMENT ON COLUMN token_blacklist.revoked_at IS 'Quando o token foi revogado';
