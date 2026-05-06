import { useMemo, useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  listIpAddresses,
  createIpAddress,
  updateIpAddress,
  deleteIpAddress,
} from "../ipAddressApi.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  try {
    const res = await listIpAddresses();
    if (!res.ok) {
      const text = await res.text();
      return {
        items: [],
        error: `API returned ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    const data = await res.json().catch(() => null);
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.ipAddresses)
          ? data.ipAddresses
          : [];
    return { items, error: null };
  } catch (err) {
    console.error("[app.ip-address] list error:", err);
    return { items: [], error: err.message || "Failed to load IP addresses" };
  }
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "");

  try {
    if (intent === "create") {
      const name = String(form.get("name") || "").trim();
      const ipaddress = String(form.get("ipaddress") || "").trim();
      if (!name || !ipaddress) {
        return { ok: false, error: "Both name and IP address are required." };
      }
      const res = await createIpAddress({ name, ipaddress });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Create failed (${res.status}): ${text.slice(0, 200)}` };
      }
      return { ok: true, message: `Added "${name}".` };
    }

    if (intent === "update") {
      const id = String(form.get("id") || "").trim();
      const name = String(form.get("name") || "").trim();
      const ipaddress = String(form.get("ipaddress") || "").trim();
      if (!id) return { ok: false, error: "Missing id." };
      if (!name || !ipaddress) {
        return { ok: false, error: "Both name and IP address are required." };
      }
      const res = await updateIpAddress(id, { name, ipaddress });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Update failed (${res.status}): ${text.slice(0, 200)}` };
      }
      return { ok: true, message: `Updated "${name}".` };
    }

    if (intent === "delete") {
      const id = String(form.get("id") || "").trim();
      if (!id) return { ok: false, error: "Missing id." };
      const res = await deleteIpAddress(id);
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Delete failed (${res.status}): ${text.slice(0, 200)}` };
      }
      return { ok: true, message: "IP address deleted." };
    }

    return { ok: false, error: `Unknown intent: ${intent}` };
  } catch (err) {
    console.error("[app.ip-address] action error:", err);
    return { ok: false, error: err.message || "Request failed" };
  }
};

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const PAGE_CSS = `
.ipx-wrap { width: 100%; max-width: 100%; box-sizing: border-box; }
.ipx-wrap *, .ipx-wrap *::before, .ipx-wrap *::after { box-sizing: border-box; }

.ipx-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.ipx-stat {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e1e3e5;
  border-radius: 12px;
  box-shadow: 0 1px 0 rgba(22,29,37,0.04);
  min-width: 0;
}
.ipx-stat-label {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6d7175;
  margin-bottom: 6px;
}
.ipx-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #202223;
  line-height: 1.2;
}

.ipx-card {
  background: #fff;
  border: 1px solid #e1e3e5;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 0 rgba(22,29,37,0.04);
  margin-bottom: 20px;
  min-width: 0;
}
.ipx-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.ipx-card-title { font-size: 16px; font-weight: 600; color: #202223; margin: 0; }
.ipx-card-sub { font-size: 13px; color: #6d7175; margin-top: 2px; }

.ipx-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.ipx-field { min-width: 0; }
.ipx-label {
  display: block;
  font-weight: 500;
  font-size: 13px;
  margin-bottom: 6px;
  color: #202223;
}
.ipx-hint { font-size: 12px; color: #6d7175; margin-top: 4px; }
.ipx-warn { font-size: 12px; color: #b45309; margin-top: 4px; }
.ipx-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid #c9cccf;
  border-radius: 8px;
  outline: none;
  background: #fff;
  color: #202223;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ipx-input:focus { border-color: #008060; box-shadow: 0 0 0 3px rgba(0,128,96,0.15); }
.ipx-input.ipx-input-invalid { border-color: #d72c0d; }

.ipx-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 20px; }

.ipx-btn {
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s, border-color 0.15s;
}
.ipx-btn[disabled] { opacity: 0.6; cursor: not-allowed; }
.ipx-btn-primary { background: #008060; color: #fff; }
.ipx-btn-primary:hover:not([disabled]) { background: #006e52; }
.ipx-btn-secondary { background: #f6f6f7; color: #202223; border-color: #c9cccf; }
.ipx-btn-secondary:hover:not([disabled]) { background: #ececed; }

.ipx-icon-btn {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #c9cccf;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  color: #202223;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ipx-icon-btn[disabled] { opacity: 0.6; cursor: not-allowed; }
.ipx-icon-btn-edit { color: #005c47; }
.ipx-icon-btn-edit:hover:not([disabled]) { background: #f1faf6; }
.ipx-icon-btn-delete { color: #b8200a; border-color: #f1c5be; }
.ipx-icon-btn-delete:hover:not([disabled]) { background: #fdf1ef; }

.ipx-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.ipx-toolbar-info { min-width: 0; }
.ipx-search { position: relative; flex: 1 1 240px; max-width: 420px; }
.ipx-search-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  font-size: 14px;
  border: 1px solid #c9cccf;
  border-radius: 999px;
  outline: none;
  background: #fff;
}
.ipx-search-input:focus { border-color: #008060; box-shadow: 0 0 0 3px rgba(0,128,96,0.15); }
.ipx-search-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  color: #6d7175;
  font-size: 14px;
  line-height: 1;
  pointer-events: none;
}

.ipx-banner {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ipx-banner-success { background: #e3f1df; border: 1px solid #95c8a9; color: #0c5132; }
.ipx-banner-error { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; }
.ipx-banner-dismiss {
  margin-left: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: inherit;
  opacity: 0.7;
  padding: 0 4px;
}

.ipx-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  background: #e3f1df;
  color: #0c5132;
  white-space: nowrap;
}
.ipx-badge-neutral { background: #f1f2f3; color: #414f3e; }

.ipx-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.ipx-table {
  width: 100%;
  min-width: 560px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}
.ipx-table th {
  text-align: left;
  padding: 10px 14px;
  background: #fafbfb;
  border-bottom: 1px solid #e1e3e5;
  font-weight: 600;
  color: #414f3e;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.ipx-table td {
  padding: 14px;
  border-bottom: 1px solid #f1f2f3;
  color: #202223;
  vertical-align: middle;
}
.ipx-row-editing { background: #fff8e1; }

.ipx-name-cell { display: flex; align-items: center; min-width: 0; }
.ipx-name-text { font-weight: 500; overflow: hidden; text-overflow: ellipsis; }
.ipx-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg,#008060,#005c47);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  margin-right: 10px;
  flex-shrink: 0;
}

.ipx-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: #f1f2f3;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
}

.ipx-row-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.ipx-empty {
  padding: 48px 24px;
  text-align: center;
  color: #6d7175;
  border: 1px dashed #c9cccf;
  border-radius: 12px;
  background: #fafbfb;
}
.ipx-empty-title { font-size: 16px; font-weight: 600; color: #202223; margin-bottom: 6px; }

@media (max-width: 720px) {
  .ipx-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ipx-form-grid { grid-template-columns: minmax(0, 1fr); }
  .ipx-card { padding: 16px; }
  .ipx-search { max-width: 100%; flex-basis: 100%; }
  .ipx-toolbar { align-items: stretch; }
}

@media (max-width: 460px) {
  .ipx-stats { grid-template-columns: minmax(0, 1fr); }
  .ipx-actions .ipx-btn { flex: 1 1 auto; }
}
`;

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || a.toUpperCase();
}

export default function IpAddressPage() {
  const { items, error: loadError } = useLoaderData();
  const fetcher = useFetcher();

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [ipaddress, setIpaddress] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(null);

  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.ok) {
        setNotice({ type: "success", text: fetcher.data.message || "Saved." });
        setEditingId(null);
        setName("");
        setIpaddress("");
      } else if (fetcher.data.error) {
        setNotice({ type: "error", text: fetcher.data.error });
      }
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (notice?.type === "success") {
      const t = setTimeout(() => setNotice(null), 3500);
      return () => clearTimeout(t);
    }
  }, [notice]);

  const startEdit = (item) => {
    setEditingId(item.id ?? item._id);
    setName(item.name || "");
    setIpaddress(item.ipaddress || "");
    setNotice(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setIpaddress("");
  };

  const submitForm = (e) => {
    e.preventDefault();
    const fd = new FormData();
    if (editingId) {
      fd.set("intent", "update");
      fd.set("id", String(editingId));
    } else {
      fd.set("intent", "create");
    }
    fd.set("name", name.trim());
    fd.set("ipaddress", ipaddress.trim());
    fetcher.submit(fd, { method: "post" });
  };

  const handleDelete = (id, label) => {
    // eslint-disable-next-line no-undef
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    const fd = new FormData();
    fd.set("intent", "delete");
    fd.set("id", String(id));
    fetcher.submit(fd, { method: "post" });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        (it.name || "").toLowerCase().includes(q) ||
        (it.ipaddress || "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const ipValid = !ipaddress || IPV4_RE.test(ipaddress.trim());
  const totalCount = items.length;
  const validCount = items.filter((it) =>
    IPV4_RE.test((it.ipaddress || "").trim()),
  ).length;

  return (
    <s-page heading="IP Addresses">
      <s-section>
        <s-box padding="base">
          <style>{PAGE_CSS}</style>
          <div className="ipx-wrap">
            {notice && (
              <div
                className={`ipx-banner ${
                  notice.type === "success"
                    ? "ipx-banner-success"
                    : "ipx-banner-error"
                }`}
              >
                <span style={{ fontWeight: 700 }}>
                  {notice.type === "success" ? "OK" : "Error"}
                </span>
                <span>{notice.text}</span>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="ipx-banner-dismiss"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}
            {loadError && (
              <div className="ipx-banner ipx-banner-error">
                <span style={{ fontWeight: 700 }}>Error</span>
                <span>{loadError}</span>
              </div>
            )}

            <div className="ipx-stats">
              <div className="ipx-stat">
                <div className="ipx-stat-label">Total entries</div>
                <div className="ipx-stat-value">{totalCount}</div>
              </div>
              <div className="ipx-stat">
                <div className="ipx-stat-label">Valid IPv4</div>
                <div className="ipx-stat-value">{validCount}</div>
              </div>
              <div className="ipx-stat">
                <div className="ipx-stat-label">Other</div>
                <div className="ipx-stat-value">
                  {Math.max(0, totalCount - validCount)}
                </div>
              </div>
            </div>

            <div className="ipx-card">
              <div className="ipx-card-header">
                <div className="ipx-toolbar-info">
                  <h3 className="ipx-card-title">
                    {editingId ? "Edit IP address" : "Add new IP address"}
                  </h3>
                  <div className="ipx-card-sub">
                    {editingId
                      ? "Updating an existing entry — use Cancel to discard."
                      : "Register an IP with a friendly name for reference."}
                  </div>
                </div>
                {editingId && (
                  <span className="ipx-badge ipx-badge-neutral">Editing</span>
                )}
              </div>

              <form onSubmit={submitForm}>
                <div className="ipx-form-grid">
                  <div className="ipx-field">
                    <label className="ipx-label" htmlFor="ip-name">
                      Name
                    </label>
                    <input
                      id="ip-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Office Router"
                      className="ipx-input"
                      required
                      maxLength={120}
                    />
                    <div className="ipx-hint">
                      A label so you can recognize this entry later.
                    </div>
                  </div>
                  <div className="ipx-field">
                    <label className="ipx-label" htmlFor="ip-address">
                      IP address
                    </label>
                    <input
                      id="ip-address"
                      type="text"
                      value={ipaddress}
                      onChange={(e) => setIpaddress(e.target.value)}
                      placeholder="e.g. 192.168.1.10"
                      className={`ipx-input ${
                        ipaddress && !ipValid ? "ipx-input-invalid" : ""
                      }`}
                      required
                      maxLength={64}
                      inputMode="decimal"
                    />
                    {ipaddress && !ipValid ? (
                      <div className="ipx-warn">
                        Doesn&apos;t look like a valid IPv4 — saving anyway is
                        allowed.
                      </div>
                    ) : (
                      <div className="ipx-hint">
                        IPv4 format like <code>192.168.1.10</code>.
                      </div>
                    )}
                  </div>
                </div>

                <div className="ipx-actions">
                  <button
                    type="submit"
                    className="ipx-btn ipx-btn-primary"
                    disabled={isSubmitting}
                  >
                    {editingId
                      ? isSubmitting
                        ? "Updating…"
                        : "Update"
                      : isSubmitting
                        ? "Adding…"
                        : "Add IP address"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="ipx-btn ipx-btn-secondary"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="ipx-card">
              <div className="ipx-toolbar">
                <div className="ipx-toolbar-info">
                  <h3 className="ipx-card-title">Registered IPs</h3>
                  <div className="ipx-card-sub">
                    {filtered.length} of {totalCount} shown
                  </div>
                </div>
                <div className="ipx-search">
                  <span className="ipx-search-icon" aria-hidden="true">
                    ⌕
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or IP…"
                    className="ipx-search-input"
                  />
                </div>
              </div>

              {totalCount === 0 ? (
                <div className="ipx-empty">
                  <div className="ipx-empty-title">No IP addresses yet</div>
                  <div>Add your first entry using the form above.</div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="ipx-empty">
                  <div className="ipx-empty-title">No matches</div>
                  <div>
                    Nothing matches “{search}”. Try a different search term.
                  </div>
                </div>
              ) : (
                <div className="ipx-table-scroll">
                  <table className="ipx-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>IP address</th>
                        <th>Status</th>
                        <th style={{ width: "180px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => {
                        const id = item.id ?? item._id;
                        const isRowEditing = editingId === id;
                        const ipOk = IPV4_RE.test(
                          (item.ipaddress || "").trim(),
                        );
                        return (
                          <tr
                            key={id}
                            className={isRowEditing ? "ipx-row-editing" : ""}
                          >
                            <td>
                              <div className="ipx-name-cell">
                                <span className="ipx-avatar">
                                  {initialsOf(item.name)}
                                </span>
                                <span className="ipx-name-text">
                                  {item.name || <em>(unnamed)</em>}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="ipx-mono">
                                {item.ipaddress || "—"}
                              </span>
                            </td>
                            <td>
                              {ipOk ? (
                                <span className="ipx-badge">Valid IPv4</span>
                              ) : (
                                <span className="ipx-badge ipx-badge-neutral">
                                  Unverified
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="ipx-row-actions">
                                <button
                                  type="button"
                                  onClick={() => startEdit(item)}
                                  className="ipx-icon-btn ipx-icon-btn-edit"
                                  disabled={isSubmitting}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      id,
                                      item.name || item.ipaddress,
                                    )
                                  }
                                  className="ipx-icon-btn ipx-icon-btn-delete"
                                  disabled={isSubmitting}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </s-box>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
