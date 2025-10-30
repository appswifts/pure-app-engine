import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Orders = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Orders are received via WhatsApp</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;