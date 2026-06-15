import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export interface ApiAdminProfile {
	id: number | null;
	fullName: string | null;
	email: string | null;
	phone: string | null;
	role: string | null;
	avatarUrl: string | null;
	lastLoginAt: string | null;
}

export interface ApiAdminProfileUpdate {
	firstName?: string;
	lastName?: string;
	phone?: string;
	avatarUrl?: string;
}

export interface ApiSecuritySettings {
	twoFactorEnabled: boolean;
	activeSessionsCount: number;
	lastLoginAt: string | null;
	securityAlertsEnabled: boolean;
	accessTokenDuration: string;
	refreshTokenDuration: string;
	maxLoginAttempts: number;
	bcryptStrength: number;
}

export interface ApiSecuritySettingsUpdate {
	twoFactorEnabled?: boolean;
	securityAlertsEnabled?: boolean;
}

export interface ApiNotificationSettings {
	emailNotifications: boolean;
	systemNotifications: boolean;
	complianceAlerts: boolean;
	paymentAlerts: boolean;
	suspiciousTransferAlerts: boolean;
}

export interface ApiPreferencesSettings {
	language: string;
	theme: string;
	defaultCurrency: string;
	timezone: string;
}

export interface ApiSystemSettings {
	accessTokenDuration: string;
	refreshTokenDuration: string;
	maxLoginAttempts: number;
	bcryptStrength: number;
	maintenanceMode: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminSettingsApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/settings`;

	public getProfile(): Observable<ApiAdminProfile> {
		return this._http.get<ApiAdminProfile>(`${this._base}/profile`);
	}

	public updateProfile(payload: ApiAdminProfileUpdate): Observable<ApiAdminProfile> {
		return this._http.put<ApiAdminProfile>(`${this._base}/profile`, payload);
	}

	public getSecurity(): Observable<ApiSecuritySettings> {
		return this._http.get<ApiSecuritySettings>(`${this._base}/security`);
	}

	public updateSecurity(payload: ApiSecuritySettingsUpdate): Observable<ApiSecuritySettings> {
		return this._http.put<ApiSecuritySettings>(`${this._base}/security`, payload);
	}

	public getNotifications(): Observable<ApiNotificationSettings> {
		return this._http.get<ApiNotificationSettings>(`${this._base}/notifications`);
	}

	public updateNotifications(payload: ApiNotificationSettings): Observable<ApiNotificationSettings> {
		return this._http.put<ApiNotificationSettings>(`${this._base}/notifications`, payload);
	}

	public getPreferences(): Observable<ApiPreferencesSettings> {
		return this._http.get<ApiPreferencesSettings>(`${this._base}/preferences`);
	}

	public updatePreferences(payload: ApiPreferencesSettings): Observable<ApiPreferencesSettings> {
		return this._http.put<ApiPreferencesSettings>(`${this._base}/preferences`, payload);
	}

	public getSystemSettings(): Observable<ApiSystemSettings> {
		return this._http.get<ApiSystemSettings>(`${this._base}/system`);
	}

	public updateSystemSettings(payload: ApiSystemSettings): Observable<ApiSystemSettings> {
		return this._http.put<ApiSystemSettings>(`${this._base}/system`, payload);
	}
}
