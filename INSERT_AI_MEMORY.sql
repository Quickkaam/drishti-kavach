-- ============================================
-- Drishti Kavach — Insert Quick Kaam Info into AI Memory
-- Run this in Supabase SQL Editor
-- ============================================

-- Insert company overview information
INSERT INTO ai_memory (user_id, memory) VALUES
  (1, 'Quick Kaam is a digital marketing agency founded in 2026, based in Patna, Bihar. Office: Azad Path, Gali number 3, Chandmari Road, Kankarbagh, Patna, Bihar - 800020. Contact: contactquickkaam@gmail.com, supportquickkaam@gmail.com. Phone: +91 62024 69886. Website: quickkaam.in'),
  
  -- Insert team member information
  (1, 'Sobhit Mishra is the Founder & Director of Quick Kaam. Expertise in media strategy, digital communication, political branding, content production, and creative storytelling.'),
  (1, 'Richa Kumari is the Co-Founder & Managing Director of Quick Kaam. Handles structural execution, management operations, and overall administrative capabilities for business growth.'),
  (1, 'Giridhar Pai is the Head of Cyber Security & Senior Web Developer at Quick Kaam. Manages end-to-end technical deployment, web engineering, custom software development, and core web safety parameters.'),
  (1, 'Rounak Kumar is the Manager & HR Head at Quick Kaam. Handles organizational workflow, internal management, human resources, and coordination across teams.'),
  
  -- Insert mission and vision
  (1, 'Quick Kaam Mission: Empower businesses, brands, and individuals through innovative digital solutions, creative storytelling, and strategic marketing. Deliver fast, effective, and result-driven services that help clients build a strong digital presence, maximize growth, and achieve long-term success.'),
  (1, 'Quick Kaam Vision: Become a trusted leader in digital innovation and media solutions by transforming ideas into impactful experiences. Redefine modern marketing through creativity, technology, and smart strategies, helping brands grow with confidence in an ever-evolving digital world.'),
  
  -- Insert services
  (1, 'Quick Kaam Services: 1) Branding & Growth Architecture - brand identity formulation, logo curation, graphic design, and long-term business scalability strategies. 2) Digital Marketing & SEO - complete 360° digital campaign planning, organic SEO management, and targeted lead generation. 3) Content Creation & Media Production - copywriting, high-conversion content writing, social media management (SMM), and promotional video/media planning. 4) Web Solutions & Cyber Security - end-to-end website design, custom software/web deployment, and foundational web security parameters. 5) Political PR Services - localized campaign strategizing, public relations management, and target-audience communication engineering. 6) Legal Advisory & Event Planning - professional legal compliance advice alongside structural brand-event coordination.'),
  
  -- Insert company journey
  (1, 'Quick Kaam Milestones: 2025 - Foundation & Vision. 2026 - Growth & Future Expansion, expanding creative and technical capabilities in branding, media production, website development, and digital marketing.');

SELECT '✅ AI Memory seeded with Quick Kaam company information!' as status;
