const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else if (file.endsWith('route.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = getFiles(path.join('src', 'app', 'api', 'admin', 'cms'));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import \{ getServerSession \} from "next-auth\/next";\r?\nimport \{ authOptions \} from "@\/app\/api\/auth\/\[\.\.\.nextauth\]\/route";/, 'import { requireAdmin } from "@/lib/auth";');
  content = content.replace(/const session = await getServerSession\(authOptions\);\r?\n\s*if \(\!session \|\| session\.user\.role \!\=\= "admin"\) \{\r?\n\s*return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\);\r?\n\s*\}/, 'await requireAdmin();');
  fs.writeFileSync(f, content);
});
console.log('Fixed API routes:', files);
