-- Database cleanup script to remove ai_generation rows with empty aiResponse
-- This script will delete rows where aiResponse is empty, null, or just whitespace

-- First, let's see what we're dealing with
SELECT
    COUNT(*) as empty_rows_count,
    'Will be deleted' as status
FROM ai_generation
WHERE
    ai_response = ''
    OR ai_response IS NULL
    OR trim(ai_response) = '';

-- Show some examples of what will be deleted (first 5 rows)
SELECT
    id,
    user_id,
    LEFT(user_prompt, 50) as user_prompt_preview,
    LENGTH(ai_response) as response_length,
    ai_response,
    created_at
FROM ai_generation
WHERE
    ai_response = ''
    OR ai_response IS NULL
    OR trim(ai_response) = ''
LIMIT 5;

-- Count total rows before deletion
SELECT COUNT(*) as total_rows_before FROM ai_generation;

-- Perform the deletion
-- UNCOMMENT THE LINE BELOW TO ACTUALLY DELETE THE ROWS
-- DELETE FROM ai_generation WHERE ai_response = '' OR ai_response IS NULL OR trim(ai_response) = '';

-- Count total rows after deletion (run this after uncommenting the DELETE statement)
-- SELECT COUNT(*) as total_rows_after FROM ai_generation;
