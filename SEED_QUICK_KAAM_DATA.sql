-- ============================================
-- Drishti Kavach — Quick Kaam Company Data
-- Run this in Supabase SQL Editor
-- ============================================

-- Insert Company Overview Data
INSERT INTO company_overview (company_name, tagline, core_philosophy, established_year, address, email_general, email_support, phone, website)
VALUES (
  'Quick Kaam',
  'We don''t just build brands; we engineer growth through precision marketing and technical excellence.',
  'Smart Solutions, Fast Execution',
  2026,
  'Azad Path, Gali number 3, Chandmari Road, Kankarbagh, Patna, Bihar - 800020',
  'contactquickkaam@gmail.com',
  'supportquickkaam@gmail.com',
  '+91 62024 69886',
  'quickkaam.in'
);

-- Insert Team Members Data
INSERT INTO team_members (full_name, designation, bio, category) VALUES
  ('Sobhit Mishra', 'Founder & Director', 
   'The visionary behind Quick Kaam. Brings extensive expertise in media strategy, digital communication, political branding, content production, and creative storytelling.',
   'Leadership'),
  ('Richa Kumari', 'Co-Founder & Managing Director', 
   'Co-leads structural execution, management operations, and overall administrative capabilities for business growth.',
   'Core Team'),
  ('Giridhar Pai', 'Head of Cyber Security & Senior Web Developer', 
   'Manages end-to-end technical deployment, web engineering, custom software development, and core web safety parameters.',
   'Core Team'),
  ('Rounak Kumar', 'Manager & HR Head', 
   'Handles organizational workflow, internal management, human resources, and coordination across teams.',
   'Core Team');

-- Insert Mission & Vision Data
INSERT INTO mission_vision (section_type, description) VALUES
  ('Mission', 
   'At Quick Kaam, our mission is to empower businesses, brands, and individuals through innovative digital solutions, creative storytelling, and strategic marketing. We are committed to delivering fast, effective, and result-driven services that help our clients build a strong digital presence, maximize growth, and achieve long-term success.'),
  ('Vision', 
   'Our vision is to become a trusted leader in digital innovation and media solutions by transforming ideas into impactful experiences. We aspire to redefine modern marketing through creativity, technology, and smart strategies, helping brands grow with confidence in an ever-evolving digital world.');

-- Insert Core Services Data
INSERT INTO services (service_name, service_description) VALUES
  ('Branding & Growth Architecture', 
   'Brand identity formulation, logo curation, graphic design, and long-term business scalability strategies.'),
  ('Digital Marketing & SEO', 
   'Complete 360° digital campaign planning, organic Search Engine Optimization (SEO) management, and targeted lead generation.'),
  ('Content Creation & Media Production', 
   'Copywriting, high-conversion content writing, social media management (SMM), and promotional video/media planning.'),
  ('Web Solutions & Cyber Security', 
   'End-to-end website design, custom software/web deployment, and foundational web security parameters.'),
  ('Political PR Services', 
   'Localized campaign strategizing, public relations management, and target-audience communication engineering.'),
  ('Legal Advisory & Event Planning', 
   'Professional legal compliance advice alongside structural brand-event coordination.');

-- Insert Company Journey / Milestones Data
INSERT INTO company_journey (milestone_year, title, description) VALUES
  (2025, 'Foundation & Vision', 
   'Quick Kaam began its journey with a clear vision to transform digital solutions through creativity, innovation, and smart execution. From the start, our focus has been on delivering impactful, result-driven services that help businesses grow.'),
  (2026, 'Growth & Future Expansion', 
   'Quick Kaam continues to expand its creative and technical capabilities, offering innovative solutions in branding, media production, website development, and digital marketing — becoming a trusted leader in digital media.');

SELECT '✅ Quick Kaam company data seeded successfully!' as status;
