import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'GHS' | 'USD';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    exchangeRate: number; // 1 USD = X GHS
    formatPrice: (amountInGhs: number) => string;
    convertPrice: (amountInGhs: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const [currency, setCurrency] = useState<Currency>('GHS');
    const [exchangeRate, setExchangeRate] = useState(15.5); // Default: 1 USD = 15.5 GHS

    useEffect(() => {
        const savedCurrency = localStorage.getItem('currency') as Currency;
        if (savedCurrency) {
            setCurrency(savedCurrency);
        }

        const fetchExchangeRate = async () => {
            const CACHE_KEY = 'exchange_rate_cache';
            const cache = localStorage.getItem(CACHE_KEY);
            const now = new Date().getTime();

            // Use cached rate if it exists and is less than 24 hours old
            if (cache) {
                const { rate, timestamp } = JSON.parse(cache);
                if (now - timestamp < 24 * 60 * 60 * 1000) {
                    setExchangeRate(rate);
                    return;
                }
            }

            try {
                const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
                if (!apiKey) return;

                const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/GHS`);
                const data = await response.json();

                if (data.result === 'success') {
                    const rate = data.conversion_rate;
                    setExchangeRate(rate);
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        rate,
                        timestamp: now
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch exchange rate:", error);
                // Fallback is already set to default 15.5
            }
        };

        fetchExchangeRate();
    }, []);

    const handleSetCurrency = (c: Currency) => {
        setCurrency(c);
        localStorage.setItem('currency', c);
    };

    const convertPrice = (amountInGhs: number) => {
        if (currency === 'GHS') {
            return amountInGhs;
        } else {
            return amountInGhs / exchangeRate;
        }
    };

    const formatPrice = (amountInGhs: number) => {
        if (currency === 'GHS') {
            return `GH₵ ${amountInGhs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            const amountInUsd = amountInGhs / exchangeRate;
            return `$ ${amountInUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency: handleSetCurrency,
            exchangeRate,
            formatPrice,
            convertPrice
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
