"use client";

import { Info, X } from "lucide-react";
import { useState } from "react";

export function FeaturesButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        <Info size={16} />
        Vezi functionalitati
      </button>
      {open ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="features-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h2 id="features-title">Cum functioneaza</h2>
                <p className="muted">Regulile jocului pentru baieti.</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Inchide">
                <X size={18} />
              </button>
            </div>
            <div className="feature-list">
              <p>Predictiile se pot seta si modifica pana la ora de start a meciului.</p>
              <p>Exact la kickoff, predictiile se blocheaza permanent.</p>
              <p>Dupa ce meciul este blocat, apare butonul Vezi predictii si poti vedea predictiile tuturor.</p>
              <p>Adminul introduce scorul final in panoul de admin si marcheaza meciul ca terminat.</p>
              <p>Punctaj: scor corect 4p, diferenta de goluri + echipa castigatoare 3p, echipa castigatoare 2p, gresit 0p.</p>
              <p>Clasamentul se calculeaza automat pe turneul activ selectat.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
