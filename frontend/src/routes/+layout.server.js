// Server-side layout load function
// Passes user data from cookies to client

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
  return {
    user: locals.user || null
  };
}
