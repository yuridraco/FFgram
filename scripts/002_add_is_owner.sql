-- Adicionar coluna is_owner para identificar o dono do site
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Atualizar o dono existente (se já cadastrado)
UPDATE users SET is_owner = true, verification_type = 'pro' WHERE ff_uid = '130098219';
