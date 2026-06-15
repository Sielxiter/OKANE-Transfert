export interface CountryOption {
	code: string;
	name: string;
	phoneCode?: string | null;
}

export interface CountrySeedRow {
	COUNTRY: string;
	COUNTRY_CODE: string;
	CURRENCY_CODE: string;
	NAME_OF_CURRENCY: string;
}

export function mapCountryOptions(rows: CountrySeedRow[]): CountryOption[] {
	const seen = new Set<string>();
	const options: CountryOption[] = [];

	for (const row of rows) {
		const code = normalizeCode(row?.COUNTRY_CODE);
		const name = normalizeName(row?.COUNTRY);
		if (!code || code === '-' || seen.has(code)) {
			continue;
		}
		seen.add(code);
		options.push({ code, name });
	}

	return options.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export function searchCountryOptions(options: CountryOption[], query: string, limit = 3): CountryOption[] {
	const term = normalizeQuery(query);
	if (!term) {
		return options.slice(0, limit);
	}

	return options
		.filter((option) => {
			const code = normalizeQuery(option.code);
			const name = normalizeQuery(option.name);
			return code.includes(term) || name.includes(term);
		})
		.slice(0, limit);
}

export function formatCountryLabel(option: CountryOption | null | undefined): string {
	if (!option) {
		return '—';
	}
	return `${option.name} (${option.code})`;
}

function normalizeCode(value: string | null | undefined): string {
	return (value ?? '').trim().toUpperCase();
}

function normalizeName(value: string | null | undefined): string {
	return (value ?? '').trim();
}

function normalizeQuery(value: string | null | undefined): string {
	return (value ?? '').trim().toUpperCase();
}
