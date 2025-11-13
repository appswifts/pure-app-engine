import { Component as GradientBarHero } from "@/components/ui/gradient-bar-hero-section";
import { Features } from "@/components/ui/features-4";
import FooterSection from "@/components/ui/footer";

const HeroLanding = () => {
  return (
    <div className="min-h-screen">
      {/* Gradient Bar Hero Section */}
      <GradientBarHero />

      {/* Features Section */}
      <Features />

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default HeroLanding;
