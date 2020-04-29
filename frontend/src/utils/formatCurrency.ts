const formatCurrency = (value: number, type: string): string => {
    const valueWithSignal = type === 'income' ? value : -value;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(valueWithSignal);
};

export default formatCurrency;
