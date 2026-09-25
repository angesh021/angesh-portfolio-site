import https from 'node:https';

const icons = [
  'cisco', 'microsoftazure', 'azure', 'tanium', 'beyondtrust', 'activedirectory',
  'microsoft', 'windows', 'windows11', 'windows8', 'putty', 'winscp', 'mobaxterm',
  'python', 'linux', 'github', 'docker', 'postgresql', 'react', 'typescript', 'vercel',
  'supabase', 'splunk', 'crowdstrike', 'servicenow'
];

icons.forEach((icon) => {
  https.get(`https://cdn.simpleicons.org/${icon}/white`, (res) => {
    console.log(`${icon}: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`${icon} error: ${e.message}`);
  });
});
