// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				_id: string;
				username: string;
				email: string;
				displayName: string;
				walletAddress: string;
				role: string;
				profileImage?: string;
			} | null;
			token: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
