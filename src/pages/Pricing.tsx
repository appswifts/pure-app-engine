import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <p>$29/month - Basic Plan</p>
          <Button>Get Started</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pricing;