#!/usr/bin/env node

/**
 * Clean Database Script - Keep System Entities Only
 * 
 * Script para limpar o banco mantendo apenas roles, permissions e policies do sistema
 * Remove todos os dados exceto as entidades de sistema (account_id IS NULL)
 * 
 * Usage: node clean-database-keep-system.js [--confirm]
 */

const { DatabaseConfig } = require('../src/config/database');

class DatabaseCleaner {
  constructor() {
    this.db = new DatabaseConfig();
    this.pool = null;
  }

  /**
   * Conecta ao banco de dados
   */
  async connect() {
    try {
      this.pool = await this.db.connect();
      console.log('✅ Conectado ao banco de dados');
    } catch (error) {
      console.error('❌ Erro ao conectar ao banco:', error.message);
      throw error;
    }
  }

  /**
   * Desconecta do banco de dados
   */
  async disconnect() {
    if (this.pool) {
      await this.db.disconnect();
      console.log('✅ Desconectado do banco de dados');
    }
  }

  /**
   * Executa uma query SQL
   */
  async executeQuery(query, description) {
    try {
      console.log(`🔄 ${description}...`);
      const result = await this.pool.query(query);
      const rowCount = result.rowCount || 0;
      console.log(`   ✅ ${description} - ${rowCount} registros afetados`);
      return result;
    } catch (error) {
      console.error(`   ❌ Erro em ${description}:`, error.message);
      throw error;
    }
  }

  /**
   * Verifica o que restou no banco (apenas entidades de sistema)
   */
  async verifySystemEntities() {
    console.log('\n📊 Verificando entidades de sistema restantes...');
    
    try {
      const result = await this.pool.query(`
        SELECT 'System Roles' as type, name, description 
        FROM roles 
        WHERE account_id IS NULL
        UNION ALL
        SELECT 'System Policies' as type, name, description 
        FROM policies 
        WHERE account_id IS NULL
        UNION ALL
        SELECT 'System Permissions' as type, service || ':' || action as name, description 
        FROM permissions 
        WHERE account_id IS NULL
        ORDER BY type, name
      `);

      if (result.rows.length === 0) {
        console.log('⚠️  Nenhuma entidade de sistema encontrada');
      } else {
        console.log('\n📋 Entidades de sistema preservadas:');
        console.table(result.rows);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar entidades de sistema:', error.message);
    }
  }

  /**
   * Executa a limpeza completa do banco
   */
  async cleanDatabase() {
    console.log('🧹 Iniciando limpeza do banco de dados...\n');

    // Lista de queries de limpeza em ordem
    const cleanupQueries = [
      {
        query: 'DELETE FROM role_sessions',
        description: 'Removendo todas as sessões de roles'
      },
      {
        query: 'DELETE FROM user_policies',
        description: 'Removendo relacionamentos user-policies'
      },
      {
        query: 'DELETE FROM user_roles',
        description: 'Removendo relacionamentos user-roles'
      },
      {
        query: 'DELETE FROM group_members',
        description: 'Removendo membros de grupos'
      },
      {
        query: 'DELETE FROM group_policies',
        description: 'Removendo relacionamentos group-policies'
      },
      {
        query: 'DELETE FROM users',
        description: 'Removendo todos os usuários'
      },
      {
        query: 'DELETE FROM accounts',
        description: 'Removendo todas as contas'
      },
      {
        query: 'DELETE FROM groups WHERE account_id IS NOT NULL',
        description: 'Removendo grupos não-sistema'
      },
      {
        query: 'DELETE FROM policies WHERE account_id IS NOT NULL',
        description: 'Removendo policies não-sistema'
      },
      {
        query: 'DELETE FROM roles WHERE account_id IS NOT NULL',
        description: 'Removendo roles não-sistema'
      },
      {
        query: 'DELETE FROM role_policies WHERE account_id IS NOT NULL',
        description: 'Removendo relacionamentos role-policies não-sistema'
      }
    ];

    // Executar cada query de limpeza
    for (const { query, description } of cleanupQueries) {
      await this.executeQuery(query, description);
    }

    console.log('\n✅ Limpeza do banco concluída com sucesso!');
  }

  /**
   * Confirma a operação com o usuário
   */
  async confirmOperation() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log('⚠️  ATENÇÃO: Esta operação irá remover TODOS os dados do banco,');
      console.log('   mantendo apenas as entidades de sistema (roles, policies, permissions).');
      console.log('   Esta ação é IRREVERSÍVEL!\n');
      
      rl.question('Tem certeza que deseja continuar? (digite "SIM" para confirmar): ', (answer) => {
        rl.close();
        resolve(answer.toUpperCase() === 'SIM');
      });
    });
  }

  /**
   * Executa o script completo
   */
  async run() {
    try {
      // Verificar argumentos da linha de comando
      const args = process.argv.slice(2);
      const skipConfirmation = args.includes('--confirm');

      if (!skipConfirmation) {
        const confirmed = await this.confirmOperation();
        if (!confirmed) {
          console.log('❌ Operação cancelada pelo usuário');
          return;
        }
      }

      // Conectar ao banco
      await this.connect();

      // Executar limpeza
      await this.cleanDatabase();

      // Verificar resultado
      await this.verifySystemEntities();

    } catch (error) {
      console.error('\n❌ Erro durante a execução:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🧹 Database Cleaner - Keep System Entities Only');
  console.log('================================================\n');

  const cleaner = new DatabaseCleaner();
  await cleaner.run();
}

// Executar script se chamado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });
}

module.exports = DatabaseCleaner;
