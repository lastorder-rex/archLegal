-- Migration: Delete sample consultations with test user IDs
-- These test user IDs don't exist in auth.users, causing RLS issues

DELETE FROM consultations
WHERE user_id LIKE 'test_user_%';
