import { Component as GradientBarHero } from "@/components/ui/gradient-bar-hero-section";
import { Features } from "@/components/ui/features-4";
import FooterSection from "@/components/ui/footer";
import { Button, Card, CardBody } from "@heroui/react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

const HeroLanding = () => {
  return (
    <div className="min-h-screen">
      {/* Gradient Bar Hero Section */}
      <GradientBarHero />

      {/* Features Section */}
      <Features />

      {/* Social Proof Section */}
      <section className="container mx-auto px-4 py-20 bg-gray-50 dark:bg-gray-800">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardBody className="py-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-4">
                Ready to Go Digital?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of restaurants already using MenuForest to serve customers better
              </p>
              <Button
                as={Link}
                to="/auth"
                size="lg"
                className="bg-white text-blue-600 font-semibold hover:bg-gray-100"
                endContent={<Zap className="w-5 h-5" />}
              >
                Start Your Free Trial
              </Button>
            </motion.div>
          </CardBody>
        </Card>
      </section>

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default HeroLanding;
