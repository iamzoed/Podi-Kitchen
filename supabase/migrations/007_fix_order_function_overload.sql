-- URGENT FIX — run this immediately in the Supabase SQL Editor.
--
-- 006_order_delivery_location.sql used `create or replace function
-- create_order_with_capacity(...)` with three extra trailing parameters
-- for delivery location. Postgres does NOT treat a changed parameter count
-- as replacing the original — it creates a second, separate overload
-- instead, leaving BOTH the old 7-parameter version (from
-- 005_kitchen_capacity.sql) and the new 10-parameter version active at
-- once. Any RPC call that doesn't pass the location parameters (i.e. every
-- order placed without using "Use my current location") is then ambiguous
-- between the two overloads, and PostgREST refuses to guess — breaking
-- order creation entirely with error PGRST203.
--
-- Fix: drop the old 7-parameter overload so only the 10-parameter version
-- (whose last three parameters default to null) remains. That one version
-- correctly handles both cases.

drop function if exists public.create_order_with_capacity(text, text, text, text, text, uuid, jsonb);
