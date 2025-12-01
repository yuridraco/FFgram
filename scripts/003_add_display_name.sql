-- Adicionar campo display_name para nome personalizado
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Atualizar usuários existentes com o nome do FF como display_name inicial
UPDATE users SET display_name = ff_name WHERE display_name IS NULL;
