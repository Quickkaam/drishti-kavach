-- ============================================
-- Drishti Kavach — Insert Quick Kaam Info into AI Memory
-- Run this in Supabase SQL Editor
-- ============================================

-- Your user_id is 1 (BIGINT) but ai_memory.user_id is UUID
-- Since the users table uses BIGINT for id, we need to work around this

-- Step 1: Drop the foreign key constraint (if it exists)
ALTER TABLE ai_memory DROP CONSTRAINT IF EXISTS ai_memory_user_id_fkey;

-- Step 2: Insert the data with a valid UUID
-- Generate a UUID from user_id 1 using a deterministic method
-- UUID format: 00000000-0000-5000-8000-000000000001 (version 5 UUID)

INSERT INTO ai_memory (user_id, memory) VALUES
  ('00000000-0000-5000-8000-000000000001'::uuid, 'Quick Kaam is a digital marketing agency founded in 2026, based in Patna, Bihar. Office: Azad Path, Gali number 3, Chandmari Road, Kankarbagh, Patna, Bihar - 800020. Contact: contactquickkaam@gmail.com, supportquickkaam@gmail.com. Phone: +91 62024 69886. Website: quickkaam.in'),
  ('00000000-0000-5000-8000-000000000001'::uuid, 'Sobhit Mishra is the Founder & Director of Quick Kaam. Expertise in media strategy, digital communication, political branding, content production, and creative storytelling.'),
  ('00000000-0000-5000-8000-000000000001'::uuid, 'Richa Kumari is the Co-Founder & Managing Director of Quick Kaam. Handles structural execution, management operations, and overall administrative capabilities for business growth.'),
  ('00000000-0000-5000-8000-000000000001'::uuid, 'Giridhar Pai is the Head of Cyber Security & Senior Web Developer at Quick Kaam. Manages end-to-end technical deployment, web engineering, custom software development, and core web safety parameters.'),
  ('00000000-0000-5000-8000-000000000001'::uuid, 'Rounak Kumar is the Manager & HR Head at Quick Kaam. Handles organizational workflow, internal management, human resources, and coordination across teams.'),
  ('00000000-0000-5000-8000-000000000001'::uuid, 'Quick Kaam Mission: Empower businesses, brands, and individuals through innovative digital solutions, creative storytelling, and strategic marketing. Deliver fast, effective, and result-driven services that help clients build a strong digital presence, maximize growth, and achieve long-term success.'),
  ('00000000-0000-5000-8000-000000000001'::uuid, 'Quick Kaam Vision: Become a trusted leader in digital innovation and media solutions by transforming ideas into impactful experiences. Redefine modern marketing through creativity, technology, and smart strategies, helping brands grow with confidence in an ever-evolving digital world.'),
  ('00000000-0000-5000-8000-000000000001'::uuid, 'Quick Kaam Services: 1) Branding & Growth Architecture - brand identity formulation, logo curation, graphic design, and long-term business scalability strategies. 2) Digital Marketing & SEO - complete 360 digital campaign planning, organic SEO management, and targeted lead generation. 3) Content Creation & Media Production - copywriting, high-conversion content writing, social media management, and promotional video/media planning. 4) Web Solutions & Cyber Security - end-to-end website design, custom software/web deployment, and foundational web security parameters. 5) Political PR Services - localized campaign strategizing, public relations management, and target-audience communication engineering. 6) Legal Advisory & Event Planning - professional legal compliance advice alongside structural brand-event coordination.'),
  ('00000000-0000-5000-8000-000000000001'::uuid, 'Quick Kaam Milestones: 2025 - Foundation & Vision. 2026 - Growth & Future Expansion, expanding creative and technical capabilities in branding, media production, website development, and digital marketing.');

-- Step 3: Re-add the foreign key constraint if users.id is UUID
-- ALTER TABLE ai_memory ADD CONSTRAINT ai_memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

SELECT 'AI Memory seeded with Quick Kaam company information!' as status;
