const fs = require('fs');
const path = require('path');

const files = [
  'src/components/ContentEditors.tsx',
  'src/components/CorporateEditors.tsx',
  'src/app/admin/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/browse/page.tsx',
  'src/app/profile/page.tsx',
  'src/app/report/page.tsx',
  'src/app/messages/page.tsx',
  'src/app/page.tsx',
  'src/app/login/page.tsx',
  'src/app/register/page.tsx'
];

function processEditors(content) {
  return content
    // Light to Responsive
    .replace(/(?<!dark:)bg-slate-50\b/g, 'bg-slate-50 dark:bg-slate-900/50')
    .replace(/(?<!dark:)bg-white\b/g, 'bg-white dark:bg-slate-800')
    .replace(/(?<!dark:)text-slate-900\b/g, 'text-slate-900 dark:text-white')
    .replace(/(?<!dark:)text-slate-700\b/g, 'text-slate-700 dark:text-slate-300')
    .replace(/(?<!dark:)border-slate-200\b/g, 'border-slate-200 dark:border-slate-700/50')
    .replace(/(?<!dark:)border-slate-100\b/g, 'border-slate-100 dark:border-slate-800')
}

function processDarkPages(content) {
  return content
    // Dark to Responsive
    .replace(/(?<!dark:)bg-slate-950\b/g, 'bg-slate-50 dark:bg-slate-950')
    .replace(/(?<!dark:)bg-slate-900\/60\b/g, 'bg-white/80 dark:bg-slate-900/60')
    .replace(/(?<!dark:)bg-slate-900\/40\b/g, 'bg-white/60 dark:bg-slate-900/40')
    .replace(/(?<!dark:)bg-slate-900\/80\b/g, 'bg-white/90 dark:bg-slate-900/80')
    .replace(/(?<!dark:)bg-slate-900\b/g, 'bg-white dark:bg-slate-900')
    
    .replace(/(?<!dark:)bg-slate-800\/50\b/g, 'bg-slate-100/50 dark:bg-slate-800/50')
    .replace(/(?<!dark:)bg-slate-800\b/g, 'bg-slate-100 dark:bg-slate-800')
    
    .replace(/(?<!dark:)text-white\b/g, 'text-slate-900 dark:text-white')
    .replace(/(?<!dark:)text-slate-400\b/g, 'text-slate-600 dark:text-slate-400')
    .replace(/(?<!dark:)text-slate-300\b/g, 'text-slate-700 dark:text-slate-300')
    
    .replace(/(?<!dark:)border-slate-800\/50\b/g, 'border-slate-200 dark:border-slate-800/50')
    .replace(/(?<!dark:)border-slate-800\/30\b/g, 'border-slate-200 dark:border-slate-800/30')
    .replace(/(?<!dark:)border-slate-800\b/g, 'border-slate-200 dark:border-slate-800')
    .replace(/(?<!dark:)border-slate-700\/50\b/g, 'border-slate-200 dark:border-slate-700/50')
    .replace(/(?<!dark:)border-slate-700\b/g, 'border-slate-200 dark:border-slate-700')
}

files.forEach(file => {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) {
    console.log(`Skipping ${p}`);
    return;
  }
  let content = fs.readFileSync(p, 'utf8');
  
  if (file.includes('ContentEditors') || file.includes('CorporateEditors')) {
    content = processEditors(content);
  } else {
    // Both light and dark replacements for admin page since it has the CMS editor wrapping divs
    if (file.includes('admin')) {
      content = processEditors(content);
    }
    content = processDarkPages(content);
  }

  fs.writeFileSync(p, content, 'utf8');
  console.log(`Updated ${file}`);
});
