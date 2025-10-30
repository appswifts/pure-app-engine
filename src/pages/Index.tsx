import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { QrCode, Smartphone, Zap, ArrowRight, Star, CheckCircle, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BrandLogo from "@/components/BrandLogo";
import { User as SupabaseUser } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    // Check initial session
    const checkUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5">
      {/* Header */}
      <header className="border-b backdrop-blur-sm sticky top-0 z-50 shadow-warm" style={{background: '#ffeac5'}}>
        <div className="container mx-auto px-4 py-2 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <BrandLogo size="responsive" />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {loading ? (
              <div className="h-6 w-16 sm:h-8 sm:w-20 bg-gray-300 animate-pulse rounded" />
            ) : user ? (
              <>
                <Button variant="outline" className="border-gray-600 text-gray-800 hover:bg-gray-100 text-xs sm:text-sm px-2 sm:px-4" onClick={() => navigate("/dashboard/overview")}>
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Dash</span>
                </Button>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200">
                    <AvatarFallback className="bg-gray-200 text-gray-700">
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs sm:text-sm text-gray-700 hidden md:block">
                    {user.email}
                  </span>
                </div>
                <Button variant="ghost" className="text-gray-800 hover:bg-gray-100 p-1 sm:p-2" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="border-gray-600 text-gray-800 hover:bg-gray-100 text-xs sm:text-sm px-2 sm:px-4" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button className="bg-gray-800 text-white hover:bg-gray-700 text-xs sm:text-sm px-2 sm:px-4" onClick={() => navigate("/auth")}>
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="relative w-full h-full">
            <iframe
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full min-w-[177.77vh] min-h-[56.25vw] object-cover"
              src="https://www.youtube.com/embed/DsWKMNkvelI?autoplay=1&mute=1&loop=1&playlist=DsWKMNkvelI&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0&cc_lang_pref=en&rel=0"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Hero Background Video"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        </div>

        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <BrandLogo size="3xl" />
            </div>

            <h2 className="text-2xl md:text-4xl font-bold mb-6 text-white">
              Transform Your Restaurant with
              <span className="block text-white">Digital QR Menus</span>
            </h2>

            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Create beautiful, contactless menus that customers can access instantly. Boost orders with direct WhatsApp integration and modern design.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button onClick={() => navigate("/auth")} size="xl" variant="gradient" className="group">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button onClick={() => navigate("/menu/demo/table1")} size="xl" variant="outline">
                View Demo Menu
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5min</div>
                <div className="text-sm text-muted-foreground">Setup Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">+40%</div>
                <div className="text-sm text-muted-foreground">Order Efficiency</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Contactless</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Why Choose QR Menu?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create professional digital menus that customers love
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-card hover:shadow-elevated transition-all border-primary/10">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Instant QR Codes</CardTitle>
                <CardDescription>
                  Generate unique QR codes for each table. Customers scan and see your menu instantly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all border-primary/10">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>WhatsApp Orders</CardTitle>
                <CardDescription>
                  Customers order directly via WhatsApp with pre-filled messages. No app downloads needed.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all border-primary/10">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Set up your entire menu in minutes. Beautiful, mobile-optimized design out of the box.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Go Digital?</h3>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of restaurants already using QR Menu to serve customers better
          </p>
          <Button size="xl" variant="secondary" onClick={() => navigate("/auth")} className="group">
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BrandLogo size="sm" />
            <span className="font-bold text-lg">QR Menu</span>
          </div>
          <p className="text-muted-foreground">
            2024 QR Menu. Making restaurant dining better, one scan at a time.
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;