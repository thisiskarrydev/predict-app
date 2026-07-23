"use client";

import { Eye, X } from "lucide-react";
import { useState } from "react";

type PredictionRow = {
  name: string;
  prediction: string | null;
  points: number | null;
};

export function PredictionsModal({
  matchLabel,
  rows
}: {
  matchLabel: string;
  rows: PredictionRow[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button compact-button secondary-button" type="button" onClick={() => setOpen(true)}>
        <Eye size={16} /> Vezi pronosticuri
      </button>
      {open ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="predictions-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h2 id="predictions-title">Pronosticuri</h2>
                <p className="muted">{matchLabel}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Inchide">
                <X size={18} />
              </button>
            </div>
            <table className="table compact-table">
              <thead>
                <tr>
                  <th>Baiat</th>
                  <th>Pronostic</th>
                  <th>Pct</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.prediction ?? "Fara pronostic"}</td>
                    <td>{row.points ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}
