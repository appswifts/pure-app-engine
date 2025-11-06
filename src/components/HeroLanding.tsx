import { Button, Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { Link } from "react-router-dom";
import { QrCode, MessageSquare, Zap, Shield, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

const HeroLanding = () => {
  const features = [
    {
      icon: QrCode,
      title: "Instant QR Codes",
      description: "Generate unique QR codes for each table. Customers scan and see your menu instantly.",
      color: "primary"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Orders",
      description: "Customers order directly via WhatsApp with pre-filled messages. No app downloads needed.",
      color: "success"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Set up your entire menu in minutes. Beautiful, mobile-optimized design out of the box.",
      color: "warning"
    }
  ];

  const stats = [
    { value: "5min", label: "Setup Time" },
    { value: "+40%", label: "Order Efficiency" },
    { value: "100%", label: "Contactless" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="MenuForest" className="h-10 w-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MenuForest
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
            <Button
              as={Link}
              to="/auth"
              variant="flat"
              color="primary"
              size="sm"
            >
              Sign In
            </Button>
            <Button
              as={Link}
              to="/auth"
              color="primary"
              size="sm"
              endContent={<Zap className="w-4 h-4" />}
            >
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Chip
              color="primary"
              variant="flat"
              size="sm"
              className="mb-4"
            >
              ✨ Trusted by 100+ restaurants
            </Chip>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent leading-tight">
              Transform Your Restaurant with Digital QR Menus
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Create beautiful, contactless menus that customers can access instantly. 
              Boost orders with direct WhatsApp integration and modern design.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                as={Link}
                to="/auth"
                color="primary"
                size="lg"
                className="font-semibold"
                endContent={<Zap className="w-5 h-5" />}
              >
                Start Free Trial
              </Button>
              <Button
                as={Link}
                to="/menu/demo/table-1"
                variant="bordered"
                size="lg"
                className="font-semibold"
              >
                View Demo Menu
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
              <img
                src="/restaurant-hero.png"
                alt="QR Menu Demo"
                className="rounded-2xl shadow-lg"
              />
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg">
                <QrCode className="w-12 h-12 text-blue-600" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-4 shadow-lg">
                <MessageSquare className="w-12 h-12 text-green-600" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Why Choose QR Menu?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to create professional digital menus that customers love
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-col items-start gap-3 pb-0">
                  <div className={`p-3 rounded-xl bg-${feature.color}-100 text-${feature.color}-600`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="container mx-auto px-4 py-20">
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
                Join hundreds of restaurants already using QR Menu to serve customers better
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
      <footer className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="MenuForest" className="h-8 w-8" />
              <span className="font-bold">MenuForest</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2024 MenuForest. Making restaurant dining better, one scan at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HeroLanding;
