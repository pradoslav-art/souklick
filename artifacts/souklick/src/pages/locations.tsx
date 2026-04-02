import { useState } from "react";
import { 
  useGetLocations,
  useCreateLocation,
  getGetLocationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin, Star, MessageSquare, ExternalLink, Loader2, Building } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().optional(),
  googlePlaceId: z.string().optional(),
  zomatoRestaurantId: z.string().optional(),
});

export default function Locations() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations, isLoading } = useGetLocations({ 
    query: { queryKey: getGetLocationsQueryKey() } 
  });
  
  const createLocation = useCreateLocation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      googlePlaceId: "",
      zomatoRestaurantId: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createLocation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLocationsQueryKey() });
          toast({ title: "Location Added", description: "Successfully added new location." });
          setIsModalOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to add location." });
        }
      }
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Locations</h1>
          <p className="text-muted-foreground">Manage your properties and track individual performance.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Location
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p>Loading locations...</p>
        </div>
      ) : locations?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-card/50">
          <Building className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Add your first restaurant location to start managing its reviews and reputation.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Add First Location</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations?.map((location) => (
            <Card key={location.id} className="overflow-hidden border-border hover:shadow-md transition-all">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">{location.name}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-start gap-1 max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="truncate">{location.address || "No address provided"}</span>
                    </p>
                  </div>
                  <Badge variant={location.isActive ? "default" : "secondary"} className={location.isActive ? "bg-green-100 text-green-800 hover:bg-green-100 shadow-none border-none" : ""}>
                    {location.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-3 divide-x border-b bg-card text-xs sm:text-sm">
                  <div className="p-4 flex flex-col items-center text-center">
                    <span className="text-xs text-muted-foreground font-medium uppercase mb-1">Rating</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold">{location.averageRating?.toFixed(1) || "-"}</span>
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                  </div>
                  <div className="p-4 flex flex-col items-center text-center">
                    <span className="text-xs text-muted-foreground font-medium uppercase mb-1">Reviews</span>
                    <span className="text-xl font-bold">{location.reviewCount}</span>
                  </div>
                  <div className="p-4 flex flex-col items-center text-center">
                    <span className="text-xs text-muted-foreground font-medium uppercase mb-1">Response Rate</span>
                    <span className={`text-xl font-bold ${location.responseRate > 80 ? "text-green-600" : location.responseRate < 50 ? "text-destructive" : ""}`}>
                      {location.responseRate}%
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-muted/10 flex justify-between items-center">
                  <div className="flex gap-2">
                    {location.googlePlaceId && <Badge variant="outline" className="text-xs bg-white">Google</Badge>}
                    {location.zomatoRestaurantId && <Badge variant="outline" className="text-xs bg-white">Zomato</Badge>}
                    {location.tripadvisorLocationId && <Badge variant="outline" className="text-xs bg-white">TripAdvisor</Badge>}
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary gap-1">
                    Manage <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Add a new restaurant location to track its reviews.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Saffron Kitchen Downtown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Full street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-medium text-foreground">Platform IDs (Optional)</h4>
                <p className="text-xs text-muted-foreground">Provide platform IDs to connect review sources.</p>
                
                <FormField
                  control={form.control}
                  name="googlePlaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Google Place ID</FormLabel>
                      <FormControl>
                        <Input placeholder="ChIJ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zomatoRestaurantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Zomato ID</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createLocation.isPending}>
                  {createLocation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Location
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}