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
      } else {
        console.error(`Failed to create ${sub}:`, result.errors);
      }
    } catch (error) {
      console.error(`Error creating record for ${sub}:`, error);
    }
    
    // Tiny delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('Finished processing mirrors.');
}

generateMirrors();
