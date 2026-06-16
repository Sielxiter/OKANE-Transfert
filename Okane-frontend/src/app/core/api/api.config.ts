function resolveApiBaseUrl(): string {
	if (typeof window === 'undefined' || !window.location) {
		return 'http://localhost:8080/api';
	}

	const { protocol, hostname, port } = window.location;
	const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

	if (isLocalhost) {
		return 'http://localhost:8080/api';
	}

	// In deployment the frontend is exposed on :80 and the backend on :8081.
	if (port === '8081') {
		return `${protocol}//${hostname}:8081/api`;
	}

	return `${protocol}//${hostname}:8081/api`;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const ADMIN_API_BASE = `${API_BASE_URL}/admin`;
export const MANAGER_API_BASE = `${API_BASE_URL}/manager`;
export const CLIENT_API_BASE = `${API_BASE_URL}/client`;
