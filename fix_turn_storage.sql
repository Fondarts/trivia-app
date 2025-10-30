-- Fix: Quitar la foreign key constraint de current_turn_player_id
-- Si ya ejecutaste el SQL anterior y dio error, ejecuta esto

-- Primero, si la columna existe con la foreign key, hay que eliminarla y recrearla sin la constraint
-- (Solo si hay error, sino no ejecutes esto)

-- Si dio error en la línea 8, ejecuta esto primero:
-- ALTER TABLE async_matches DROP COLUMN IF EXISTS current_turn_player_id;

-- Luego agrega la columna sin foreign key constraint:
ALTER TABLE async_matches 
ADD COLUMN IF NOT EXISTS current_turn_player_id UUID;

-- El resto del SQL anterior está bien, solo necesitas que esta columna sea UUID sin constraint

