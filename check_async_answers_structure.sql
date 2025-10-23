-- Verificar estructura de async_answers
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'async_answers' 
ORDER BY ordinal_position;

-- Ver un registro de ejemplo si existe
SELECT * FROM public.async_answers LIMIT 1;
