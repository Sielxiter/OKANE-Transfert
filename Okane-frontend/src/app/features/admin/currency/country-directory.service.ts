import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { CountrySeedRow, mapCountryOptions, type CountryOption } from './country-directory';

@Injectable({ providedIn: 'root' })
export class CountryDirectoryService {
	private readonly _http = inject(HttpClient);
	private readonly _countries$ = this._http
		.get<CountrySeedRow[]>('/countries-with-currencies.json')
		.pipe(
			map((rows) => mapCountryOptions(rows ?? [])),
			shareReplay({ bufferSize: 1, refCount: true }),
		);

	public listCountries(): Observable<CountryOption[]> {
		return this._countries$;
	}
}
