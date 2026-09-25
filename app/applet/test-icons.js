const icons = [
  'cisco', 'microsoftazure', 'azure', 'tanium', 'beyondtrust', 'activedirectory',
  'microsoft', 'windows', 'windows11', 'windows8', 'putty', 'winscp', 'mobaxterm',
  'python', 'linux', 'github', 'docker', 'postgresql', 'react', 'typescript', 'vercel',
  'supabase', 'splunk', 'crowdstrike', 'servicenow'
];

async function checkIcons() {
  for (const icon of icons) {
    try {
      const res = await fetch(`https://cdn.simpleicons.org/${icon}/white`);
      console.log(`${icon}: ${res.status}`);
    } catch (e) {
      console.log(`${icon}: error ${e.message}`);
    }
  }
}

checkIcons();
