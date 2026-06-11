// Run this SQL in Supabase SQL Editor to create the property_videos table
export const CREATE_PROPERTY_VIDEOS_TABLE = `
CREATE TABLE IF NOT EXISTS property_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  video_type INT CHECK (video_type IN (1, 2, 3)),
  video_url TEXT,
  prompt TEXT,
  duration INT DEFAULT 5,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'generated', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_videos_property_id ON property_videos(property_id);
`
