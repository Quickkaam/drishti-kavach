const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: website, error } = await supabase
    .from('websites')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return;
  }

  console.log('Website data:', website);

  try {
    const apiUrl = process.env.API_URL || 'https://your-api.onrender.com';
    const settings = website.settings || {};
    const hasGA = !!settings.ga_id;
    const hasSEO = !!settings.seo;

    let snippet = `<!-- SDK -->`;

    if (hasSEO) {
      const seo = settings.seo;
      console.log('SEO data:', seo);
      
      let s = '';
      s += `if('${seo.title || ''}') document.title = '${(seo.title || '').replace(/'/g, "\\'")}';\n`;
      s += `setMeta('description', '${(seo.description || '').replace(/'/g, "\\'")}', false);\n`;
      
      console.log('Snippet generated without error');
    }
  } catch (e) {
    console.error('Crash in snippet generation:', e);
  }
}

test();
