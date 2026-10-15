-- Member-facing profile data. Keep private by default and publish only after
-- explicit consent, identity checks where required, and moderator approval.
CREATE TABLE member_profiles (
  user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  profile_type TEXT NOT NULL
    CHECK (profile_type IN ('aspiring_entrepreneur', 'msme_owner', 'supplier', 'investor_funder', 'partner', 'fulfillment_provider', 'other')),
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  industry TEXT,
  location_text TEXT,
  business_stage TEXT,
  primary_goal TEXT,
  introduction TEXT,
  offering_summary TEXT,
  seeking_summary TEXT,
  contact_preference TEXT NOT NULL DEFAULT 'private_until_introduction'
    CHECK (contact_preference IN ('platform_message', 'after_introduction', 'private_until_introduction')),
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public')),
  publication_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft', 'pending_review', 'published', 'rejected', 'suspended')),
  profile_image_key TEXT,
  consented_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (publication_status <> 'published' OR (visibility = 'public' AND consented_at IS NOT NULL))
);

CREATE INDEX idx_member_profiles_discovery
  ON member_profiles(publication_status, profile_type, industry, location_text);
