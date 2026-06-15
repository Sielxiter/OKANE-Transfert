export interface CurrencyOption {
	id: number;
	name: string;
	symbol: string;
	active?: boolean;
}

export function searchCurrencyOptions(options: CurrencyOption[], query: string, limit = 3): CurrencyOption[] {
	const term = normalizeQuery(query);
	const filtered = options.filter((option) => {
		if (!term) {
			return true;
		}
		return normalizeQuery(option.name).includes(term) || normalizeQuery(option.symbol).includes(term);
	});

	return filtered.sort((a, b) => a.name.localeCompare(b.name, 'fr')).slice(0, limit);
}

export function formatCurrencyLabel(option: CurrencyOption | null | undefined): string {
	if (!option) {
		return '—';
	}
	return `${option.name} (${option.symbol})`;
}

function normalizeQuery(value: string | null | undefined): string {
	return (value ?? '').trim().toLowerCase();
}
