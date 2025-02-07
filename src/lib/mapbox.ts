// lib/mapbox.ts
export async function reverseGeocodeFromMapbox(lat: number, lng: number): Promise<string> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("Mapbox token missing");
    return "Mapbox token missing";
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error("Failed to fetch address from Mapbox");
    return "Failed to fetch address";
  }

  const data = await res.json();
  return data.features?.[0]?.place_name || "No address found";
}
