-- Migration: Add refresh_token column to bank_tokens table
-- Run this in your Supabase SQL editor

ALTER TABLE bank_tokens ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- This column stores TrueLayer refresh tokens so we can auto-renew
-- expired access tokens (which expire after 1 hour).
