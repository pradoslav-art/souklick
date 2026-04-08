export interface PlaceRating {
  name: string;
  rating: number | null;
  reviewCount: number | null;
}

export async function fetchPlaceRating(googlePlaceId: string): Promise<PlaceRating | null> {
  const apiKey = process.env["GOOGLE_PLACES_API_KEY"];
  if (!apiKey) return null;

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(googlePlaceId)}&fields=name,rating,user_ratings_total&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json() as any;
  if (data.status !== "OK" || !data.result) return null;

  return {
    name: data.result.name ?? "",
    rating: data.result.rating ?? null,
    reviewCount: data.result.user_ratings_total ?? null,
  };
}
