import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ShopFiltersProps {
    categories: string[];
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    priceSliderValue: number[];
    setPriceSliderValue: (value: number[]) => void;
    maxProductPrice: number;
    manufacturers: string[];
    selectedManufacturer: string;
    setSelectedManufacturer: (value: string) => void;
    conditions: string[];
    selectedCondition: string;
    setSelectedCondition: (value: string) => void;
    inStockOnly: boolean;
    setInStockOnly: (value: boolean) => void;
    featuredOnly: boolean;
    setFeaturedOnly: (value: boolean) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
}

const ShopFilters = ({
    categories,
    selectedCategory,
    setSelectedCategory,
    priceSliderValue,
    setPriceSliderValue,
    maxProductPrice,
    manufacturers,
    selectedManufacturer,
    setSelectedManufacturer,
    conditions,
    selectedCondition,
    setSelectedCondition,
    inStockOnly,
    setInStockOnly,
    featuredOnly,
    setFeaturedOnly,
    clearFilters,
    hasActiveFilters
}: ShopFiltersProps) => {
    const { formatPrice } = useCurrency();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-lg mb-4">Filter By</h3>

                {/* Category Filter */}
                <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">CATEGORY</h4>
                    <div className="space-y-1">
                        {categories.map((category, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedCategory(category === "All Products" ? "all" : category)}
                                className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${(
                                    selectedCategory === category ||
                                    (selectedCategory === "all" && category === "All Products")
                                )
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price Range Filter */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Price Range</h4>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                            {formatPrice(priceSliderValue[0])} - {formatPrice(priceSliderValue[1])}
                        </Badge>
                    </div>
                    <Slider
                        defaultValue={[0, maxProductPrice]}
                        max={maxProductPrice}
                        step={10}
                        value={priceSliderValue}
                        onValueChange={setPriceSliderValue}
                        className="mb-6"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Min</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">GH₵</span>
                                <Input
                                    type="number"
                                    value={priceSliderValue[0]}
                                    onChange={(e) => setPriceSliderValue([parseInt(e.target.value) || 0, priceSliderValue[1]])}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Max</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">GH₵</span>
                                <Input
                                    type="number"
                                    value={priceSliderValue[1]}
                                    onChange={(e) => setPriceSliderValue([priceSliderValue[0], parseInt(e.target.value) || maxProductPrice])}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manufacturer Filter */}
                {manufacturers.length > 1 && (
                    <div className="mb-6">
                        <h4 className="font-semibold mb-3 text-sm text-muted-foreground">MANUFACTURER</h4>
                        <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Manufacturers" />
                            </SelectTrigger>
                            <SelectContent>
                                {manufacturers.map((manufacturer, index) => (
                                    <SelectItem key={index} value={manufacturer === "All" ? "all" : manufacturer}>
                                        {manufacturer}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Condition Filter */}
                {conditions.length > 1 && (
                    <div className="mb-6">
                        <h4 className="font-semibold mb-3 text-sm text-muted-foreground">CONDITION</h4>
                        <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Conditions" />
                            </SelectTrigger>
                            <SelectContent>
                                {conditions.map((condition, index) => (
                                    <SelectItem key={index} value={condition === "All" ? "all" : condition}>
                                        {condition}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Stock Availability */}
                <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">AVAILABILITY</h4>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={inStockOnly}
                            onChange={(e) => setInStockOnly(e.target.checked)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm">In Stock Only</span>
                    </label>
                </div>

                {/* Featured Products */}
                <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">SPECIAL</h4>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={featuredOnly}
                            onChange={(e) => setFeaturedOnly(e.target.checked)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm">Featured Products Only</span>
                    </label>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button
                        variant="outline"
                        className="w-full mt-6"
                        onClick={clearFilters}
                    >
                        Clear All Filters
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ShopFilters;
