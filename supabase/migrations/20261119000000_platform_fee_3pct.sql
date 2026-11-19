-- GlobeHouse Interactive takes 3% of every BuyScreen transaction (Dave, 2026-11-18).
-- Was 5% by default. Per-merchant overrides (merchant.platform_fee_override) are left as they are.
alter table public.platform_settings alter column platform_fee_rate set default 0.03;
update public.platform_settings set platform_fee_rate = 0.03 where platform_fee_rate is null or platform_fee_rate = 0.05;
