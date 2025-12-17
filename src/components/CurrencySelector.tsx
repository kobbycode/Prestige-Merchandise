import { useCurrency } from "@/contexts/CurrencyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CurrencySelector = () => {
    const { currency, setCurrency } = useCurrency();

    return (
        <Select value={currency} onValueChange={(value: "GHS" | "USD") => setCurrency(value)}>
            <SelectTrigger className="w-[80px] h-8 text-xs bg-transparent border-gray-200">
                <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="GHS">GHS</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
        </Select>
    );
};

export default CurrencySelector;
