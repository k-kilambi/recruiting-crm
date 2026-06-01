import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { DndContext, DragOverlay, useDraggable, useDroppable, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const genId = () => 'new_' + Math.random().toString(36).slice(2, 9);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const VERTICALS = ["Sports", "Fitness", "Gaming", "Entertainment", "Tech", "Fintech", "Other"];
const STAGES = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Public", "N/A"];
const FUNCTIONS = ["Product Management", "GTM / Growth", "Strategy & Operations", "Consulting", "Business Development", "Other"];
const SOURCES = ["LinkedIn", "Referral", "Company Site", "Handshake", "Other"];
const JOB_STATUSES = ["Interested", "Applied", "Interviewing", "Offer", "Rejected", "Withdrew"];
const CONTACT_TYPES = ["Target", "Bridge", "Resource"];
const HOW_KNOWN = ["Cold", "Acquaintance", "Warm", "Program / Institutional", "Personal"];
const CHANNELS = ["Email", "LinkedIn", "In-Person", "Phone", "Text Message", "WhatsApp", "Slack"];
const DIRECTIONS = ["Sent", "Received"];
const OUTREACH_STATUSES = ["Sent", "Replied", "No Response", "Follow-up Needed"];

const STATUS_COLORS = {
  Interested: "#3b82f6",
  Applied: "#8b5cf6",
  Interviewing: "#f59e0b",
  Offer: "#10b981",
  Rejected: "#ef4444",
  Withdrew: "#71717a",
  Sent: "#3b82f6",
  Replied: "#10b981",
  "No Response": "#71717a",
  "Follow-up Needed": "#ef4444",
  Target: "#f59e0b",
  Bridge: "#8b5cf6",
  Resource: "#10b981",
};


// ─── SMALL UI COMPONENTS ──────────────────────────────────────────────────────
const Badge = ({ label, color }) => (
  <span style={{
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    background: (color || STATUS_COLORS[label] || "var(--text-secondary)") + "22",
    color: color || STATUS_COLORS[label] || "#9ca3af",
    border: `1px solid ${(color || STATUS_COLORS[label] || "var(--text-secondary)")}44`,
  }}>{label}</span>
);

const TabIcon = ({ id }) => {
  const s = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (id === "dashboard") return <svg {...s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (id === "companies") return <svg {...s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  if (id === "jobs") return <svg {...s}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
  if (id === "contacts") return <svg {...s}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  if (id === "outreach") return <svg {...s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
  return null;
};

const Input = ({ label, value, onChange, type = "text", placeholder = "" }) => (
  <div style={{ marginBottom: "14px" }}>
    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", boxSizing: "border-box",
        background: "var(--input-bg)", border: "1px solid var(--border)",
        color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px",
        fontSize: "13px", outline: "none",
      }}
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: "14px" }}>
    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", boxSizing: "border-box",
        background: "var(--input-bg)", border: "1px solid var(--border)",
        color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px",
        fontSize: "13px", outline: "none",
      }}
    >
      <option value="">— select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Checkbox = ({ label, value, onChange }) => (
  <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
    <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
      style={{ width: "15px", height: "15px", accentColor: "#4F646F" }} />
    <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{label}</label>
  </div>
);

const Textarea = ({ label, value, onChange }) => (
  <div style={{ marginBottom: "14px" }}>
    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={3}
      style={{
        width: "100%", boxSizing: "border-box",
        background: "var(--input-bg)", border: "1px solid var(--border)",
        color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px",
        fontSize: "13px", outline: "none", resize: "vertical",
      }}
    />
  </div>
);

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <div onClick={e => e.stopPropagation()} className="modal-inner" style={{
      background: "var(--modal-bg)", border: "1px solid var(--border)", borderRadius: "12px",
      width: "min(480px, calc(100vw - 32px))", maxHeight: "85vh", overflow: "auto", padding: "28px",
      boxShadow: "0 25px 60px #000a",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Mono', monospace" }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div style={{ position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)", background: "#1e0a0a", border: "1px solid #ef4444", color: "#fca5a5", padding: "10px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: "14px", whiteSpace: "nowrap" }}>
      ⚠ {message}
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "16px", padding: 0, lineHeight: 1 }}>×</button>
    </div>
  );
};

// ─── TABLE ────────────────────────────────────────────────────────────────────
const Table = ({ cols, rows, onEdit, onDelete }) => (
  <>
    {/* Desktop table */}
    <div className="table-desktop" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} style={{
                textAlign: "left", padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
                color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase",
                fontFamily: "'DM Mono', monospace",
              }}>{c.label}</th>
            ))}
            <th style={{ width: "80px", borderBottom: "1px solid var(--border)" }} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={cols.length + 1} style={{ padding: "32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>No records yet — add one above</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={row.id} style={{ background: i % 2 === 0 ? "transparent" : "var(--stripe)" }}>
              {cols.map(c => (
                <td key={c.key} style={{ padding: "10px 14px", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key] || <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                </td>
              ))}
              <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => onEdit(row)} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "4px", padding: "3px 8px", fontSize: "11px" }}>Edit</button>
                  <button onClick={() => onDelete(row.id)} style={{ background: "none", border: "1px solid var(--border)", color: "#ef444466", cursor: "pointer", borderRadius: "4px", padding: "3px 8px", fontSize: "11px" }}>Del</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile cards */}
    <div className="table-mobile">
      {rows.length === 0 && (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>No records yet — add one above</div>
      )}
      {rows.map(row => {
        const primaryCol = cols.find(c => c.cardPrimary) || cols[0];
        const secondaryCols = cols.filter(c => c !== primaryCol && !c.hideInCard && row[c.key]);
        return (
          <div key={row.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", flex: 1, marginRight: "12px" }}>
                {primaryCol.render ? primaryCol.render(row[primaryCol.key], row) : row[primaryCol.key] || <span style={{ color: "var(--text-tertiary)" }}>—</span>}
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => onEdit(row)} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "4px", padding: "4px 10px", fontSize: "11px" }}>Edit</button>
                <button onClick={() => onDelete(row.id)} style={{ background: "none", border: "1px solid var(--border)", color: "#ef444466", cursor: "pointer", borderRadius: "4px", padding: "4px 10px", fontSize: "11px" }}>Del</button>
              </div>
            </div>
            {secondaryCols.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginTop: "8px" }}>
                {secondaryCols.map(c => (
                  <span key={c.key} style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {c.render ? c.render(row[c.key], row) : row[c.key]}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </>
);

// ─── COMPANIES TAB ────────────────────────────────────────────────────────────
const emptyCompany = () => ({ id: genId(), name: "", vertical: "", stage: "", website: "", notes: "" });

const CompaniesTab = ({ data, setData, dbSave, dbDelete, setCompanies, onError, userId }) => {
  const [modal, setModal] = useState(null);
  const [gridView, setGridView] = useState(true);
  const save = async (rec) => {
    const isNew = !rec.id || rec.id.startsWith("new_");
    const snake = {
      name: rec.name, vertical: rec.vertical || null,
      stage: rec.stage || null, website: rec.website || null, notes: rec.notes || null,
    };
    if (isNew) {
      const { data: inserted, error } = await supabase.from("companies").insert({ ...snake, user_id: userId }).select().single();
      if (!error && inserted) setCompanies(prev => [inserted, ...prev]);
      else { console.error("Company insert error:", error); onError("Failed to save company — please try again."); }
    } else {
      const { error } = await supabase.from("companies").update(snake).eq("id", rec.id);
      if (!error) setCompanies(prev => prev.map(c => c.id === rec.id ? { ...c, ...snake, id: rec.id } : c));
      else { console.error("Company update error:", error); onError("Failed to save company — please try again."); }
    }
    setModal(null);
  };
  const del = (id) => dbDelete("companies", id, setCompanies);

  const cols = [
    { key: "name", label: "Company" },
    { key: "vertical", label: "Vertical", render: v => v ? <Badge label={v} color="#3b82f6" /> : "—" },
    { key: "stage", label: "Stage" },
    { key: "website", label: "Website" },
    { key: "notes", label: "Notes", hideInCard: true },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Companies</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{data.companies.length} tracked</div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className="board-toggle" style={{ display: "flex", gap: "6px" }}>
            {[{ v: true, label: "Grid" }, { v: false, label: "Table" }].map(({ v, label }) => (
              <button key={label} onClick={() => setGridView(v)} style={{
                background: gridView === v ? "#4F646F18" : "transparent",
                border: `1px solid ${gridView === v ? "#4F646F" : "var(--border)"}`,
                color: gridView === v ? "#4F646F" : "var(--text-tertiary)",
                borderRadius: "5px", padding: "4px 11px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>
          <button onClick={() => setModal(emptyCompany())} className="btn-click" style={{ background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "9px 16px", fontWeight: 700, fontSize: "12px", cursor: "pointer", letterSpacing: "0.04em" }}>+ ADD COMPANY</button>
        </div>
      </div>

      {/* Grid view */}
      {gridView && (
        <div className="table-desktop" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px", marginBottom: "16px" }}>
          {data.companies.length === 0 && (
            <div style={{ gridColumn: "1/-1", padding: "32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>No companies yet — add one above</div>
          )}
          {data.companies.map(c => (
            <div key={c.id} style={{ background: "var(--modal-bg)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", lineHeight: "1.3" }}>{c.name}</div>
                <button onClick={() => setModal(c)} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "4px", padding: "3px 9px", fontSize: "11px", flexShrink: 0 }}>Edit</button>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {c.vertical && <Badge label={c.vertical} color="#3b82f6" />}
                {c.stage && <Badge label={c.stage} color="#8b5cf6" />}
              </div>
              {c.website && <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#3b82f6", textDecoration: "none" }}>↗ {c.website.replace(/^https?:\/\//, "")}</a>}
              {c.notes && <div style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: "1.5" }}>{c.notes}</div>}
            </div>
          ))}
        </div>
      )}
      {gridView && <div className="table-mobile"><Table cols={cols} rows={data.companies} onEdit={setModal} onDelete={del} /></div>}

      {/* Table view */}
      {!gridView && <Table cols={cols} rows={data.companies} onEdit={setModal} onDelete={del} />}
      {modal && (
        <Modal title={modal.name || "New Company"} onClose={() => setModal(null)}>
          <Input label="Company Name" value={modal.name} onChange={v => setModal(m => ({ ...m, name: v }))} />
          <Select label="Vertical" value={modal.vertical} onChange={v => setModal(m => ({ ...m, vertical: v }))} options={VERTICALS} />
          <Select label="Stage" value={modal.stage} onChange={v => setModal(m => ({ ...m, stage: v }))} options={STAGES} />
          <Input label="Website" value={modal.website} onChange={v => setModal(m => ({ ...m, website: v }))} />
          <Textarea label="Notes" value={modal.notes} onChange={v => setModal(m => ({ ...m, notes: v }))} />
          <button onClick={() => save(modal)} className="btn-click" style={{ width: "100%", background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", marginTop: "6px" }}>SAVE</button>
        </Modal>
      )}
    </div>
  );
};

// ─── KANBAN BOARD (Jobs) ──────────────────────────────────────────────────────
const KanbanCardInner = ({ job, coName, onEdit }) => (
  <div style={{
    background: "var(--modal-bg)", border: "1px solid var(--border)", borderRadius: "8px",
    padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "grab",
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
      <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", lineHeight: "1.35", flex: 1 }}>
        {job.title || "Untitled"}
      </div>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onEdit(job); }}
        style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "4px", padding: "3px 9px", fontSize: "11px", flexShrink: 0, lineHeight: "16px" }}
      >Edit</button>
    </div>
    {job.companyId && <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>{coName(job.companyId)}</div>}
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
      {job.function && <Badge label={job.function} color="#64748b" />}
      {job.resumeLink && <a href={job.resumeLink} target="_blank" rel="noreferrer" onPointerDown={e => e.stopPropagation()} style={{ fontSize: "11px", color: "#3b82f6", textDecoration: "none" }}>↗ Resume</a>}
      {job.coverLetterLink && <a href={job.coverLetterLink} target="_blank" rel="noreferrer" onPointerDown={e => e.stopPropagation()} style={{ fontSize: "11px", color: "#3b82f6", textDecoration: "none" }}>↗ CL</a>}
    </div>
  </div>
);

const KanbanCard = ({ job, coName, onEdit }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: job.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ opacity: isDragging ? 0 : 1, marginBottom: "8px", touchAction: "none" }}>
      <KanbanCardInner job={job} coName={coName} onEdit={onEdit} />
    </div>
  );
};

const KanbanColumn = ({ status, jobs, coName, onEdit }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const color = STATUS_COLORS[status] || "#71717a";
  return (
    <div style={{ minWidth: "190px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{status}</span>
        <span style={{ fontSize: "11px", color: "var(--text-tertiary)", marginLeft: "auto" }}>{jobs.length}</span>
      </div>
      <div ref={setNodeRef} style={{
        minHeight: "80px", borderRadius: "8px", padding: "4px",
        background: isOver ? `${color}10` : "var(--surface)",
        border: `1.5px dashed ${isOver ? color + "88" : "var(--border-subtle)"}`,
        transition: "all 0.15s",
      }}>
        {jobs.map(job => <KanbanCard key={job.id} job={job} coName={coName} onEdit={onEdit} />)}
      </div>
    </div>
  );
};

const KanbanBoard = ({ jobs, coName, onEdit, onStatusChange }) => {
  const [activeId, setActiveId] = useState(null);
  const activeJob = jobs.find(j => j.id === activeId);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 8 } }));
  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={({ active, over }) => {
        setActiveId(null);
        if (over && active.id !== over.id && JOB_STATUSES.includes(over.id)) {
          onStatusChange(active.id, over.id);
        }
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "16px" }}>
        {JOB_STATUSES.map(status => (
          <KanbanColumn key={status} status={status} jobs={jobs.filter(j => j.status === status)} coName={coName} onEdit={onEdit} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeJob ? (
          <div style={{ opacity: 0.92, cursor: "grabbing", width: "190px" }}>
            <KanbanCardInner job={activeJob} coName={coName} onEdit={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// ─── JOBS TAB ─────────────────────────────────────────────────────────────────
const emptyJob = () => ({ id: genId(), title: "", companyId: "", function: "", source: "", status: "Interested", dateAdded: new Date().toISOString().slice(0, 10), jdLink: "", resumeLink: "", coverLetterLink: "", notes: "" });

const emptyMiniCompany = () => ({ id: genId(), name: "", vertical: "", stage: "", website: "", notes: "" });

const JobsTab = ({ data, setData, dbSave, dbDelete, setJobs, setCompanies, onError, userId }) => {
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("All");
  const [miniCompany, setMiniCompany] = useState(null);
  const [dupWarning, setDupWarning] = useState("");
  const [boardView, setBoardView] = useState(true);

  const toCamelJob = (j) => ({
    ...j,
    companyId: j.company_id,
    dateAdded: j.date_added,
    jdLink: j.jd_link,
    resumeLink: j.resume_link,
    coverLetterLink: j.cover_letter_link,
  });

  const save = async (rec) => {
    const isNew = !rec.id || rec.id.startsWith("new_");
    const snake = {
      title: rec.title, company_id: rec.companyId || null,
      function: rec.function || null, source: rec.source || null,
      status: rec.status, date_added: rec.dateAdded || null,
      jd_link: rec.jdLink || null, resume_link: rec.resumeLink || null,
      cover_letter_link: rec.coverLetterLink || null, notes: rec.notes || null,
    };
    if (isNew) {
      const { data: inserted, error } = await supabase.from("jobs").insert({ ...snake, user_id: userId }).select().single();
      if (!error && inserted) setJobs(prev => [toCamelJob(inserted), ...prev]);
      else { console.error("Job insert error:", error); onError("Failed to save job — please try again."); }
    } else {
      const { error } = await supabase.from("jobs").update(snake).eq("id", rec.id);
      if (!error) setJobs(prev => prev.map(j => j.id === rec.id ? toCamelJob({ ...j, ...snake, id: rec.id }) : j));
      else { console.error("Job update error:", error); onError("Failed to save job — please try again."); }
    }
    setModal(null);
  };
  const del = (id) => dbDelete("jobs", id, setJobs);
  const coName = (id) => data.companies.find(c => c.id === id)?.name || "—";

  const handleStatusChange = async (jobId, newStatus) => {
    const { error } = await supabase.from("jobs").update({ status: newStatus }).eq("id", jobId);
    if (error) { onError("Failed to update status — please try again."); return; }
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
  };

  const saveMiniCompany = async (co) => {
    const dup = data.companies.find(c => c.name.toLowerCase().trim() === co.name.toLowerCase().trim());
    if (dup) {
      setDupWarning(`"${dup.name}" already exists. Selecting it instead.`);
      setModal(m => ({ ...m, companyId: dup.id }));
      setMiniCompany(null);
      return;
    }
    const { data: inserted } = await supabase.from("companies").insert({ name: co.name, vertical: co.vertical, stage: co.stage, user_id: userId }).select().single();
    if (inserted) {
      setCompanies(prev => [inserted, ...prev]);
      setModal(m => ({ ...m, companyId: inserted.id }));
    }
    setMiniCompany(null);
    setDupWarning("");
  };

  const filtered = filter === "All" ? data.jobs : data.jobs.filter(j => j.status === filter);

  const cols = [
    { key: "title", label: "Role", render: (v) => <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{v}</span> },
    { key: "companyId", label: "Company", render: v => coName(v) },
    { key: "function", label: "Function" },
    { key: "status", label: "Status", render: v => <Badge label={v} /> },
    { key: "dateAdded", label: "Added", hideInCard: true },
    { key: "resumeLink", label: "Resume", render: v => v ? <a href={v} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontSize: "11px" }}>↗ link</a> : <span style={{ color: "var(--text-tertiary)" }}>—</span> },
    { key: "coverLetterLink", label: "CL", render: v => v ? <a href={v} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontSize: "11px" }}>↗ link</a> : <span style={{ color: "var(--text-tertiary)" }}>—</span> },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Jobs</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{data.jobs.length} tracked</div>
        </div>
        <button onClick={() => { setModal(emptyJob()); setDupWarning(""); }} className="btn-click" style={{ background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "9px 16px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>+ ADD JOB</button>
      </div>
      {/* Board / Table toggle — hidden on mobile */}
      <div className="board-toggle" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[{ v: true, label: "Board" }, { v: false, label: "Table" }].map(({ v, label }) => (
          <button key={label} onClick={() => setBoardView(v)} style={{
            background: boardView === v ? "#4F646F18" : "transparent",
            border: `1px solid ${boardView === v ? "#4F646F" : "var(--border)"}`,
            color: boardView === v ? "#4F646F" : "var(--text-tertiary)",
            borderRadius: "5px", padding: "4px 12px", fontSize: "11px",
            fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em",
          }}>{label}</button>
        ))}
      </div>

      {/* Filter bar — table view only */}
      {!boardView && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {["All", ...JOB_STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              background: filter === s ? "#4F646F18" : "transparent",
              border: `1px solid ${filter === s ? "#4F646F" : "var(--border)"}`,
              color: filter === s ? "#4F646F" : "var(--text-tertiary)",
              borderRadius: "5px", padding: "4px 12px", fontSize: "11px",
              fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em",
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Desktop: Kanban board */}
      {boardView && (
        <div className="table-desktop">
          <KanbanBoard
            jobs={data.jobs}
            coName={coName}
            onEdit={r => { setModal(r); setDupWarning(""); }}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {/* Mobile cards — always visible on mobile regardless of view */}
      {boardView && (
        <div className="table-mobile">
          {data.jobs.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>No jobs yet — add one above</div>
          )}
          {data.jobs.map(job => (
            <div key={job.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>{job.title}</div>
                  {job.companyId && <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{coName(job.companyId)}</div>}
                </div>
                <button onClick={() => { setModal(job); setDupWarning(""); }} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", flexShrink: 0 }}>Edit</button>
              </div>
              <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <Badge label={job.status} />
                {job.function && <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{job.function}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table view — desktop table + mobile cards via Table component */}
      {!boardView && (
        <Table cols={cols} rows={filtered} onEdit={r => { setModal(r); setDupWarning(""); }} onDelete={del} />
      )}

      {/* Job Modal */}
      {modal && !miniCompany && (
        <Modal title={modal.title || "New Job"} onClose={() => setModal(null)}>
          <Input label="Job Title" value={modal.title} onChange={v => setModal(m => ({ ...m, title: v }))} />

          {/* Company selector with inline add */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>Company</label>
            <select value={modal.companyId} onChange={e => setModal(m => ({ ...m, companyId: e.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", outline: "none" }}>
              <option value="">— select company —</option>
              {data.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setMiniCompany(emptyMiniCompany())}
              style={{ marginTop: "6px", background: "transparent", border: "1px dashed #334155", color: "var(--text-tertiary)", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", width: "100%" }}>
              + Add New Company
            </button>
            {dupWarning && <div style={{ marginTop: "6px", fontSize: "11px", color: "#4F646F" }}>⚠ {dupWarning}</div>}
          </div>

          <Select label="Function" value={modal.function} onChange={v => setModal(m => ({ ...m, function: v }))} options={FUNCTIONS} />
          <Select label="Source" value={modal.source} onChange={v => setModal(m => ({ ...m, source: v }))} options={SOURCES} />
          <Select label="Status" value={modal.status} onChange={v => setModal(m => ({ ...m, status: v }))} options={JOB_STATUSES} />
          <Input label="Date Added" value={modal.dateAdded} onChange={v => setModal(m => ({ ...m, dateAdded: v }))} type="date" />
          <Input label="JD Link" value={modal.jdLink} onChange={v => setModal(m => ({ ...m, jdLink: v }))} placeholder="https://..." />
          <Input label="Resume (Google Drive URL)" value={modal.resumeLink} onChange={v => setModal(m => ({ ...m, resumeLink: v }))} placeholder="https://drive.google.com/..." />
          <Input label="Cover Letter (Google Drive URL)" value={modal.coverLetterLink} onChange={v => setModal(m => ({ ...m, coverLetterLink: v }))} placeholder="https://drive.google.com/..." />
          <Textarea label="Notes" value={modal.notes} onChange={v => setModal(m => ({ ...m, notes: v }))} />
          <button onClick={() => save(modal)} className="btn-click" style={{ width: "100%", background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", marginTop: "6px" }}>SAVE</button>
        </Modal>
      )}

      {/* Mini Company Modal */}
      {miniCompany && (
        <Modal title="Quick Add Company" onClose={() => setMiniCompany(null)}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "12px", marginTop: 0 }}>Add the basics now — you can fill in the rest from the Companies tab later.</p>
          <Input label="Company Name *" value={miniCompany.name} onChange={v => setMiniCompany(m => ({ ...m, name: v }))} />
          <Select label="Vertical" value={miniCompany.vertical} onChange={v => setMiniCompany(m => ({ ...m, vertical: v }))} options={VERTICALS} />
          <Select label="Stage" value={miniCompany.stage} onChange={v => setMiniCompany(m => ({ ...m, stage: v }))} options={STAGES} />
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button onClick={() => setMiniCompany(null)}
              style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-tertiary)", borderRadius: "6px", padding: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={() => { if (miniCompany.name.trim()) saveMiniCompany(miniCompany); }}
              className="btn-click" style={{ flex: 2, background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
              SAVE & RETURN TO JOB
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── CONTACTS TAB ─────────────────────────────────────────────────────────────
const emptyContact = () => ({ id: genId(), name: "", companyId: "", title: "", linkedin: "", email: "", contactType: [], howKnown: "Cold", connectableTo: "", notes: "" });

const MultiSelect = ({ label, value = [], onChange, options }) => {
  const toggle = (opt) => {
    const next = value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt];
    onChange(next);
  };
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>{label}</label>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {options.map(opt => (
          <button key={opt} onClick={() => toggle(opt)} style={{
            background: value.includes(opt) ? (STATUS_COLORS[opt] || "#4F646F") + "22" : "transparent",
            border: `1px solid ${value.includes(opt) ? (STATUS_COLORS[opt] || "#4F646F") : "var(--border)"}`,
            color: value.includes(opt) ? (STATUS_COLORS[opt] || "#4F646F") : "var(--text-tertiary)",
            borderRadius: "5px", padding: "5px 12px", fontSize: "12px",
            fontWeight: 600, cursor: "pointer", letterSpacing: "0.03em",
          }}>{opt}</button>
        ))}
      </div>
    </div>
  );
};

const ContactsTab = ({ data, setData, dbSave, dbDelete, setContacts, setCompanies, setActionItems, onError, userId }) => {
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("All");
  const [miniCompany, setMiniCompany] = useState(null);
  const [dupWarning, setDupWarning] = useState("");

  const [pendingContactActions, setPendingContactActions] = useState([]);
  const [showContactActions, setShowContactActions] = useState(false);
  const [gridView, setGridView] = useState(true);

  const toCamelContact = (c) => ({
    ...c,
    companyId: c.company_id,
    contactType: c.contact_type,
    howKnown: c.how_known,
    connectableTo: c.connectable_to,
  });

  const save = async (rec) => {
    const isNew = !rec.id || rec.id.startsWith("new_");
    const snake = {
      name: rec.name, company_id: rec.companyId || null, title: rec.title || null,
      linkedin: rec.linkedin || null, email: rec.email || null,
      contact_type: rec.contactType || [], how_known: rec.howKnown || null,
      connectable_to: rec.connectableTo || null, notes: rec.notes || null,
    };
    let savedId = rec.id;
    if (isNew) {
      const { data: inserted, error } = await supabase.from("contacts").insert({ ...snake, user_id: userId }).select().single();
      if (!error && inserted) {
        setContacts(prev => [toCamelContact(inserted), ...prev]);
        savedId = inserted.id;
      } else { console.error("Contact insert error:", error); onError("Failed to save contact — please try again."); return; }
    } else {
      const { error } = await supabase.from("contacts").update(snake).eq("id", rec.id);
      if (!error) setContacts(prev => prev.map(c => c.id === rec.id ? toCamelContact({ ...c, ...snake, id: rec.id }) : c));
      else { console.error("Contact update error:", error); onError("Failed to save contact — please try again."); return; }
    }
    // save action items
    for (const ai of pendingContactActions) {
      if (ai.description && ai.description.trim()) {
        const aiSnake = {
          contact_id: savedId, outreach_id: null,
          description: ai.description, priority: ai.priority,
          effort: ai.effort, done: ai.done || false, backlog: ai.backlog || false,
          due_date: ai.dueDate || null,
        };
        if (ai.id && !ai.id.startsWith("new_")) {
          await supabase.from("action_items").update(aiSnake).eq("id", ai.id);
        } else {
          const { data: newAi } = await supabase.from("action_items").insert({ ...aiSnake, user_id: userId }).select().single();
          if (newAi) setActionItems(prev => [...prev, { ...newAi, contactId: newAi.contact_id, outreachId: newAi.outreach_id }]);
        }
      }
    }
    setModal(null);
    setPendingContactActions([]);
    setShowContactActions(false);
  };

  const openContactModal = (rec) => {
    setModal(rec);
    setDupWarning("");
    const existing = (data.actionItems || []).filter(a => a.contactId === rec.id);
    setPendingContactActions(existing.length > 0 ? existing : []);
    setShowContactActions(existing.length > 0);
  };
  const del = (id) => dbDelete('contacts', id, setContacts);
  const coName = (id) => data.companies.find(c => c.id === id)?.name || "—";
  const ctName = (id) => data.contacts.find(c => c.id === id)?.name || "—";

  const saveMiniCompany = async (co) => {
    const dup = data.companies.find(c => c.name.toLowerCase().trim() === co.name.toLowerCase().trim());
    if (dup) {
      setDupWarning(`"${dup.name}" already exists. Selecting it instead.`);
      setModal(m => ({ ...m, companyId: dup.id }));
      setMiniCompany(null);
      return;
    }
    const { data: inserted } = await supabase.from("companies").insert({ name: co.name, vertical: co.vertical, stage: co.stage, user_id: userId }).select().single();
    if (inserted) {
      setCompanies(prev => [inserted, ...prev]);
      setModal(m => ({ ...m, companyId: inserted.id }));
    }
    setMiniCompany(null);
    setDupWarning("");
  };

  const filtered = filter === "All"
    ? data.contacts
    : data.contacts.filter(c => Array.isArray(c.contactType) ? c.contactType.includes(filter) : c.contactType === filter);

  const cols = [
    { key: "name", label: "Name", render: v => <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{v}</span> },
    { key: "companyId", label: "Company", render: v => coName(v) },
    { key: "title", label: "Title" },
    { key: "contactType", label: "Type", render: v => {
      const types = Array.isArray(v) ? v : [v];
      return <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>{types.map(t => <Badge key={t} label={t} />)}</div>;
    }},
    { key: "howKnown", label: "How Known" },
    { key: "connectableTo", label: "Bridge To", render: v => v ? ctName(v) : "—", hideInCard: true },
  ];

  const showConnectable = Array.isArray(modal?.contactType)
    ? modal.contactType.includes("Bridge")
    : modal?.contactType === "Bridge";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Contacts</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{data.contacts.length} tracked</div>
        </div>
        <button onClick={() => { setModal(emptyContact()); setDupWarning(""); }} className="btn-click" style={{ background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "9px 16px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>+ ADD CONTACT</button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "8px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["All", ...CONTACT_TYPES].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              background: filter === s ? "#4F646F18" : "transparent",
              border: `1px solid ${filter === s ? "#4F646F" : "var(--border)"}`,
              color: filter === s ? "#4F646F" : "var(--text-tertiary)",
              borderRadius: "5px", padding: "4px 12px", fontSize: "11px",
              fontWeight: 600, cursor: "pointer",
            }}>{s}</button>
          ))}
        </div>
        <div className="board-toggle" style={{ display: "flex", gap: "6px" }}>
          {[{ v: true, label: "Grid" }, { v: false, label: "Table" }].map(({ v, label }) => (
            <button key={label} onClick={() => setGridView(v)} style={{
              background: gridView === v ? "#4F646F18" : "transparent",
              border: `1px solid ${gridView === v ? "#4F646F" : "var(--border)"}`,
              color: gridView === v ? "#4F646F" : "var(--text-tertiary)",
              borderRadius: "5px", padding: "4px 11px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Desktop grid */}
      {gridView && (
        <div className="table-desktop" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "14px", marginBottom: "16px" }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", padding: "32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>No contacts yet — add one above</div>
          )}
          {filtered.map(c => (
            <div key={c.id} style={{ background: "var(--modal-bg)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>{c.name}</div>
                  {(c.title || c.companyId) && (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {[c.title, c.companyId ? coName(c.companyId) : null].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
                <button onClick={() => openContactModal(c)} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "4px", padding: "3px 9px", fontSize: "11px", flexShrink: 0 }}>Edit</button>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                {(Array.isArray(c.contactType) ? c.contactType : []).map(t => <Badge key={t} label={t} />)}
                {c.howKnown && <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{c.howKnown}</span>}
              </div>
              {(c.linkedin || c.email) && (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#3b82f6", textDecoration: "none" }}>↗ LinkedIn</a>}
                  {c.email && <a href={`mailto:${c.email}`} style={{ fontSize: "12px", color: "#3b82f6", textDecoration: "none" }}>✉ {c.email}</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {gridView && <div className="table-mobile"><Table cols={cols} rows={filtered} onEdit={r => openContactModal(r)} onDelete={del} /></div>}

      {/* Table view */}
      {!gridView && <Table cols={cols} rows={filtered} onEdit={r => { setModal(r); setDupWarning(""); }} onDelete={del} />}

      {/* Contact Modal */}
      {modal && !miniCompany && (
        <Modal title={modal.name || "New Contact"} onClose={() => setModal(null)}>
          <Input label="Name" value={modal.name} onChange={v => setModal(m => ({ ...m, name: v }))} />

          {/* Inline company creation */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>Company</label>
            <select value={modal.companyId} onChange={e => setModal(m => ({ ...m, companyId: e.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", outline: "none" }}>
              <option value="">— select company —</option>
              {data.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setMiniCompany(emptyMiniCompany())}
              style={{ marginTop: "6px", background: "transparent", border: "1px dashed #334155", color: "var(--text-tertiary)", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", width: "100%" }}>
              + Add New Company
            </button>
            {dupWarning && <div style={{ marginTop: "6px", fontSize: "11px", color: "#4F646F" }}>⚠ {dupWarning}</div>}
          </div>

          <Input label="Title / Role" value={modal.title} onChange={v => setModal(m => ({ ...m, title: v }))} />
          <MultiSelect label="Contact Type (select all that apply)" value={modal.contactType} onChange={v => setModal(m => ({ ...m, contactType: v }))} options={CONTACT_TYPES} />
          <Select label="How You Know Them" value={modal.howKnown} onChange={v => setModal(m => ({ ...m, howKnown: v }))} options={HOW_KNOWN} />
          {showConnectable && (
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>Can Connect You To</label>
              <select value={modal.connectableTo} onChange={e => setModal(m => ({ ...m, connectableTo: e.target.value }))}
                style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", outline: "none" }}>
                <option value="">— select contact —</option>
                {data.contacts.filter(c => c.id !== modal.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <Input label="LinkedIn URL" value={modal.linkedin} onChange={v => setModal(m => ({ ...m, linkedin: v }))} placeholder="https://linkedin.com/in/..." />
          <Input label="Email" value={modal.email} onChange={v => setModal(m => ({ ...m, email: v }))} />
          <Textarea label="Notes" value={modal.notes} onChange={v => setModal(m => ({ ...m, notes: v }))} />

          {/* Action items on contact — for pre-outreach leads */}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: "16px", paddingTop: "14px" }}>
            <button onClick={() => { setShowContactActions(s => !s); if (!showContactActions && pendingContactActions.length === 0) setPendingContactActions([emptyActionItem(null, modal.id)]); }}
              style={{ background: "transparent", border: "none", color: showContactActions ? "#4F646F" : "var(--text-tertiary)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px" }}>{showContactActions ? "▾" : "▸"}</span>
              ACTION ITEMS {pendingContactActions.length > 0 && <span style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444433", borderRadius: "4px", padding: "1px 6px", fontSize: "10px" }}>{pendingContactActions.filter(a => !a.done).length} open</span>}
            </button>
            <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "3px", marginLeft: "20px" }}>Relationship actions not tied to a specific outreach — surfaces on dashboard as Contact Actions</div>
            {showContactActions && (
              <div style={{ marginTop: "12px" }}>
                {pendingContactActions.map((ai, i) => (
                  <div key={ai.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={ai.done} onChange={e => setPendingContactActions(prev => prev.map((a, j) => j === i ? { ...a, done: e.target.checked } : a))}
                          style={{ accentColor: "#10b981", width: "14px", height: "14px" }} />
                        <span style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Action {i + 1}</span>
                      </div>
                      <button onClick={() => setPendingContactActions(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: "14px" }}>×</button>
                    </div>
                    <input value={ai.description} onChange={e => setPendingContactActions(prev => prev.map((a, j) => j === i ? { ...a, description: e.target.value } : a))}
                      placeholder="e.g. Reach out to intro yourself..."
                      style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "5px", padding: "7px 9px", fontSize: "12px", outline: "none", marginBottom: "8px" }} />
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "5px" }}>Priority</div>
                        <div style={{ display: "flex", gap: "5px" }}>
                          {PRIORITIES.map(p => (
                            <button key={p} onClick={() => setPendingContactActions(prev => prev.map((a, j) => j === i ? { ...a, priority: p } : a))}
                              style={{ flex: 1, background: ai.priority === p ? PRIORITY_COLORS[p] + "22" : "transparent", border: `1px solid ${ai.priority === p ? PRIORITY_COLORS[p] : "var(--border)"}`, color: ai.priority === p ? PRIORITY_COLORS[p] : "var(--text-tertiary)", borderRadius: "4px", padding: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{p}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "5px" }}>Effort</div>
                        <div style={{ display: "flex", gap: "5px" }}>
                          {EFFORTS.map(e => (
                            <button key={e} onClick={() => setPendingContactActions(prev => prev.map((a, j) => j === i ? { ...a, effort: e } : a))}
                              style={{ flex: 1, background: ai.effort === e ? EFFORT_COLORS[e] + "22" : "transparent", border: `1px solid ${ai.effort === e ? EFFORT_COLORS[e] : "var(--border)"}`, color: ai.effort === e ? EFFORT_COLORS[e] : "var(--text-tertiary)", borderRadius: "4px", padding: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{e}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setPendingContactActions(prev => [...prev, emptyActionItem(null, modal.id)])}
                  style={{ width: "100%", background: "transparent", border: "1px dashed var(--border)", color: "var(--text-tertiary)", borderRadius: "6px", padding: "8px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                  + Add Another Action Item
                </button>
              </div>
            )}
          </div>

          <button onClick={() => save(modal)} className="btn-click" style={{ width: "100%", background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", marginTop: "16px" }}>SAVE</button>
        </Modal>
      )}

      {/* Mini Company Modal */}
      {miniCompany && (
        <Modal title="Quick Add Company" onClose={() => setMiniCompany(null)}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "12px", marginTop: 0 }}>Add the basics now — fill in the rest from the Companies tab later.</p>
          <Input label="Company Name *" value={miniCompany.name} onChange={v => setMiniCompany(m => ({ ...m, name: v }))} />
          <Select label="Vertical" value={miniCompany.vertical} onChange={v => setMiniCompany(m => ({ ...m, vertical: v }))} options={VERTICALS} />
          <Select label="Stage" value={miniCompany.stage} onChange={v => setMiniCompany(m => ({ ...m, stage: v }))} options={STAGES} />
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button onClick={() => setMiniCompany(null)}
              style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-tertiary)", borderRadius: "6px", padding: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={() => { if (miniCompany.name.trim()) saveMiniCompany(miniCompany); }}
              className="btn-click" style={{ flex: 2, background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
              SAVE & RETURN TO CONTACT
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── OUTREACH TAB ─────────────────────────────────────────────────────────────
const emptyOutreach = () => ({ id: genId(), contactId: "", jobId: "", channel: "Email", direction: "Sent", date: new Date().toISOString().slice(0, 10), summary: "", status: "Sent", draftReady: false, notes: "" });
const emptyMiniContact = () => ({ id: genId(), name: "", companyId: "", title: "", linkedin: "", email: "", contactType: [], howKnown: "Cold", connectableTo: "", notes: "" });
const emptyActionItem = (outreachId = null, contactId = null) => ({ id: genId(), outreachId, contactId, description: "", priority: "M", effort: "M", done: false, backlog: false, dueDate: "" });
const PRIORITIES = ["L", "M", "H"];
const EFFORTS = ["L", "M", "H"];
const PRIORITY_COLORS = { L: "#71717a", M: "#f59e0b", H: "#ef4444" };
const EFFORT_COLORS = { L: "#10b981", M: "#f59e0b", H: "#ef4444" };

const OutreachTab = ({ data, setData, dbSave, dbDelete, setOutreach, setContacts, setCompanies, setJobs, setActionItems, onError, userId }) => {
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("All");
  const [miniContact, setMiniContact] = useState(null);
  const [miniCompanyFromContact, setMiniCompanyFromContact] = useState(null);
  const [miniJob, setMiniJob] = useState(null);
  const [dupWarning, setDupWarning] = useState("");
  const [dupCompanyWarning, setDupCompanyWarning] = useState("");
  const [dupJobWarning, setDupJobWarning] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [pendingActions, setPendingActions] = useState([]);
  const [savingContact, setSavingContact] = useState(false);
  const [feedView, setFeedView] = useState(true);

  const save = async (rec) => {
    const isNew = !rec.id || rec.id.startsWith("new_");
    const snake = {
      contact_id: rec.contactId || null, job_id: rec.jobId || null,
      channel: rec.channel, direction: rec.direction,
      date: rec.date || null, summary: rec.summary || null,
      status: rec.status, draft_ready: rec.draftReady || false,
      notes: rec.notes || null,
    };
    let savedId = rec.id;
    if (isNew) {
      const { data: inserted, error } = await supabase.from("outreach").insert({ ...snake, user_id: userId }).select().single();
      if (!error && inserted) {
        setOutreach(prev => [{ ...inserted, contactId: inserted.contact_id, jobId: inserted.job_id, draftReady: inserted.draft_ready }, ...prev]);
        savedId = inserted.id;
      } else { console.error("Outreach insert error:", error); onError("Failed to save outreach — please try again."); return; }
    } else {
      const { error } = await supabase.from("outreach").update(snake).eq("id", rec.id);
      if (!error) setOutreach(prev => prev.map(o => o.id === rec.id ? { ...o, ...snake, contactId: snake.contact_id, jobId: snake.job_id, draftReady: snake.draft_ready, id: rec.id } : o));
      else { console.error("Outreach update error:", error); onError("Failed to save outreach — please try again."); return; }
    }
    for (const ai of pendingActions) {
      if (ai.description && ai.description.trim()) {
        const aiSnake = {
          outreach_id: savedId, contact_id: null,
          description: ai.description, priority: ai.priority,
          effort: ai.effort, done: ai.done || false, backlog: ai.backlog || false,
          due_date: ai.dueDate || null,
        };
        if (ai.id && !ai.id.startsWith("new_")) {
          await supabase.from("action_items").update(aiSnake).eq("id", ai.id);
        } else {
          const { data: newAi } = await supabase.from("action_items").insert({ ...aiSnake, user_id: userId }).select().single();
          if (newAi) setActionItems(prev => [...prev, { ...newAi, contactId: newAi.contact_id, outreachId: newAi.outreach_id }]);
        }
      }
    }
    setModal(null);
    setPendingActions([]);
    setShowActions(false);
  };

  const openModal = (rec) => {
    setModal(rec);
    setDupWarning("");
    setShowActions(false);
    const existing = (data.actionItems || []).filter(a => a.outreachId === rec.id);
    setPendingActions(existing.length > 0 ? existing : []);
    if (existing.length > 0) setShowActions(true);
  };

  const del = async (id) => {
    await supabase.from("action_items").delete().eq("outreach_id", id);
    dbDelete("outreach", id, setOutreach);
  };
  const ctName = (id) => data.contacts.find(c => c.id === id)?.name || "—";
  const jobTitle = (id) => {
    const j = data.jobs.find(j => j.id === id);
    if (!j) return "—";
    const co = data.companies.find(c => c.id === j.companyId);
    return `${j.title}${co ? ` @ ${co.name}` : ""}`;
  };
  const actionCount = (outreachId) => (data.actionItems || []).filter(a => a.outreachId === outreachId && !a.done).length;

  const saveMiniContact = async (ct) => {
    if (savingContact) return;
    setSavingContact(true);
    const dup = data.contacts.find(c => c.name.toLowerCase().trim() === ct.name.toLowerCase().trim());
    if (dup) {
      setDupWarning(`"${dup.name}" already exists. Selecting them instead.`);
      setModal(m => ({ ...m, contactId: dup.id }));
      setMiniContact(null);
      setSavingContact(false);
      return;
    }
    const { data: inserted } = await supabase.from("contacts").insert({ name: ct.name, company_id: ct.companyId || null, title: ct.title, contact_type: [], how_known: "Cold", user_id: userId }).select().single();
    if (inserted) {
      setContacts(prev => [inserted, ...prev]);
      setModal(m => ({ ...m, contactId: inserted.id }));
    }
    setMiniContact(null);
    setDupWarning("");
    setSavingContact(false);
  };

  const saveMiniCompanyFromContact = async (co) => {
    const dup = data.companies.find(c => c.name.toLowerCase().trim() === co.name.toLowerCase().trim());
    if (dup) {
      setDupCompanyWarning(`"${dup.name}" already exists. Selecting it instead.`);
      setMiniContact(m => ({ ...m, companyId: dup.id }));
      setMiniCompanyFromContact(null);
      return;
    }
    const { data: inserted } = await supabase.from("companies").insert({ name: co.name, vertical: co.vertical, stage: co.stage, user_id: userId }).select().single();
    if (inserted) {
      setCompanies(prev => [inserted, ...prev]);
      setMiniContact(m => ({ ...m, companyId: inserted.id }));
    }
    setMiniCompanyFromContact(null);
    setDupCompanyWarning("");
  };

  const saveMiniJob = async (job) => {
    const dup = data.jobs.find(j => j.title.toLowerCase().trim() === job.title.toLowerCase().trim());
    if (dup) {
      setDupJobWarning(`"${dup.title}" already exists. Selecting it instead.`);
      setModal(m => ({ ...m, jobId: dup.id }));
      setMiniJob(null);
      return;
    }
    const { data: inserted } = await supabase.from("jobs").insert({ title: job.title, company_id: job.companyId || null, status: job.status, date_added: new Date().toISOString().slice(0, 10), user_id: userId }).select().single();
    if (inserted) {
      setJobs(prev => [{ ...inserted, companyId: inserted.company_id, dateAdded: inserted.date_added, jdLink: inserted.jd_link, resumeLink: inserted.resume_link, coverLetterLink: inserted.cover_letter_link }, ...prev]);
      setModal(m => ({ ...m, jobId: inserted.id }));
    }
    setMiniJob(null);
    setDupJobWarning("");
  };

  const filtered = filter === "All" ? data.outreach : data.outreach.filter(o => o.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  const cols = [
    { key: "date", label: "Date" },
    { key: "contactId", label: "Contact", render: v => <span style={{ color: "var(--text-primary)" }}>{ctName(v)}</span>, cardPrimary: true },
    { key: "jobId", label: "Re: Job", render: v => jobTitle(v) },
    { key: "channel", label: "Channel", hideInCard: true },
    { key: "direction", label: "Dir", render: v => <span style={{ color: v === "Sent" ? "#3b82f6" : "#10b981" }}>{v}</span>, hideInCard: true },
    { key: "status", label: "Status", render: v => <Badge label={v} /> },
    { key: "summary", label: "Summary" },
    { key: "id", label: "Actions", render: (v) => {
      const count = actionCount(v);
      return count > 0
        ? <span style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444433", borderRadius: "4px", padding: "2px 7px", fontSize: "11px", fontWeight: 700 }}>{count} open</span>
        : <span style={{ color: "var(--border)", fontSize: "11px" }}>—</span>;
    }},
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Outreach</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{data.outreach.length} touchpoints</div>
        </div>
        <button onClick={() => { setModal(emptyOutreach()); setDupWarning(""); setPendingActions([]); setShowActions(false); }} className="btn-click" style={{ background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "9px 16px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>+ ADD OUTREACH</button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "8px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["All", ...OUTREACH_STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              background: filter === s ? "#4F646F18" : "transparent",
              border: `1px solid ${filter === s ? "#4F646F" : "var(--border)"}`,
              color: filter === s ? "#4F646F" : "var(--text-tertiary)",
              borderRadius: "5px", padding: "4px 12px", fontSize: "11px",
              fontWeight: 600, cursor: "pointer",
            }}>{s}</button>
          ))}
        </div>
        <div className="board-toggle" style={{ display: "flex", gap: "6px" }}>
          {[{ v: true, label: "Feed" }, { v: false, label: "Table" }].map(({ v, label }) => (
            <button key={label} onClick={() => setFeedView(v)} style={{
              background: feedView === v ? "#8b5cf618" : "transparent",
              border: `1px solid ${feedView === v ? "#8b5cf6" : "var(--border)"}`,
              color: feedView === v ? "#8b5cf6" : "var(--text-tertiary)",
              borderRadius: "5px", padding: "4px 11px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Feed view (desktop) */}
      {feedView && (() => {
        const fmtDate = (d) => {
          if (!d) return "No Date";
          const [y, m, day] = d.split("-").map(Number);
          return new Date(y, m - 1, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        };
        const groups = {};
        const order = [];
        sorted.forEach(o => {
          const k = o.date || "no-date";
          if (!groups[k]) { groups[k] = []; order.push(k); }
          groups[k].push(o);
        });
        return (
          <div className="table-desktop">
            {sorted.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>No outreach yet — add one above</div>}
            {order.map(date => (
              <div key={date} style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid var(--border-subtle)" }}>
                  {fmtDate(date)}
                </div>
                {groups[date].map(o => (
                  <div key={o.id} style={{
                    background: "var(--modal-bg)",
                    border: "1px solid var(--border)",
                    borderLeft: `3px solid ${o.direction === "Sent" ? "#3b82f6" : "#10b981"}`,
                    borderRadius: "8px", padding: "12px 16px", marginBottom: "8px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{ctName(o.contactId)}</span>
                          <Badge label={o.status} />
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: o.summary ? "6px" : 0 }}>
                          {o.direction} via {o.channel}{o.jobId ? ` · ${jobTitle(o.jobId)}` : ""}
                        </div>
                        {o.summary && <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4" }}>{o.summary}</div>}
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                        {actionCount(o.id) > 0 && <span style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444433", borderRadius: "4px", padding: "2px 7px", fontSize: "11px", fontWeight: 700 }}>{actionCount(o.id)} open</span>}
                        <button onClick={() => openModal(o)} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", borderRadius: "4px", padding: "3px 9px", fontSize: "11px" }}>Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })()}
      {feedView && <div className="table-mobile"><Table cols={cols} rows={sorted} onEdit={openModal} onDelete={del} /></div>}

      {/* Table view */}
      {!feedView && <Table cols={cols} rows={sorted} onEdit={openModal} onDelete={del} />}

      {/* Outreach Modal */}
      {modal && !miniContact && !miniJob && (
        <Modal title="Outreach Entry" onClose={() => { setModal(null); setPendingActions([]); setShowActions(false); }}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>Contact</label>
            <select value={modal.contactId} onChange={e => setModal(m => ({ ...m, contactId: e.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", outline: "none" }}>
              <option value="">— select contact —</option>
              {data.contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setMiniContact(emptyMiniContact())}
              style={{ marginTop: "6px", background: "transparent", border: "1px dashed #334155", color: "var(--text-tertiary)", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", width: "100%" }}>
              + Add New Contact
            </button>
            {dupWarning && <div style={{ marginTop: "6px", fontSize: "11px", color: "#4F646F" }}>⚠ {dupWarning}</div>}
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>Related Job (optional)</label>
            <select value={modal.jobId} onChange={e => { setModal(m => ({ ...m, jobId: e.target.value })); setDupJobWarning(""); }}
              style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", outline: "none" }}>
              <option value="">— none —</option>
              {data.jobs.map(j => <option key={j.id} value={j.id}>{jobTitle(j.id)}</option>)}
            </select>
            <button onClick={() => setMiniJob({ title: "", companyId: "", status: "Interested" })}
              style={{ marginTop: "6px", background: "transparent", border: "1px dashed #334155", color: "var(--text-tertiary)", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", width: "100%" }}>
              + Add New Job
            </button>
            {dupJobWarning && <div style={{ marginTop: "6px", fontSize: "11px", color: "#4F646F" }}>⚠ {dupJobWarning}</div>}
          </div>
          <Select label="Channel" value={modal.channel} onChange={v => setModal(m => ({ ...m, channel: v }))} options={CHANNELS} />
          <Select label="Direction" value={modal.direction} onChange={v => setModal(m => ({ ...m, direction: v }))} options={DIRECTIONS} />
          <Input label="Date" value={modal.date} onChange={v => setModal(m => ({ ...m, date: v }))} type="date" />
          <Input label="Subject / Summary" value={modal.summary} onChange={v => setModal(m => ({ ...m, summary: v }))} />
          <Select label="Status" value={modal.status} onChange={v => setModal(m => ({ ...m, status: v }))} options={OUTREACH_STATUSES} />
          <Checkbox label="Draft ready" value={modal.draftReady} onChange={v => setModal(m => ({ ...m, draftReady: v }))} />
          <Textarea label="Notes" value={modal.notes} onChange={v => setModal(m => ({ ...m, notes: v }))} />

          {/* Progressive disclosure — action items */}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: "16px", paddingTop: "14px" }}>
            <button onClick={() => { setShowActions(s => !s); if (!showActions && pendingActions.length === 0) setPendingActions([emptyActionItem(modal.id)]); }}
              style={{ background: "transparent", border: "none", color: showActions ? "#4F646F" : "var(--text-tertiary)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px" }}>{showActions ? "▾" : "▸"}</span>
              ACTION ITEMS {pendingActions.length > 0 && <span style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444433", borderRadius: "4px", padding: "1px 6px", fontSize: "10px" }}>{pendingActions.filter(a => !a.done).length} open</span>}
            </button>
            <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "3px", marginLeft: "20px" }}>For follow-up tasks that came out of this touchpoint</div>

            {showActions && (
              <div style={{ marginTop: "12px" }}>
                {pendingActions.map((ai, i) => (
                  <div key={ai.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={ai.done} onChange={e => setPendingActions(prev => prev.map((a, j) => j === i ? { ...a, done: e.target.checked } : a))}
                          style={{ accentColor: "#10b981", width: "14px", height: "14px" }} />
                        <span style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action {i + 1}</span>
                      </div>
                      <button onClick={() => setPendingActions(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: "14px" }}>×</button>
                    </div>
                    <input value={ai.description} onChange={e => setPendingActions(prev => prev.map((a, j) => j === i ? { ...a, description: e.target.value } : a))}
                      placeholder="What needs to be done..."
                      style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "5px", padding: "7px 9px", fontSize: "12px", outline: "none", marginBottom: "8px" }} />
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" }}>Priority</div>
                        <div style={{ display: "flex", gap: "5px" }}>
                          {PRIORITIES.map(p => (
                            <button key={p} onClick={() => setPendingActions(prev => prev.map((a, j) => j === i ? { ...a, priority: p } : a))}
                              style={{ flex: 1, background: ai.priority === p ? PRIORITY_COLORS[p] + "22" : "transparent", border: `1px solid ${ai.priority === p ? PRIORITY_COLORS[p] : "var(--border)"}`, color: ai.priority === p ? PRIORITY_COLORS[p] : "var(--text-tertiary)", borderRadius: "4px", padding: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{p}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" }}>Effort</div>
                        <div style={{ display: "flex", gap: "5px" }}>
                          {EFFORTS.map(e => (
                            <button key={e} onClick={() => setPendingActions(prev => prev.map((a, j) => j === i ? { ...a, effort: e } : a))}
                              style={{ flex: 1, background: ai.effort === e ? EFFORT_COLORS[e] + "22" : "transparent", border: `1px solid ${ai.effort === e ? EFFORT_COLORS[e] : "var(--border)"}`, color: ai.effort === e ? EFFORT_COLORS[e] : "var(--text-tertiary)", borderRadius: "4px", padding: "4px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>{e}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setPendingActions(prev => [...prev, emptyActionItem(modal.id)])}
                  style={{ width: "100%", background: "transparent", border: "1px dashed var(--border)", color: "var(--text-tertiary)", borderRadius: "6px", padding: "8px", fontSize: "11px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>
                  + Add Another Action Item
                </button>
              </div>
            )}
          </div>

          <button onClick={() => save(modal)} className="btn-click" style={{ width: "100%", background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", marginTop: "16px" }}>SAVE</button>
        </Modal>
      )}

      {/* Mini Contact Modal */}
      {miniContact && !miniCompanyFromContact && (
        <Modal title="Quick Add Contact" onClose={() => setMiniContact(null)}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "12px", marginTop: 0 }}>Add the basics now — fill in the rest from the Contacts tab later.</p>
          <Input label="Name *" value={miniContact.name} onChange={v => setMiniContact(m => ({ ...m, name: v }))} />
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>Company (optional)</label>
            <select value={miniContact.companyId} onChange={e => setMiniContact(m => ({ ...m, companyId: e.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", outline: "none" }}>
              <option value="">— select company —</option>
              {data.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setMiniCompanyFromContact(emptyMiniCompany())}
              style={{ marginTop: "6px", background: "transparent", border: "1px dashed #334155", color: "var(--text-tertiary)", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer", width: "100%" }}>
              + Add New Company
            </button>
            {dupCompanyWarning && <div style={{ marginTop: "6px", fontSize: "11px", color: "#4F646F" }}>⚠ {dupCompanyWarning}</div>}
          </div>
          <Input label="Title / Role" value={miniContact.title} onChange={v => setMiniContact(m => ({ ...m, title: v }))} />
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button onClick={() => setMiniContact(null)}
              style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-tertiary)", borderRadius: "6px", padding: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={() => { if (miniContact.name.trim()) saveMiniContact(miniContact); }}
              disabled={savingContact}
              className="btn-click"
              style={{ flex: 2, background: savingContact ? "#94a3b8" : "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: savingContact ? "not-allowed" : "pointer" }}>
              {savingContact ? "SAVING..." : "SAVE & RETURN TO OUTREACH"}
            </button>
          </div>
        </Modal>
      )}

      {/* Mini Company Modal (nested from Mini Contact) */}
      {miniCompanyFromContact && (
        <Modal title="Quick Add Company" onClose={() => setMiniCompanyFromContact(null)}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "12px", marginTop: 0 }}>Add the basics — you'll return to the contact form after this.</p>
          <div style={{ marginBottom: "10px", padding: "8px 12px", background: "var(--input-bg)", borderRadius: "6px", fontSize: "11px", color: "var(--text-tertiary)" }}>
            📍 Outreach → New Contact → <span style={{ color: "#4F646F" }}>New Company</span>
          </div>
          <Input label="Company Name *" value={miniCompanyFromContact.name} onChange={v => setMiniCompanyFromContact(m => ({ ...m, name: v }))} />
          <Select label="Vertical" value={miniCompanyFromContact.vertical} onChange={v => setMiniCompanyFromContact(m => ({ ...m, vertical: v }))} options={VERTICALS} />
          <Select label="Stage" value={miniCompanyFromContact.stage} onChange={v => setMiniCompanyFromContact(m => ({ ...m, stage: v }))} options={STAGES} />
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button onClick={() => setMiniCompanyFromContact(null)}
              style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-tertiary)", borderRadius: "6px", padding: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={() => { if (miniCompanyFromContact.name.trim()) saveMiniCompanyFromContact(miniCompanyFromContact); }}
              className="btn-click" style={{ flex: 2, background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
              SAVE & RETURN TO CONTACT
            </button>
          </div>
        </Modal>
      )}

      {/* Mini Job Modal */}
      {miniJob && (
        <Modal title="Quick Add Job" onClose={() => setMiniJob(null)}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "12px", marginTop: 0 }}>Add the basics now — fill in the rest from the Jobs tab later.</p>
          <div style={{ marginBottom: "10px", padding: "8px 12px", background: "var(--input-bg)", borderRadius: "6px", fontSize: "11px", color: "var(--text-tertiary)" }}>
            📍 Outreach → <span style={{ color: "#4F646F" }}>New Job</span>
          </div>
          <Input label="Job Title *" value={miniJob.title} onChange={v => setMiniJob(m => ({ ...m, title: v }))} />
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>Company (optional)</label>
            <select value={miniJob.companyId} onChange={e => setMiniJob(m => ({ ...m, companyId: e.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", outline: "none" }}>
              <option value="">— select company —</option>
              {data.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Select label="Status" value={miniJob.status} onChange={v => setMiniJob(m => ({ ...m, status: v }))} options={JOB_STATUSES} />
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button onClick={() => setMiniJob(null)}
              style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-tertiary)", borderRadius: "6px", padding: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={() => { if (miniJob.title.trim()) saveMiniJob(miniJob); }}
              className="btn-click" style={{ flex: 2, background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
              SAVE & RETURN TO OUTREACH
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};


// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────
const DashboardTab = ({ data, setData, onEditOutreach, onEditJob }) => {
  const [showBacklog, setShowBacklog] = useState(false);
  const [showNoResponse, setShowNoResponse] = useState(false);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const allOpenActions = (data.actionItems || []).filter(a => !a.done && !a.backlog);
  const backlogActions  = (data.actionItems || []).filter(a => !a.done && a.backlog);
  const followUpOutreach = data.outreach.filter(o => o.status === "Follow-up Needed");
  const noResponse       = data.outreach.filter(o => o.status === "No Response");

  // ── Stat card values ─────────────────────────────────────────────────────────
  const openActionsCount  = allOpenActions.length;
  const followUpsDueCount = followUpOutreach.length;
  const interviewingCount = data.jobs.filter(j => j.status === "Interviewing").length;
  const appsSentCount     = data.jobs.filter(j => j.status === "Applied").length;

  // ── Unified sorted list (action items + follow-up outreach) ──────────────────
  const PRIORITY_ORDER = { H: 0, M: 1, L: 2 };
  const EFFORT_ORDER   = { L: 0, M: 1, H: 2 };
  const unifiedItems = [
    ...allOpenActions.map(a => ({ _kind: "action", ...a })),
    ...followUpOutreach.map(o => ({ _kind: "followup", ...o })),
  ].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 3;
    const pb = PRIORITY_ORDER[b.priority] ?? 3;
    if (pa !== pb) return pa - pb;
    const ea = EFFORT_ORDER[a.effort] ?? 3;
    const eb = EFFORT_ORDER[b.effort] ?? 3;
    return ea - eb;
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const ctName = id => data.contacts.find(c => c.id === id)?.name || "—";
  const outreachSummary = id => data.outreach.find(o => o.id === id)?.summary || "—";
  const outreachContact = id => { const o = data.outreach.find(o => o.id === id); return o ? ctName(o.contactId) : "—"; };

  const markDone = async id => {
    await supabase.from("action_items").update({ done: true }).eq("id", id);
    setData(d => ({ ...d, actionItems: d.actionItems.map(x => x.id === id ? { ...x, done: true } : x) }));
  };
  const moveToBacklog = async id => {
    await supabase.from("action_items").update({ backlog: true }).eq("id", id);
    setData(d => ({ ...d, actionItems: d.actionItems.map(x => x.id === id ? { ...x, backlog: true } : x) }));
  };
  const restoreFromBacklog = async id => {
    await supabase.from("action_items").update({ backlog: false }).eq("id", id);
    setData(d => ({ ...d, actionItems: d.actionItems.map(x => x.id === id ? { ...x, backlog: false } : x) }));
  };

  const StatCard = ({ label, value, color }) => (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", flex: 1, minWidth: "90px" }}>
      <div style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: color || "var(--text-primary)", fontFamily: "'DM Mono', monospace" }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Dashboard</div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "24px" }}>Overview</div>

      {/* ── Stat cards ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "28px" }}>
        <StatCard label="Open Actions"  value={openActionsCount}  color={openActionsCount  > 0 ? "#ef4444" : "var(--text-primary)"} />
        <StatCard label="Follow-ups Due" value={followUpsDueCount} color={followUpsDueCount > 0 ? "#f59e0b" : "var(--text-primary)"} />
        <StatCard label="Interviewing"  value={interviewingCount} color={STATUS_COLORS.Interviewing} />
        <StatCard label="Apps Sent"     value={appsSentCount} />
      </div>

      {/* ── Unified Actions list ────────────────────────────────────────────────── */}
      {unifiedItems.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>Actions</div>
          {unifiedItems.map(item => {
            if (item._kind === "action") {
              const a = item;
              const contact = a.contactId ? data.contacts.find(c => c.id === a.contactId) : null;
              const company = contact ? data.companies.find(co => co.id === contact.companyId) : null;
              return (
                <div key={a.id} className="dash-action-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid #3b82f6", borderRadius: "8px", padding: "14px 16px", marginBottom: "8px" }}>
                  <div onClick={() => markDone(a.id)}
                    style={{ width: "26px", height: "26px", border: `2px solid ${a.done ? "#10b981" : "#94a3b8"}`, borderRadius: "5px", background: a.done ? "#10b981" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {a.done && <span style={{ color: "white", fontSize: "15px", lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, fontSize: "14px", fontWeight: 500, color: a.done ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: a.done ? "line-through" : "none" }}>{a.description}</div>
                  <div className="dash-action-meta">
                    {a.outreachId && (
                      <span style={{ whiteSpace: "nowrap", fontSize: "13px" }}>
                        <span style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>outreach </span>
                        <button onClick={() => { const o = data.outreach.find(o => o.id === a.outreachId); if (o) onEditOutreach(o); }}
                          style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "13px", cursor: "pointer", padding: 0 }}>
                          {outreachContact(a.outreachId)} · {outreachSummary(a.outreachId)} ↗
                        </button>
                      </span>
                    )}
                    {a.contactId && !a.outreachId && contact && (
                      <span style={{ whiteSpace: "nowrap", fontSize: "13px", color: "var(--text-secondary)" }}>
                        {contact.name}{company ? ` · ${company.name}` : ""}
                      </span>
                    )}
                    <button onClick={() => moveToBacklog(a.id)} className="btn-click"
                      style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-tertiary)", borderRadius: "4px", padding: "4px 10px", fontSize: "13px", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                      ⏸ Backlog
                    </button>
                  </div>
                </div>
              );
            } else {
              const o = item;
              return (
                <div key={o.id} onClick={() => onEditOutreach(o)} className="dash-action-card"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid #f59e0b", borderRadius: "8px", padding: "14px 16px", marginBottom: "8px", cursor: "pointer" }}>
                  <div style={{ flex: 1, fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{ctName(o.contactId)}</div>
                  <div className="dash-action-meta">
                    <span style={{ whiteSpace: "nowrap", fontSize: "13px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>re </span>
                      <span style={{ color: "var(--text-secondary)" }}>{o.summary}</span>
                    </span>
                    <span style={{ whiteSpace: "nowrap", fontSize: "13px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>date </span>
                      <span style={{ color: "var(--text-secondary)" }}>{o.date}</span>
                    </span>
                    <span style={{ color: "#3b82f6", fontSize: "13px", whiteSpace: "nowrap" }}>edit ↗</span>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* ── Backlog (collapsed) ─────────────────────────────────────────────────── */}
      {backlogActions.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <button onClick={() => setShowBacklog(s => !s)} style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px" }}>{showBacklog ? "▾" : "▸"}</span>
            BACKLOG <span style={{ fontSize: "10px", color: "var(--text-tertiary)", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1px 6px", fontFamily: "'DM Mono', monospace" }}>{backlogActions.length}</span>
          </button>
          {showBacklog && backlogActions.map(a => (
            <div key={a.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>{a.description}</div>
                <div style={{ color: "var(--text-tertiary)", fontSize: "11px", marginTop: "2px" }}>re: {data.contacts.find(c => c.id === (data.outreach.find(o => o.id === a.outreachId)?.contactId))?.name || "—"}</div>
              </div>
              <button onClick={() => restoreFromBacklog(a.id)}
                style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-tertiary)", borderRadius: "4px", padding: "3px 8px", fontSize: "10px", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>restore</button>
            </div>
          ))}
        </div>
      )}

      {/* ── No Response (collapsed) ─────────────────────────────────────────────── */}
      {noResponse.length > 0 && (
        <div>
          <button onClick={() => setShowNoResponse(s => !s)} style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px" }}>{showNoResponse ? "▾" : "▸"}</span>
            NO RESPONSE <span style={{ fontSize: "10px", color: "var(--text-tertiary)", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1px 6px", fontFamily: "'DM Mono', monospace" }}>{noResponse.length}</span>
          </button>
          {showNoResponse && noResponse.map(o => (
            <div key={o.id} onClick={() => onEditOutreach(o)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--text-tertiary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
              <div>
                <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{ctName(o.contactId)}</div>
                <div style={{ color: "var(--text-tertiary)", fontSize: "11px", marginTop: "2px" }}>{o.summary} · {o.date}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Badge label="No Response" />
                <span style={{ color: "#3b82f6", fontSize: "11px" }}>edit ↗</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── LOGIN / LANDING ──────────────────────────────────────────────────────────
const LANDING_FEATURES = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="3" cy="3" r="2" stroke="#4F646F" strokeWidth="1.5"/>
        <circle cx="13" cy="3" r="2" stroke="#4F646F" strokeWidth="1.5"/>
        <circle cx="8" cy="13" r="2" stroke="#4F646F" strokeWidth="1.5"/>
        <line x1="3" y1="5" x2="8" y2="11" stroke="#4F646F" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="13" y1="5" x2="8" y2="11" stroke="#4F646F" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    label: "Relational model",
    desc: "Companies, jobs, and contacts are linked — see the full picture, not disconnected spreadsheets.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="#4F646F" strokeWidth="1.5"/>
        <line x1="4" y1="6" x2="12" y2="6" stroke="#4F646F" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="9" x2="10" y2="9" stroke="#4F646F" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    label: "Outreach log",
    desc: "Every call, email, and message recorded with context. Never go blank before a follow-up.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="#4F646F" strokeWidth="1.5"/>
        <polyline points="5,8 7,10.5 11,5.5" stroke="#4F646F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: "Action items",
    desc: "Know exactly what's next for every relationship — prioritized, not buried in notes.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="3" width="4" height="10" rx="1" stroke="#4F646F" strokeWidth="1.5"/>
        <rect x="6" y="3" width="4" height="7" rx="1" stroke="#4F646F" strokeWidth="1.5"/>
        <rect x="11" y="3" width="4" height="5" rx="1" stroke="#4F646F" strokeWidth="1.5"/>
      </svg>
    ),
    label: "Kanban pipeline",
    desc: "Visualize your job applications as a board. Drag across stages as things progress.",
  },
];

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setError("Couldn't send link — check the email and try again.");
    else setSent(true);
  };

  return (
    <div className="landing-container">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav className="landing-nav">
        <div style={{ width: "28px", height: "28px", background: "#4F646F", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontSize: "14px", fontWeight: 800 }}>R</span>
        </div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>recruiting.crm</span>
      </nav>

      {/* Body */}
      <div className="landing-body">
        <div className="landing-inner">

          {/* Hero */}
          <div className="landing-hero">
            <h1 style={{ margin: "0 0 16px", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Your job search is<br />a relationship game.
            </h1>
            <p style={{ margin: "0 0 44px", fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "400px" }}>
              Track every company, contact, and conversation in one relational CRM — so nothing falls through the cracks when it matters most.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              {LANDING_FEATURES.map(f => (
                <div key={f.label} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{ width: "34px", height: "34px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>{f.label}</div>
                    <div style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.55 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auth card */}
          <div className="landing-auth">
            {sent ? (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>📬</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>Check your email</div>
                <div style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.65 }}>
                  We sent a magic link to{" "}
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{email}</span>.
                  Click it to sign in.
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "32px" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>Sign in to your CRM</div>
                <div style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.6, marginBottom: "24px" }}>
                  Enter your email and we'll send a secure link — no password needed.
                </div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendLink()}
                  placeholder="you@example.com"
                  style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "6px", padding: "10px 12px", fontSize: "14px", outline: "none", marginBottom: "14px" }}
                />
                {error && <div style={{ fontSize: "12px", color: "#ef4444", marginBottom: "12px" }}>{error}</div>}
                <button
                  onClick={sendLink}
                  disabled={loading}
                  className="btn-click"
                  style={{ width: "100%", background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "11px", fontWeight: 700, fontSize: "13px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Sending…" : "Send magic link"}
                </button>
                <div style={{ marginTop: "16px", fontSize: "11px", color: "var(--text-tertiary)", textAlign: "center", lineHeight: 1.5 }}>
                  By signing in, you agree that your data is stored securely and never shared.
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
          recruiting.crm · Your data is yours · Built by Kumar @ Haas
        </span>
      </div>
    </div>
  );
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth state ───────────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [outreach, setOutreach] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showError = (msg) => setToast(msg);
  const [tab, setTab] = useState("dashboard");
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importVal, setImportVal] = useState("");
  const [dashOutreachModal, setDashOutreachModal] = useState(null);
  const [dashJobModal, setDashJobModal] = useState(null);
  const [dashOutreachActions, setDashOutreachActions] = useState([]);
  const [dashShowActions, setDashShowActions] = useState(false);

  // ── Quick Add (natural language) state ───────────────────────────────────────
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddResult, setQuickAddResult] = useState(null);
  const [quickAddSaving, setQuickAddSaving] = useState(false);

  // ── Premium gating state ──────────────────────────────────────────────────────
  const [userTier, setUserTier] = useState("free");
  const [aiInterestSubmitted, setAiInterestSubmitted] = useState(false);
  const [premiumGateOpen, setPremiumGateOpen] = useState(false);
  const [premiumGateMsg, setPremiumGateMsg] = useState("");
  const [premiumGateSubmitting, setPremiumGateSubmitting] = useState(false);

  // ── Build data object for child components ───────────────────────────────────
  const data = { companies, jobs, contacts, outreach, actionItems };
  const setData = (updater) => {
    const updated = typeof updater === "function" ? updater(data) : updater;
    if (updated.companies !== companies) setCompanies(updated.companies);
    if (updated.jobs !== jobs) setJobs(updated.jobs);
    if (updated.contacts !== contacts) setContacts(updated.contacts);
    if (updated.outreach !== outreach) setOutreach(updated.outreach);
    if (updated.actionItems !== actionItems) setActionItems(updated.actionItems);
  };

  // ── Fetch all data once authenticated ────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const fetchAll = async () => {
      setLoading(true);
      const [co, jo, ct, ou, ai, profileRes, interestRes] = await Promise.all([
        supabase.from("companies").select("*").order("created_at", { ascending: false }),
        supabase.from("jobs").select("*").order("created_at", { ascending: false }),
        supabase.from("contacts").select("*").order("created_at", { ascending: false }),
        supabase.from("outreach").select("*").order("date", { ascending: false }),
        supabase.from("action_items").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("tier").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("ai_interest").select("id").eq("user_id", session.user.id).maybeSingle(),
      ]);
      setUserTier(profileRes.data?.tier || "free");
      setAiInterestSubmitted(!!interestRes.data);
      setCompanies(co.data || []);
      setJobs((jo.data || []).map(j => ({
        ...j,
        companyId: j.company_id,
        dateAdded: j.date_added,
        jdLink: j.jd_link,
        resumeLink: j.resume_link,
        coverLetterLink: j.cover_letter_link,
      })));
      setContacts((ct.data || []).map(c => ({
        ...c,
        companyId: c.company_id,
        contactType: c.contact_type,
        howKnown: c.how_known,
        connectableTo: c.connectable_to,
      })));
      setOutreach((ou.data || []).map(o => ({ ...o, contactId: o.contact_id, jobId: o.job_id, draftReady: o.draft_ready })));
      setActionItems((ai.data || []).map(a => ({
        ...a,
        outreachId: a.outreach_id,
        contactId: a.contact_id,
        dueDate: a.due_date,
      })));
      setLoading(false);
    };
    fetchAll();
  }, [session?.user?.id]);

  // ── Supabase helpers ──────────────────────────────────────────────────────────
  const toSnake = (obj) => {
    const map = {
      companyId: "company_id", jobId: "job_id", contactId: "contact_id",
      outreachId: "outreach_id", dateAdded: "date_added", jdLink: "jd_link",
      resumeLink: "resume_link", coverLetterLink: "cover_letter_link",
      contactType: "contact_type", howKnown: "how_known", connectableTo: "connectable_to",
      draftReady: "draft_ready", dueDate: "due_date",
    };
    // UUID fields that must be null not empty string
    const uuidFields = ["company_id", "job_id", "contact_id", "outreach_id", "connectable_to"];
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "id" || k === "created_at") continue;
      const snakeKey = map[k] || k;
      // coerce empty strings to null for UUID fields
      let val = v;
      if (uuidFields.includes(snakeKey) && (v === "" || v === undefined)) val = null;
      // coerce empty strings to null for date fields
      if ((snakeKey === "date_added" || snakeKey === "due_date") && (v === "" || v === undefined)) val = null;
      result[snakeKey] = val;
    }
    return result;
  };

  const toCamel = (obj) => {
    const map = {
      company_id: "companyId", job_id: "jobId", contact_id: "contactId",
      outreach_id: "outreachId", date_added: "dateAdded", jd_link: "jdLink",
      resume_link: "resumeLink", cover_letter_link: "coverLetterLink",
      contact_type: "contactType", how_known: "howKnown", connectable_to: "connectableTo",
      draft_ready: "draftReady", due_date: "dueDate",
    };
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      result[map[k] || k] = v;
    }
    return result;
  };

  const dbSave = async (table, record, setState) => {
    const snake = toSnake(record);
    if (record.id && !record.id.startsWith("new_")) {
      const { data: updated, error } = await supabase.from(table).update(snake).eq("id", record.id).select().single();
      if (!error) setState(prev => prev.map(r => r.id === record.id ? toCamel(updated) : r));
      else { console.error(`${table} update error:`, error); showError("Failed to save — please try again."); }
    } else {
      const { data: inserted, error } = await supabase.from(table).insert({ ...snake, user_id: session?.user?.id }).select().single();
      if (!error) setState(prev => [toCamel(inserted), ...prev]);
      else { console.error(`${table} insert error:`, error); showError("Failed to save — please try again."); }
    }
  };

  const dbDelete = async (table, id, setState) => {
    await supabase.from(table).delete().eq("id", id);
    setState(prev => prev.filter(r => r.id !== id));
  };

  // ── Dashboard handlers ────────────────────────────────────────────────────────
  const openDashOutreach = (rec) => {
    setDashOutreachModal(rec);
    const existing = actionItems.filter(a => a.outreachId === rec.id);
    setDashOutreachActions(existing);
    setDashShowActions(existing.length > 0);
  };

  const saveDashOutreach = async (rec) => {
    await dbSave("outreach", rec, setOutreach);
    for (const ai of dashOutreachActions) {
      const aiRecord = { ...ai, outreachId: rec.id };
      await dbSave("action_items", aiRecord, setActionItems);
    }
    setDashOutreachModal(null);
  };

  const saveDashJob = async (rec) => {
    await dbSave("jobs", rec, setJobs);
    setDashJobModal(null);
  };

  // ── Quick Add handlers ────────────────────────────────────────────────────────
  const parseQuickAdd = async () => {
    if (!quickAddText.trim()) return;
    setQuickAddLoading(true);
    setQuickAddResult(null);
    try {
      const res = await fetch("/api/parse-nlp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: quickAddText,
          currentDate: new Date().toISOString().slice(0, 10),
          existingCompanies: companies.map(c => ({ id: c.id, name: c.name })),
          existingContacts: contacts.map(c => ({ id: c.id, name: c.name })),
          existingJobs: jobs.map(j => ({ id: j.id, title: j.title, company: companies.find(c => c.id === j.companyId)?.name || "" })),
        }),
      });
      if (!res.ok) throw new Error("API error");
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setQuickAddResult(result);
    } catch (err) {
      showError("Failed to parse — make sure the app is deployed or run via vercel dev locally.");
    }
    setQuickAddLoading(false);
  };

  const saveQuickAdd = async () => {
    if (!quickAddResult?.records) return;
    setQuickAddSaving(true);
    let companyId = null;
    let jobId = null;
    let contactId = null;
    let outreachId = null;
    try {
      for (const record of quickAddResult.records) {
        if (record.type === "company") {
          if (record.action === "existing") { companyId = record.existingId; continue; }
          const { data, error } = await supabase.from("companies").insert({
            name: record.data.name, vertical: record.data.vertical || "Other",
            stage: record.data.stage || "N/A", website: record.data.website || null,
            notes: record.data.notes || null, user_id: session.user.id,
          }).select().single();
          if (error) throw error;
          companyId = data.id;
          setCompanies(prev => [toCamel(data), ...prev]);
        }

        if (record.type === "job") {
          if (record.action === "existing") { jobId = record.existingId; continue; }
          const resolvedCompanyId = companyId
            || companies.find(c => c.name.toLowerCase() === record.data.companyName?.toLowerCase())?.id
            || null;
          const { data, error } = await supabase.from("jobs").insert({
            title: record.data.title,
            company_id: resolvedCompanyId,
            function: record.data.function || "Other",
            source: record.data.source || "Other",
            status: record.data.status || "Applied",
            date_added: new Date().toISOString().split("T")[0],
            jd_link: record.data.jdLink || null,
            notes: record.data.notes || null,
            user_id: session.user.id,
          }).select().single();
          if (error) throw error;
          jobId = data.id;
          setJobs(prev => [toCamelJob(data), ...prev]);
        }

        if (record.type === "contact") {
          if (record.action === "existing") { contactId = record.existingId; continue; }
          const resolvedCompanyId = companyId
            || companies.find(c => c.name.toLowerCase() === record.data.companyName?.toLowerCase())?.id
            || null;
          const { data, error } = await supabase.from("contacts").insert({
            name: record.data.name, company_id: resolvedCompanyId,
            title: record.data.title || null,
            contact_type: record.data.contactType || ["Target"],
            how_known: record.data.howKnown || "Cold",
            linkedin: record.data.linkedin || null, email: record.data.email || null,
            notes: record.data.notes || null, user_id: session.user.id,
          }).select().single();
          if (error) throw error;
          contactId = data.id;
          setContacts(prev => [toCamel(data), ...prev]);
        }

        if (record.type === "outreach") {
          if (record.action === "existing") { outreachId = record.existingId; continue; }
          const resolvedContactId = contactId
            || contacts.find(c => c.name.toLowerCase() === record.data.contactName?.toLowerCase())?.id
            || null;
          const { data, error } = await supabase.from("outreach").insert({
            contact_id: resolvedContactId, job_id: jobId,
            channel: record.data.channel, direction: record.data.direction,
            date: record.data.date, summary: record.data.summary,
            status: record.data.status || "Sent",
            draft_ready: false, notes: record.data.notes || null,
            user_id: session.user.id,
          }).select().single();
          if (error) throw error;
          outreachId = data.id;
          setOutreach(prev => [toCamel(data), ...prev]);
        }

        if (record.type === "action_item") {
          const resolvedOutreachId = record.data.linkedTo === "outreach" ? outreachId : null;
          const resolvedContactId = record.data.linkedTo === "contact"
            ? (contactId || contacts.find(c => c.name.toLowerCase() === record.data.linkedName?.toLowerCase())?.id || null)
            : null;
          const { data, error } = await supabase.from("action_items").insert({
            outreach_id: resolvedOutreachId, contact_id: resolvedContactId,
            description: record.data.description,
            priority: record.data.priority || "M",
            effort: record.data.effort || "M",
            done: false, backlog: false,
            due_date: record.data.dueDate || null,
            user_id: session.user.id,
          }).select().single();
          if (error) throw error;
          setActionItems(prev => [toCamel(data), ...prev]);
        }
      }
      setQuickAddOpen(false);
      setQuickAddText("");
      setQuickAddResult(null);
    } catch (err) {
      console.error("Quick add save error:", err);
      showError("Failed to save some records — please check and try again.");
    }
    setQuickAddSaving(false);
  };

  // ── Premium gate interest submission ─────────────────────────────────────────
  const submitInterest = async () => {
    setPremiumGateSubmitting(true);
    try {
      const { error } = await supabase.from("ai_interest").insert({
        user_id: session.user.id,
        message: premiumGateMsg.trim() || null,
      });
      if (error) throw error;
      await fetch("/api/notify-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: session.user.email, message: premiumGateMsg.trim() }),
      });
      setAiInterestSubmitted(true);
    } catch (err) {
      showError("Something went wrong — please try again.");
    }
    setPremiumGateSubmitting(false);
  };

  // ── Export / Import ───────────────────────────────────────────────────────────
  const exportData = () => setShowExport(true);
  const exportJson = JSON.stringify(data, null, 2);

  const importData = () => {
    try {
      const parsed = JSON.parse(importVal);
      if (parsed.companies) setCompanies(parsed.companies);
      if (parsed.jobs) setJobs(parsed.jobs);
      if (parsed.contacts) setContacts(parsed.contacts);
      if (parsed.outreach) setOutreach(parsed.outreach);
      if (parsed.actionItems) setActionItems(parsed.actionItems);
      setShowImport(false);
      setImportVal("");
    } catch { alert("Invalid JSON — check your data and try again"); }
  };

  const TABS = [
    { id: "dashboard", label: "Dashboard", color: "#4F646F" },
    { id: "companies", label: "Companies", color: "#3b82f6" },
    { id: "jobs", label: "Jobs", color: "#3b82f6" },
    { id: "contacts", label: "Contacts", color: "#3b82f6" },
    { id: "outreach", label: "Outreach", color: "#8b5cf6" },
  ];

  const coName = id => companies.find(c => c.id === id)?.name || "";

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: "var(--text-tertiary)", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Loading...</div>
    </div>
  );

  if (!session) return <LoginScreen />;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: "var(--text-tertiary)", fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Loading your CRM...</div>
    </div>
  );

  // ── Supabase-aware setData for child components ───────────────────────────────
  const supabaseSetData = (updater) => {
    const current = { companies, jobs, contacts, outreach, actionItems };
    const updated = typeof updater === "function" ? updater(current) : updater;
    if (updated.companies !== current.companies) setCompanies(updated.companies);
    if (updated.jobs !== current.jobs) setJobs(updated.jobs);
    if (updated.contacts !== current.contacts) setContacts(updated.contacts);
    if (updated.outreach !== current.outreach) setOutreach(updated.outreach);
    if (updated.actionItems !== current.actionItems) setActionItems(updated.actionItems);
  };

  const dbProps = { dbSave, dbDelete, setCompanies, setJobs, setContacts, setOutreach, setActionItems };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "var(--text-secondary)",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Header + Nav */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 28px", display: "flex", alignItems: "stretch", justifyContent: "space-between", height: "56px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "28px", height: "28px", background: "#4F646F", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: "14px", fontWeight: 800 }}>R</span>
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", letterSpacing: "0.02em" }}>recruiting.crm</span>
          <span className="header-version" style={{ fontSize: "10px", color: "var(--border)", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1px 6px", fontFamily: "'DM Mono', monospace" }}>v0.2 — stage 2</span>
        </div>
        <div className="desktop-nav" style={{ alignItems: "stretch", gap: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none",
              border: "none", cursor: "pointer",
              padding: "0 18px", fontSize: "12px", fontWeight: 600,
              color: tab === t.id ? t.color : "var(--text-tertiary)",
              borderBottom: `2px solid ${tab === t.id ? t.color : "transparent"}`,
              letterSpacing: "0.04em", textTransform: "uppercase",
              transition: "color 0.15s",
              display: "flex", alignItems: "center",
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className="header-data-btns">
            <button onClick={() => userTier === "premium" ? setQuickAddOpen(true) : setPremiumGateOpen(true)} style={{ background: "#4F646F", border: "none", color: "#fff", borderRadius: "6px", padding: "6px 14px", fontSize: "11px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              AI ADD
            </button>
            <button onClick={() => setShowImport(true)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-tertiary)", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em" }}>IMPORT</button>
            <button onClick={exportData} style={{ background: "transparent", border: "1px solid #4F646F55", color: "#4F646F", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em" }}>EXPORT JSON</button>
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-tertiary)", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em" }}>SIGN OUT</button>
        </div>
      </div>

      {/* Content */}
      <div className="mobile-content-pad" style={{ padding: "28px", maxWidth: "1400px", margin: "0 auto" }}>
        {tab === "dashboard" && <DashboardTab data={data} setData={supabaseSetData} onEditOutreach={openDashOutreach} onEditJob={j => setDashJobModal(j)} />}
        {tab === "companies" && <CompaniesTab data={data} setData={supabaseSetData} dbSave={dbSave} dbDelete={dbDelete} setCompanies={setCompanies} onError={showError} userId={session.user.id} />}
        {tab === "jobs" && <JobsTab data={data} setData={supabaseSetData} dbSave={dbSave} dbDelete={dbDelete} setJobs={setJobs} setCompanies={setCompanies} onError={showError} userId={session.user.id} />}
        {tab === "contacts" && <ContactsTab data={data} setData={supabaseSetData} dbSave={dbSave} dbDelete={dbDelete} setContacts={setContacts} setCompanies={setCompanies} setActionItems={setActionItems} onError={showError} userId={session.user.id} />}
        {tab === "outreach" && <OutreachTab data={data} setData={supabaseSetData} dbSave={dbSave} dbDelete={dbDelete} setOutreach={setOutreach} setContacts={setContacts} setCompanies={setCompanies} setJobs={setJobs} setActionItems={setActionItems} onError={showError} userId={session.user.id} />}
      </div>

      {/* Dashboard Outreach Modal */}
      {dashOutreachModal && (
        <Modal title={`Edit Outreach — ${dashOutreachModal.summary || "entry"}`} onClose={() => setDashOutreachModal(null)}>
          <div style={{ marginBottom: "10px", padding: "8px 12px", background: "var(--input-bg)", borderRadius: "6px", fontSize: "11px", color: "var(--text-tertiary)" }}>
            Editing from dashboard — changes save back to your outreach records.
          </div>
          <Select label="Status" value={dashOutreachModal.status} onChange={v => setDashOutreachModal(m => ({ ...m, status: v }))} options={OUTREACH_STATUSES} />
          <Select label="Channel" value={dashOutreachModal.channel} onChange={v => setDashOutreachModal(m => ({ ...m, channel: v }))} options={CHANNELS} />
          <Select label="Direction" value={dashOutreachModal.direction} onChange={v => setDashOutreachModal(m => ({ ...m, direction: v }))} options={DIRECTIONS} />
          <Input label="Date" value={dashOutreachModal.date} onChange={v => setDashOutreachModal(m => ({ ...m, date: v }))} type="date" />
          <Input label="Subject / Summary" value={dashOutreachModal.summary} onChange={v => setDashOutreachModal(m => ({ ...m, summary: v }))} />
          <Textarea label="Notes" value={dashOutreachModal.notes} onChange={v => setDashOutreachModal(m => ({ ...m, notes: v }))} />
          <div style={{ borderTop: "1px solid var(--border)", marginTop: "16px", paddingTop: "14px" }}>
            <button onClick={() => { setDashShowActions(s => !s); if (!dashShowActions && dashOutreachActions.length === 0) setDashOutreachActions([{ id: "new_" + Math.random().toString(36).slice(2), outreachId: dashOutreachModal.id, description: "", priority: "M", effort: "M", done: false, backlog: false, dueDate: "" }]); }}
              style={{ background: "transparent", border: "none", color: dashShowActions ? "#4F646F" : "var(--text-tertiary)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px" }}>{dashShowActions ? "▾" : "▸"}</span>
              ACTION ITEMS {dashOutreachActions.filter(a => !a.done).length > 0 && <span style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444433", borderRadius: "4px", padding: "1px 6px", fontSize: "10px" }}>{dashOutreachActions.filter(a => !a.done).length} open</span>}
            </button>
            {dashShowActions && (
              <div style={{ marginTop: "12px" }}>
                {dashOutreachActions.map((ai, i) => (
                  <div key={ai.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", marginBottom: "10px" }}>
                    <input value={ai.description} onChange={e => setDashOutreachActions(prev => prev.map((a, j) => j === i ? { ...a, description: e.target.value } : a))}
                      placeholder="What needs to be done..."
                      style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "5px", padding: "7px 9px", fontSize: "12px", outline: "none" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => saveDashOutreach(dashOutreachModal)} className="btn-click" style={{ width: "100%", background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", marginTop: "16px" }}>SAVE</button>
        </Modal>
      )}

      {/* Dashboard Job Modal */}
      {dashJobModal && (
        <Modal title={`Edit Job — ${dashJobModal.title} @ ${coName(dashJobModal.companyId)}`} onClose={() => setDashJobModal(null)}>
          <div style={{ marginBottom: "10px", padding: "8px 12px", background: "var(--input-bg)", borderRadius: "6px", fontSize: "11px", color: "var(--text-tertiary)" }}>
            Editing from dashboard — changes save back to your job records.
          </div>
          <Input label="Job Title" value={dashJobModal.title} onChange={v => setDashJobModal(m => ({ ...m, title: v }))} />
          <Select label="Status" value={dashJobModal.status} onChange={v => setDashJobModal(m => ({ ...m, status: v }))} options={JOB_STATUSES} />
          <Input label="Resume (Google Drive URL)" value={dashJobModal.resumeLink || ""} onChange={v => setDashJobModal(m => ({ ...m, resumeLink: v }))} placeholder="https://drive.google.com/..." />
          <Input label="Cover Letter (Google Drive URL)" value={dashJobModal.coverLetterLink || ""} onChange={v => setDashJobModal(m => ({ ...m, coverLetterLink: v }))} placeholder="https://drive.google.com/..." />
          <Textarea label="Notes" value={dashJobModal.notes || ""} onChange={v => setDashJobModal(m => ({ ...m, notes: v }))} />
          <button onClick={() => saveDashJob(dashJobModal)} className="btn-click" style={{ width: "100%", background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", marginTop: "6px" }}>SAVE</button>
        </Modal>
      )}

      {/* Export Modal */}
      {showExport && (
        <Modal title="Export Data" onClose={() => setShowExport(false)}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "13px", marginTop: 0 }}>Copy everything below and save it to a text file. Use Import to reload it next session.</p>
          <textarea readOnly value={exportJson} rows={12} onFocus={e => e.target.select()}
            style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "6px", padding: "10px", fontSize: "11px", fontFamily: "'DM Mono', monospace", outline: "none", resize: "vertical", cursor: "text" }} />
          <div style={{ marginTop: "12px", background: "#4F646F18", border: "1px solid #4F646F44", borderRadius: "6px", padding: "10px 14px", fontSize: "12px", color: "#4F646F", textAlign: "center", fontWeight: 600 }}>
            ☝ Click the text above — it selects automatically. Then hit Ctrl+C to copy.
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImport && (
        <Modal title="Import Data" onClose={() => setShowImport(false)}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "13px", marginTop: 0 }}>Paste your previously exported JSON below to restore your data.</p>
          <textarea value={importVal} onChange={e => setImportVal(e.target.value)} rows={10}
            placeholder='{"companies": [...], "jobs": [...], ...}'
            style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "6px", padding: "10px", fontSize: "12px", fontFamily: "'DM Mono', monospace", outline: "none", resize: "vertical" }} />
          <button onClick={importData} style={{ width: "100%", background: "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", marginTop: "12px" }}>LOAD DATA</button>
        </Modal>
      )}

      {/* Quick Add Modal */}
      {quickAddOpen && (
        <Modal title="AI Quick Add" onClose={() => { setQuickAddOpen(false); setQuickAddText(""); setQuickAddResult(null); }}>
          {!quickAddResult ? (
            <>
              <p style={{ color: "var(--text-tertiary)", fontSize: "13px", marginTop: 0, marginBottom: "14px", lineHeight: 1.6 }}>
                Describe what happened, who you met, or what needs to be done. Claude will figure out what to add to your CRM.
              </p>
              <textarea
                value={quickAddText}
                onChange={e => setQuickAddText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) parseQuickAdd(); }}
                placeholder={"\"Had a coffee chat with Sarah Chen at Nike today, she works in product. Need to follow up tomorrow.\"\n\n\"Applied to the PM role at Figma via LinkedIn.\"\n\n\"Got a LinkedIn message from John at Sequoia asking to connect.\""}
                rows={6}
                style={{ width: "100%", boxSizing: "border-box", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "6px", padding: "10px", fontSize: "13px", outline: "none", resize: "vertical", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}
              />
              <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "6px", marginBottom: "12px" }}>Tip: Cmd+Enter to parse</div>
              <button
                onClick={parseQuickAdd}
                disabled={quickAddLoading || !quickAddText.trim()}
                style={{ width: "100%", background: quickAddLoading || !quickAddText.trim() ? "var(--border)" : "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: quickAddLoading || !quickAddText.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                {quickAddLoading ? "Parsing with Claude..." : "Parse with Claude"}
              </button>
            </>
          ) : (
            <>
              <div style={{ background: "#4F646F12", border: "1px solid #4F646F33", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: "#4F646F", lineHeight: 1.6 }}>
                {quickAddResult.interpretation}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "10px" }}>Records to create</div>
              {quickAddResult.records.map((record, i) => {
                const typeColors = {
                  company: { bg: "#3b82f622", text: "#3b82f6", border: "#3b82f644" },
                  contact: { bg: "#8b5cf622", text: "#8b5cf6", border: "#8b5cf644" },
                  outreach: { bg: "#f59e0b22", text: "#f59e0b", border: "#f59e0b44" },
                  action_item: { bg: "#10b98122", text: "#10b981", border: "#10b98144" },
                };
                const colors = typeColors[record.type] || typeColors.company;
                return (
                  <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "4px", padding: "2px 8px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                        {record.type.replace("_", " ")}
                      </span>
                      {record.action === "existing" && (
                        <span style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.04em" }}>ALREADY IN CRM</span>
                      )}
                    </div>
                    {record.type === "company" && (
                      <>
                        <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>{record.data.name}</div>
                        {(record.data.vertical || record.data.stage) && <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>{[record.data.vertical, record.data.stage].filter(Boolean).join(" · ")}</div>}
                      </>
                    )}
                    {record.type === "contact" && (
                      <>
                        <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>{record.data.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                          {[record.data.title, record.data.companyName].filter(Boolean).join(" @ ")}
                          {record.data.contactType?.length ? ` · ${record.data.contactType.join(", ")}` : ""}
                          {record.data.howKnown ? ` · ${record.data.howKnown}` : ""}
                        </div>
                      </>
                    )}
                    {record.type === "outreach" && (
                      <>
                        <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>{record.data.summary}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                          {[record.data.contactName, record.data.channel, record.data.direction, record.data.date, record.data.status].filter(Boolean).join(" · ")}
                        </div>
                      </>
                    )}
                    {record.type === "action_item" && (
                      <>
                        <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>{record.data.description}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                          Priority: {record.data.priority} · Effort: {record.data.effort}
                          {record.data.dueDate ? ` · Due: ${record.data.dueDate}` : ""}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button onClick={() => setQuickAddResult(null)} style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "6px", padding: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                  ← Edit
                </button>
                <button onClick={saveQuickAdd} disabled={quickAddSaving} style={{ flex: 2, background: quickAddSaving ? "var(--border)" : "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: quickAddSaving ? "not-allowed" : "pointer" }}>
                  {quickAddSaving ? "Saving..." : "Confirm & Save All"}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Premium Gate Modal */}
      {premiumGateOpen && (
        <Modal title="AI Quick Add" onClose={() => setPremiumGateOpen(false)}>
          {aiInterestSubmitted ? (
            <>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6, marginTop: 0 }}>
                Thanks for your interest — we'll reach out when access becomes available.
              </p>
              <button onClick={() => setPremiumGateOpen(false)} style={{ width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "6px", padding: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
                Close
              </button>
            </>
          ) : (
            <>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6, marginTop: 0 }}>
                AI Quick Add is a premium feature. Thank you for your interest — click below to let us know you'd like access.
              </p>
              <Textarea
                label="What do you think this feature does, or why do you want access? (optional)"
                value={premiumGateMsg}
                onChange={v => setPremiumGateMsg(v)}
              />
              <button
                onClick={submitInterest}
                disabled={premiumGateSubmitting}
                style={{ width: "100%", background: premiumGateSubmitting ? "var(--border)" : "#4F646F", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: premiumGateSubmitting ? "not-allowed" : "pointer", marginTop: "8px" }}
              >
                {premiumGateSubmitting ? "Submitting..." : "I'm Interested"}
              </button>
            </>
          )}
        </Modal>
      )}

      {/* Mobile Bottom Nav */}
      <div className="mobile-bottom-nav">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            background: "none",
            border: "none",
            borderTop: `2px solid ${tab === t.id ? t.color : "transparent"}`,
            cursor: "pointer",
            color: tab === t.id ? t.color : "var(--text-tertiary)",
            padding: "8px 4px",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            <TabIcon id={t.id} />
            {t.label}
          </button>
        ))}
        <button onClick={() => userTier === "premium" ? setQuickAddOpen(true) : setPremiumGateOpen(true)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "3px", background: "none", border: "none", borderTop: "2px solid #4F646F",
          cursor: "pointer", color: "#4F646F", padding: "8px 4px",
          fontSize: "9px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          AI Add
        </button>
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}