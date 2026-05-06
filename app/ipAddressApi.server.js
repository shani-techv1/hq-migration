/**
 * External API client for IP address management.
 * Base URL: https://highquality.allgovjobs.com/backend
 */

const API_BASE = "https://highquality.allgovjobs.com/backend";

/**
 * GET /api/ip-addresses - List all IP addresses
 * @returns {Promise<Response>}
 */
export async function listIpAddresses() {
  return fetch(`${API_BASE}/api/ip-addresses`);
}

/**
 * GET /api/ip-addresses/:id - Get a single IP address
 * @param {string|number} id
 * @returns {Promise<Response>}
 */
export async function getIpAddress(id) {
  return fetch(`${API_BASE}/api/ip-addresses/${encodeURIComponent(id)}`);
}

/**
 * POST /api/ip-addresses - Create a new IP address
 * @param {{ name: string, ipaddress: string }} body
 * @returns {Promise<Response>}
 */
export async function createIpAddress({ name, ipaddress }) {
  return fetch(`${API_BASE}/api/ip-addresses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ipaddress }),
  });
}

/**
 * PUT /api/ip-addresses/:id - Update an IP address
 * @param {string|number} id
 * @param {{ name: string, ipaddress: string }} body
 * @returns {Promise<Response>}
 */
export async function updateIpAddress(id, { name, ipaddress }) {
  return fetch(`${API_BASE}/api/ip-addresses/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ipaddress }),
  });
}

/**
 * DELETE /api/ip-addresses/:id - Delete an IP address
 * @param {string|number} id
 * @returns {Promise<Response>}
 */
export async function deleteIpAddress(id) {
  return fetch(`${API_BASE}/api/ip-addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
