import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-3xl mx-auto space-y-8">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Your Blank Canvas
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Start building something amazing
          </p>
        </div>
        
        <div className="flex gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <Button size="lg" className="rounded-full">
            Get Started
          </Button>
          <Button size="lg" variant="outline" className="rounded-full">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
