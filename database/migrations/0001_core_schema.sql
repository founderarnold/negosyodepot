-- NegosyoDepot core schema, SQLite / Cloudflare D1 compatible.
-- Schema only: no sample or production records are inserted here.
-- Apply through the Sites migration workflow only after a D1 binding and
-- server-side API runtime have been configured and validated in staging.

PRAGMA foreign_keys = ON;

CREATE TABLE app_users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Keep provider credentials/tokens in a secret store, never in these rows.
-- `issuer` + `subject` is the durable identity key; email is not.
CREATE TABLE external_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  linked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (issuer, subject)
);

CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  legal_name TEXT,
  display_name TEXT NOT NULL,
  organization_type TEXT NOT NULL
    CHECK (organization_type IN ('business', 'supplier', 'investor', 'funder', 'partner', 'fulfillment_provider', 'other')),
  description TEXT,
  website_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected', 'expired')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_memberships (
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL
    CHECK (member_role IN ('owner', 'administrator', 'editor', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'revoked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE user_roles (
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK (role IN ('member', 'entrepreneur', 'supplier', 'distributor', 'fulfillment_operator', 'investor', 'funder', 'partner', 'service_provider', 'moderator', 'administrator')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'suspended', 'revoked')),
  granted_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role)
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  category_type TEXT NOT NULL
    CHECK (category_type IN ('opportunity', 'product', 'service', 'funding', 'partner', 'fulfillment')),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Populate from an authoritative PSA/PSGC source after source/version review.
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES locations(id) ON DELETE RESTRICT,
  psgc_code TEXT UNIQUE,
  level TEXT NOT NULL
    CHECK (level IN ('country', 'region', 'province', 'city_municipality', 'barangay')),
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  source_name TEXT,
  source_version TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  listing_type TEXT NOT NULL
    CHECK (listing_type IN ('opportunity', 'product', 'service', 'funding_offer', 'partner_offer', 'fulfillment_provider')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'paused', 'archived')),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected', 'expired')),
  source_kind TEXT NOT NULL DEFAULT 'owner_submission'
    CHECK (source_kind IN ('owner_submission', 'owner_import', 'sample')),
  is_sample INTEGER NOT NULL DEFAULT 0 CHECK (is_sample IN (0, 1)),
  published_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((source_kind = 'sample' AND is_sample = 1) OR (source_kind <> 'sample' AND is_sample = 0))
);

CREATE TABLE listing_locations (
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  availability_type TEXT NOT NULL DEFAULT 'service_area'
    CHECK (availability_type IN ('headquarters', 'service_area', 'distribution_area', 'fulfillment_hub')),
  PRIMARY KEY (listing_id, location_id, availability_type)
);

CREATE TABLE opportunity_details (
  listing_id TEXT PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  business_model TEXT,
  opportunity_type TEXT,
  capital_min_minor INTEGER,
  capital_max_minor INTEGER,
  currency TEXT NOT NULL DEFAULT 'PHP',
  requirements TEXT,
  CHECK (capital_min_minor IS NULL OR capital_min_minor >= 0),
  CHECK (capital_max_minor IS NULL OR capital_max_minor >= 0),
  CHECK (capital_min_minor IS NULL OR capital_max_minor IS NULL OR capital_min_minor <= capital_max_minor)
);

CREATE TABLE product_service_details (
  listing_id TEXT PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
  price_min_minor INTEGER,
  price_max_minor INTEGER,
  currency TEXT NOT NULL DEFAULT 'PHP',
  price_disclosure TEXT,
  availability_note TEXT,
  CHECK (price_min_minor IS NULL OR price_min_minor >= 0),
  CHECK (price_max_minor IS NULL OR price_max_minor >= 0),
  CHECK (price_min_minor IS NULL OR price_max_minor IS NULL OR price_min_minor <= price_max_minor)
);

CREATE TABLE funding_offer_details (
  listing_id TEXT PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  instrument_type TEXT NOT NULL,
  amount_min_minor INTEGER,
  amount_max_minor INTEGER,
  currency TEXT NOT NULL DEFAULT 'PHP',
  sectors TEXT,
  stages TEXT,
  eligibility TEXT,
  fees_and_terms TEXT NOT NULL,
  risk_disclosures TEXT NOT NULL,
  authority_reference TEXT,
  authority_review_status TEXT NOT NULL DEFAULT 'not_reviewed'
    CHECK (authority_review_status IN ('not_reviewed', 'pending', 'approved', 'rejected', 'expired')),
  CHECK (amount_min_minor IS NULL OR amount_min_minor >= 0),
  CHECK (amount_max_minor IS NULL OR amount_max_minor >= 0),
  CHECK (amount_min_minor IS NULL OR amount_max_minor IS NULL OR amount_min_minor <= amount_max_minor)
);

CREATE TABLE fulfillment_provider_details (
  listing_id TEXT PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  capabilities TEXT NOT NULL,
  coverage_summary TEXT,
  capacity_summary TEXT,
  pricing_disclosure TEXT,
  availability_status TEXT NOT NULL DEFAULT 'not_confirmed'
    CHECK (availability_status IN ('not_confirmed', 'available', 'limited', 'unavailable'))
);

CREATE TABLE partner_offer_details (
  listing_id TEXT PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  partnership_types TEXT NOT NULL,
  target_sectors TEXT,
  eligibility TEXT,
  terms_summary TEXT
);

CREATE TABLE inquiries (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  sender_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  recipient_organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'viewed', 'responded', 'closed', 'reported')),
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE looking_for_requests (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  budget_min_minor INTEGER,
  budget_max_minor INTEGER,
  currency TEXT NOT NULL DEFAULT 'PHP',
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'published', 'closed', 'rejected', 'archived')),
  consent_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (budget_min_minor IS NULL OR budget_min_minor >= 0),
  CHECK (budget_max_minor IS NULL OR budget_max_minor >= 0),
  CHECK (budget_min_minor IS NULL OR budget_max_minor IS NULL OR budget_min_minor <= budget_max_minor),
  CHECK (visibility <> 'public' OR (status = 'published' AND consent_at IS NOT NULL))
);

CREATE TABLE saved_listings (
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE comparison_sets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comparison_set_items (
  comparison_set_id TEXT NOT NULL REFERENCES comparison_sets(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 3),
  PRIMARY KEY (comparison_set_id, listing_id),
  UNIQUE (comparison_set_id, position)
);

CREATE TABLE membership_plans (
  id TEXT PRIMARY KEY,
  plan_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Entitlements are imported only from a confirmed membership/billing source.
CREATE TABLE member_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  source_system TEXT NOT NULL,
  source_entitlement_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  starts_at TEXT,
  ends_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_system, source_entitlement_id)
);

CREATE TABLE moderation_actions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('listing', 'looking_for_request', 'organization')),
  entity_id TEXT NOT NULL,
  moderator_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes', 'suspend', 'restore')),
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_reports (
  id TEXT PRIMARY KEY,
  reporter_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('listing', 'organization', 'user', 'inquiry')),
  entity_id TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  request_id TEXT,
  safe_metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Integration metadata contains identifiers and sync state only, never secrets.
CREATE TABLE integration_sync_state (
  integration_key TEXT PRIMARY KEY,
  system_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_configured'
    CHECK (status IN ('not_configured', 'ready', 'paused', 'error')),
  last_success_at TEXT,
  last_error_code TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE import_batches (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL,
  source_version TEXT,
  source_file_hash TEXT,
  source_object_key TEXT,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'validated', 'approved', 'processed', 'rejected')),
  rows_received INTEGER NOT NULL DEFAULT 0 CHECK (rows_received >= 0),
  rows_accepted INTEGER NOT NULL DEFAULT 0 CHECK (rows_accepted >= 0),
  rows_rejected INTEGER NOT NULL DEFAULT 0 CHECK (rows_rejected >= 0),
  created_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT
);

CREATE TABLE import_record_results (
  batch_id TEXT NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  source_record_key TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('accepted', 'rejected', 'skipped')),
  target_type TEXT,
  target_id TEXT,
  error_code TEXT,
  PRIMARY KEY (batch_id, source_record_key)
);

CREATE INDEX idx_listings_discovery ON listings(status, listing_type, category_id, published_at);
CREATE INDEX idx_listings_organization ON listings(organization_id, status);
CREATE INDEX idx_listing_locations_location ON listing_locations(location_id, listing_id);
CREATE INDEX idx_inquiries_recipient ON inquiries(recipient_organization_id, status, created_at);
CREATE INDEX idx_looking_for_public ON looking_for_requests(status, visibility, request_type, created_at);
CREATE INDEX idx_membership_user_status ON member_entitlements(user_id, status, ends_at);
CREATE INDEX idx_reports_status ON user_reports(status, created_at);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id, created_at);
CREATE INDEX idx_import_batches_status ON import_batches(status, created_at);
