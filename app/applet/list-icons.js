const fs = require('fs');
const files = fs.readdirSync('node_modules/simple-icons/icons');
console.log(files.filter(f => /azure|service|tanium|beyond|directory|window|putty|winscp|moba|python|linux|github|docker|postgres|react|typescript|vercel|supabase|splunk|crowdstrike/i.test(f)).join('\n'));
