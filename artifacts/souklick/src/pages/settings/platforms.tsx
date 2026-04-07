import { ExternalLink, CheckCircle2, Circle } from "lucide-react";
import { SiGoogle, SiZomato, SiTripadvisor } from "react-icons/si";
import { useGetLocations, getGetLocationsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const PLATFORMS = [
  {
    id: "google",
    name: "Google Business",
    Icon: SiGoogle,
    color: "#4285F4",
    bg: "bg-blue-50",
    field: "googlePlaceId" as const,
    idLabel: "Google Place ID",
    idExample: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    howToFind: "Search your business on Google Maps → click the business name → click 'Share' → copy the Place ID from the URL (starts with ChIJ…).",
    docsUrl: "https://developers.google.com/maps/documentation/javascript/place-id",
  },
  {
    id: "zomato",
    name: "Zomato",
    Icon: SiZomato,
    color: "#E23744",
    bg: "bg-red-50",
    field: "zomatoRestaurantId" as const,
    idLabel: "Zomato Restaurant ID",
    idExample: "18308870",
    howToFind: "Open your restaurant's Zomato page. The Restaurant ID is the number in the URL — e.g. zomato.com/dubai/your-restaurant-18308870.",
    docsUrl: "https://www.zomato.com",
  },
  {
    id: "tripadvisor",
    name: "TripAdvisor",
    Icon: SiTripadvisor,
    color: "#00AF87",
    bg: "bg-emerald-50",
    field: "tripadvisorLocationId" as const,
    idLabel: "TripAdvisor Location ID",
    idExample: "d12345678",
    howToFind: "Go to your restaurant on TripAdvisor. The Location ID is in the URL — e.g. tripadvisor.com/Restaurant_Review-gXXX-dYYYYYYYY — the number after '-d' is your ID.",
    docsUrl: "https://www.tripadvisor.com",
  },
];

export default function PlatformSettings() {
  const { data: locations } = useGetLocations({ query: { queryKey: getGetLocationsQueryKey() } });

  // Which platforms have at least one location connected
  const connectedPlatforms = new Set<string>();
  locations?.forEach((loc) => {
    if (loc.googlePlaceId) connectedPlatforms.add("google");
    if (loc.zomatoRestaurantId) connectedPlatforms.add("zomato");
    if ((loc as any).tripadvisorLocationId) connectedPlatforms.add("tripadvisor");
  });

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Platform Connections</h2>
        <p className="text-sm text-muted-foreground">
          Connect review platforms to your locations so Souklick can pull in reviews automatically.
          Platform IDs are added per location — you can set them when adding or editing a location.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {PLATFORMS.map((p) => {
          const connected = connectedPlatforms.has(p.id);
          return (
            <div key={p.id} className="bg-card border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${p.bg} flex items-center justify-center shrink-0`}>
                  <p.Icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    {connected ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Circle className="w-3.5 h-3.5" /> Not connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{p.howToFind}</p>
                  <div className="bg-muted/50 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">{p.idLabel} — example</p>
                    <code className="text-xs font-mono text-foreground">{p.idExample}</code>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/locations">
                      <Button size="sm" variant={connected ? "outline" : "default"} className="text-xs h-8">
                        {connected ? "Manage locations" : "Add to a location"}
                      </Button>
                    </Link>
                    <a
                      href={p.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      Visit {p.name} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border border-dashed rounded-xl p-5 text-center">
        <p className="text-sm text-muted-foreground mb-1 font-medium">Need help or a custom integration?</p>
        <p className="text-sm text-muted-foreground">
          Email us at{" "}
          <a href="mailto:souklickuae@gmail.com" className="text-primary hover:underline underline-offset-4">
            souklickuae@gmail.com
          </a>{" "}
          and we'll get you set up.
        </p>
      </div>
    </div>
  );
}
