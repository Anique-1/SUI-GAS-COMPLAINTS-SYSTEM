import { NextRequest, NextResponse } from 'next/server';

// Server-side Geocoding & Reverse-Geocoding Proxy with compliant User-Agent
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action'); // 'search' | 'reverse'
    const q = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    const headers = {
      'User-Agent': 'SNGPL-Emergency-GIS-Portal/1.0 (Pakistan Gas Emergency Dispatch; info@sngpl.com.pk)',
      'Accept-Language': 'en',
    };

    if (action === 'search') {
      if (!q) {
        return NextResponse.json({ error: 'Query parameter q is required.' }, { status: 400 });
      }

      const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=pk&limit=6`;
      const response = await fetch(osmUrl, { headers });

      if (!response.ok) {
        return NextResponse.json({ results: [] });
      }

      const results = await response.json();
      return NextResponse.json({ results: Array.isArray(results) ? results : [] });
    } else if (action === 'reverse') {
      if (!lat || !lon) {
        return NextResponse.json({ error: 'lat and lon are required for reverse geocoding.' }, { status: 400 });
      }

      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;
      const response = await fetch(osmUrl, { headers });

      if (!response.ok) {
        return NextResponse.json({ address: null });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } else if (action === 'ip') {
      try {
        const ipRes = await fetch('https://ipwho.is/');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && ipData.success !== false && ipData.latitude && ipData.longitude) {
            return NextResponse.json({
              latitude: ipData.latitude,
              longitude: ipData.longitude,
              city: ipData.city || 'Identified City',
              region: ipData.region || 'Punjab',
              country: ipData.country || 'Pakistan',
              accuracy: 1500,
            });
          }
        }
      } catch (err: any) {
        console.warn('IP geocode error:', err?.message);
      }
      return NextResponse.json({ error: 'IP location unavailable' }, { status: 404 });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use search, reverse, or ip.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Geocode proxy error:', error);
    return NextResponse.json({ error: error.message || 'Geocoding service unavailable' }, { status: 500 });
  }
}
