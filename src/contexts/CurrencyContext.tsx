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

        // In a real app, you might fetch the live exchange rate here
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
