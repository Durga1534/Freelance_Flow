export const TAX_RATES = {
    US: {
        DEFAULT: 0,
        CA: 7.25,
        NY: 8.875,
        TX: 6.25,
        FL: 6.0,
    },
    EU: {
        DEFAULT: 20,
        DE: 19,
        FR: 20,
        IT: 22,
        ES: 21,
    },
    IN: {
        DEFAULT: 18,
        REDUCED: 12,
        LOW: 5,
    },
} as const;

export const getTaxRate = (country: keyof typeof TAX_RATES, region?: string) => {
    const countryRates = TAX_RATES[country] || {DEFAULT: 0};
    if(!region) return countryRates.DEFAULT;
    return (countryRates as any)[region] || countryRates.DEFAULT;
};

export const getAvailableRegions = (country: keyof typeof TAX_RATES) => {
    const regions = Object.keys(TAX_RATES[country]).filter(key => key !== 'DEFAULT');
    return regions;
}