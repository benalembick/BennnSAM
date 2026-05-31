-- Migration 007: Agent inventory normalization trigger
-- Fires on every raw_inventory_events INSERT (source='agent') and upserts into
-- devices, applications, and software_installations so the dashboard has live data.

-- ── Unique constraints required for upsert (ON CONFLICT) operations ──────────

ALTER TABLE public.devices
  ADD CONSTRAINT devices_tenant_hostname_unique UNIQUE (tenant_id, hostname);

ALTER TABLE public.applications
  ADD CONSTRAINT applications_tenant_name_unique UNIQUE (tenant_id, name);

ALTER TABLE public.software_installations
  ADD CONSTRAINT software_installations_device_app_unique
  UNIQUE (tenant_id, device_id, application_id);

-- ── Core normalization function (reused by trigger + backfill) ────────────────

CREATE OR REPLACE FUNCTION app.normalize_agent_event(
  p_tenant_id   uuid,
  p_payload     jsonb,
  p_detected_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  v_device_id   uuid;
  v_app_id      uuid;
  v_hostname    text;
  v_os_version  text;
  v_os          text;
  v_serial      text;
  v_apps        jsonb;
  v_app         jsonb;
  v_app_name    text;
  v_app_version text;
  v_apps_len    int;
  i             int;
BEGIN
  v_hostname   := NULLIF(trim(COALESCE(p_payload->>'hostname', '')), '');
  v_os_version := p_payload->'inventory'->'System'->>'OsVersion';
  v_serial     := NULLIF(trim(COALESCE(p_payload->'inventory'->'System'->>'SerialNumber', '')), '');

  v_os := CASE
    WHEN v_os_version ILIKE '%windows%' THEN 'Windows'
    WHEN v_os_version ILIKE '%mac%' OR v_os_version ILIKE '%darwin%' THEN 'macOS'
    WHEN v_os_version ILIKE '%linux%' THEN 'Linux'
    ELSE COALESCE(NULLIF(v_os_version, ''), 'Windows')
  END;

  -- Upsert device (key: tenant_id + hostname)
  INSERT INTO public.devices (
    tenant_id, hostname, os, os_version, last_check_in, serial_number,
    installed_software, running_processes, lifecycle_status
  )
  VALUES (
    p_tenant_id,
    COALESCE(v_hostname, 'unknown-host'),
    v_os,
    v_os_version,
    p_detected_at,
    v_serial,
    COALESCE(p_payload->'inventory'->'InstalledApplications', '[]'::jsonb),
    COALESCE(p_payload->'inventory'->'RunningProcesses', '[]'::jsonb),
    'active'
  )
  ON CONFLICT (tenant_id, hostname) DO UPDATE SET
    os                 = EXCLUDED.os,
    os_version         = EXCLUDED.os_version,
    last_check_in      = GREATEST(EXCLUDED.last_check_in, public.devices.last_check_in),
    serial_number      = COALESCE(EXCLUDED.serial_number, public.devices.serial_number),
    installed_software = EXCLUDED.installed_software,
    running_processes  = EXCLUDED.running_processes,
    updated_at         = now()
  RETURNING id INTO v_device_id;

  -- Upsert each installed application and its installation link
  v_apps     := COALESCE(p_payload->'inventory'->'InstalledApplications', '[]'::jsonb);
  v_apps_len := jsonb_array_length(v_apps);

  FOR i IN 0..v_apps_len - 1 LOOP
    v_app         := v_apps->i;
    v_app_name    := NULLIF(trim(COALESCE(v_app->>'Name', '')), '');
    v_app_version := NULLIF(trim(COALESCE(v_app->>'Version', '')), '');

    CONTINUE WHEN v_app_name IS NULL;

    INSERT INTO public.applications (
      tenant_id, name, category, app_type, version, last_detected_date
    )
    VALUES (
      p_tenant_id, v_app_name, 'Uncategorised', 'desktop',
      v_app_version, p_detected_at::date
    )
    ON CONFLICT (tenant_id, name) DO UPDATE SET
      version            = COALESCE(EXCLUDED.version, public.applications.version),
      last_detected_date = GREATEST(EXCLUDED.last_detected_date, public.applications.last_detected_date),
      updated_at         = now()
    RETURNING id INTO v_app_id;

    INSERT INTO public.software_installations (
      tenant_id, device_id, application_id, last_seen, source
    )
    VALUES (p_tenant_id, v_device_id, v_app_id, p_detected_at, 'agent')
    ON CONFLICT (tenant_id, device_id, application_id) DO UPDATE SET
      last_seen = GREATEST(EXCLUDED.last_seen, public.software_installations.last_seen);
  END LOOP;

  -- Refresh install_count for every app touched in this upload
  UPDATE public.applications a
  SET install_count = (
    SELECT count(distinct si.device_id)
    FROM public.software_installations si
    WHERE si.application_id = a.id AND si.tenant_id = p_tenant_id
  )
  WHERE a.tenant_id = p_tenant_id
    AND a.id IN (
      SELECT application_id
      FROM public.software_installations
      WHERE device_id = v_device_id AND tenant_id = p_tenant_id
    );

  RETURN v_device_id;
END;
$$;

-- ── Trigger wrapper ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION app.process_agent_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
DECLARE
  v_device_id uuid;
BEGIN
  IF NEW.source <> 'agent' THEN
    RETURN NEW;
  END IF;
  v_device_id   := app.normalize_agent_event(NEW.tenant_id, NEW.payload, NEW.detected_at);
  NEW.device_id := v_device_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_process_agent_inventory ON public.raw_inventory_events;
CREATE TRIGGER trg_process_agent_inventory
  BEFORE INSERT ON public.raw_inventory_events
  FOR EACH ROW EXECUTE FUNCTION app.process_agent_inventory();

-- ── Backfill existing agent rows ──────────────────────────────────────────────
-- Processes all rows already in raw_inventory_events that haven't been linked
-- to a device yet (device_id IS NULL). Ordered oldest-first so last_check_in
-- ends up reflecting the most recent upload.

DO $$
DECLARE
  r           record;
  v_device_id uuid;
BEGIN
  FOR r IN
    SELECT id, tenant_id, payload, detected_at
    FROM public.raw_inventory_events
    WHERE source = 'agent' AND device_id IS NULL
    ORDER BY detected_at ASC
  LOOP
    v_device_id := app.normalize_agent_event(r.tenant_id, r.payload, r.detected_at);
    UPDATE public.raw_inventory_events
      SET device_id = v_device_id
      WHERE id = r.id;
  END LOOP;
END;
$$;
