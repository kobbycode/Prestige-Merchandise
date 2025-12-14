import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

const Products = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">Manage your product inventory</p>
                </div>
                <Button className="gap-2 text-white">
                    <Plus className="h-4 w-4" /> Add Product
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Product List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-10 text-muted-foreground">
                        No products found. Click "Add Product" to create one.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Products;
