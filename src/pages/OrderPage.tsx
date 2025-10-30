import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, MapPin, Phone, Clock, Wifi } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  whatsappNumber: string;
  logoUrl: string | null;
}

interface RestaurantTable {
  id: string;
  tableNumber: string;
  tableName: string | null;
  restaurant: Restaurant;
}

const OrderPage = () => {
  const navigate = useNavigate();
  const { restaurantId, tableId } = useParams();

  useEffect(() => {
    // Redirect to the correct menu URL format
    if (restaurantId && tableId) {
      navigate(`/menu/${restaurantId}/${tableId}`, { replace: true });
    }
  }, [restaurantId, tableId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to menu...</p>
      </div>
    </div>
  );
};

export default OrderPage;