import crypto from 'crypto';

/**
 * Cloudflare DNS automation script
 * Generates 50 random subdomains (CNAME) pointing to the main hosting URL.
 */

async function generateMirrors() {
  const token = process.env.CLOUDFLARE_TOKEN;
  const zoneId = process.env.ZONE_ID;
  const mainUrl = process.env.MAIN_HOSTING_URL;

  if (!token || !zoneId || !mainUrl) {
    console.error('Missing required environment variables: CLOUDFLARE_TOKEN, ZONE_ID, or MAIN_HOSTING_URL');
    process.exit(1);
  }

  console.log(`Starting mirrors generation for: ${mainUrl}`);

  const subdomains = [];
  while (subdomains.length < 50) {
    const str = crypto.randomBytes(3).toString('hex'); // 6 character string
    if (!subdomains.includes(str)) {
      subdomains.push(str);
    }
  }

  const generatedList = [];

  for (const sub of subdomains) {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'CNAME',
          name: sub,
          content: mainUrl,
          ttl: 1, // Auto
          proxied: true
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`Successfully created: ${sub}.${mainUrl}`);
        generatedList.push({ subdomain: sub, url: `${sub}.${mainUrl}`, success: true });
      } else {
        console.error(`Failed to create ${sub}:`, result.errors);
      }
    } catch (error) {
      console.error(`Error creating record for ${sub}:`, error);
    }
    
    // Tiny delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('Finished Cloudflare register requests.');

  if (generatedList.length > 0) {
    console.log(`Reporting ${generatedList.length} successful mirrors to server...`);
    try {
      const serverUrl = mainUrl.includes('localhost') || mainUrl.includes('127.0.0.1') ? `http://${mainUrl}` : `https://${mainUrl}`;
      const reportResponse = await fetch(`${serverUrl}/api/admin/save-mirrors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: '$#GS29gs67',
          mirrors: generatedList
        })
      });

      const reportResult = await reportResponse.json();
      if (reportResult.success) {
        console.log(`Successfully synced ${generatedList.length} mirrors with centralized database!`);
      } else {
        console.error('Failed to sync mirrors with server:', reportResult.error || reportResult);
      }
    } catch (reportErr) {
      console.error('Network error reporting mirrors to server:', reportErr);
    }
  }

  console.log('Finished processing mirrors.');
}

generateMirrors();
