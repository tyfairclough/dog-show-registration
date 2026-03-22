export interface RegistrationFormClassRow {
  id: string;
  name: string;
  fee: number;
}

export interface RegistrationFormPageInput {
  owner: { name: string; email: string } | null;
  dog: {
    name: string;
    breed: string | null;
    age: number | null;
    sex: string | null;
    is_rescue: number;
  } | null;
  classes: RegistrationFormClassRow[];
  /** Class IDs with a non-cancelled registration */
  selectedClassIds: Set<string>;
  isBlank: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function field(value: string | number | null | undefined, isBlank: boolean): string {
  if (isBlank || value === null || value === undefined || value === '') {
    return '<span class="field-line"></span>';
  }
  return `<span class="field-value">${escapeHtml(String(value))}</span>`;
}

function checkbox(checked: boolean): string {
  return `<span class="cb" aria-hidden="true">${checked ? '&#9745;' : '&#9744;'}</span>`;
}

function pageFragment(input: RegistrationFormPageInput): string {
  const { owner, dog, classes, selectedClassIds, isBlank } = input;
  const rescueLabel = isBlank
    ? 'Rescue dog'
    : dog && dog.is_rescue
      ? 'Rescue dog: Yes'
      : 'Rescue dog: No';

  const classRows = classes
    .map((c) => {
      const ticked = !isBlank && selectedClassIds.has(c.id);
      return `
        <tr>
          <td class="col-check">${checkbox(ticked)}</td>
          <td class="col-class">${escapeHtml(c.name)}</td>
          <td class="col-fee">£${c.fee.toFixed(2)}</td>
        </tr>`;
    })
    .join('');

  return `
    <section class="form-page">
      <header class="form-header">
        <h1>Essex Therapy Dogs — Fun Dog Show</h1>
        <h2>Registration form</h2>
        <p class="meta">Please bring this form on the day if required.</p>
      </header>

      <div class="section">
        <h3>Owner / handler</h3>
        <div class="row">
          <label>Name</label>
          <div class="value">${field(owner?.name ?? null, isBlank)}</div>
        </div>
        <div class="row">
          <label>Email</label>
          <div class="value">${field(owner?.email ?? null, isBlank)}</div>
        </div>
      </div>

      <div class="section">
        <h3>Dog</h3>
        <div class="row">
          <label>Name</label>
          <div class="value">${field(dog?.name ?? null, isBlank)}</div>
        </div>
        <div class="row two-col">
          <div>
            <label>Breed</label>
            <div class="value">${field(dog?.breed ?? null, isBlank)}</div>
          </div>
          <div>
            <label>Age (years)</label>
            <div class="value">${field(dog?.age ?? null, isBlank)}</div>
          </div>
        </div>
        <div class="row two-col">
          <div>
            <label>Sex</label>
            <div class="value">${field(dog?.sex ?? null, isBlank)}</div>
          </div>
          <div>
            <label>${escapeHtml(rescueLabel)}</label>
            <div class="value">${isBlank ? '<span class="field-line short"></span>' : ''}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Classes entered</h3>
        <table class="class-table">
          <thead>
            <tr>
              <th class="col-check"></th>
              <th class="col-class">Class</th>
              <th class="col-fee">Fee</th>
            </tr>
          </thead>
          <tbody>
            ${classRows || '<tr><td colspan="3" class="empty">No classes configured.</td></tr>'}
          </tbody>
        </table>
      </div>

      <footer class="form-footer">
        <p>Office use only: ________________________________</p>
      </footer>
    </section>
  `;
}

const documentStyles = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 11pt;
    color: #1a1a1a;
    background: #fff;
  }
  .form-page {
    page-break-after: always;
    min-height: 0;
  }
  .form-page:last-child { page-break-after: auto; }
  .form-header {
    text-align: center;
    margin-bottom: 14pt;
    border-bottom: 2px solid #2c5282;
    padding-bottom: 10pt;
  }
  .form-header h1 {
    margin: 0 0 4pt;
    font-size: 16pt;
    font-weight: 700;
    color: #2c5282;
  }
  .form-header h2 {
    margin: 0;
    font-size: 13pt;
    font-weight: 600;
  }
  .meta { margin: 8pt 0 0; font-size: 9pt; color: #555; }
  .section {
    margin-bottom: 12pt;
  }
  .section h3 {
    margin: 0 0 8pt;
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #2c5282;
    border-bottom: 1px solid #cbd5e0;
    padding-bottom: 4pt;
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: 10pt;
    margin-bottom: 8pt;
  }
  .row label {
    flex: 0 0 110pt;
    font-weight: 600;
    font-size: 10pt;
  }
  .row .value {
    flex: 1;
    min-height: 18pt;
  }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12pt;
  }
  .two-col > div { display: flex; flex-direction: column; gap: 4pt; }
  .two-col label { flex: none; }
  .field-line {
    display: block;
    border-bottom: 1px solid #333;
    min-height: 16pt;
  }
  .field-line.short { max-width: 80pt; }
  .field-value { display: block; padding: 2pt 0; }
  .cb {
    font-size: 12pt;
    line-height: 1;
    display: inline-block;
    width: 14pt;
    text-align: center;
  }
  .class-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
  }
  .class-table th, .class-table td {
    border: 1px solid #94a3b8;
    padding: 6pt 8pt;
    vertical-align: top;
  }
  .class-table th {
    background: #edf2f7;
    font-weight: 600;
    text-align: left;
  }
  .col-check { width: 36pt; text-align: center; }
  .col-fee { width: 56pt; text-align: right; }
  .empty { text-align: center; color: #64748b; font-style: italic; }
  .form-footer {
    margin-top: 16pt;
    padding-top: 10pt;
    border-top: 1px dashed #94a3b8;
    font-size: 9pt;
    color: #64748b;
  }
`;

/**
 * Full HTML document with one or more A4 form pages (CSS page break between dogs).
 */
export function buildRegistrationFormsHtml(pages: RegistrationFormPageInput[]): string {
  const body = pages.map(pageFragment).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Registration forms</title>
  <style>${documentStyles}</style>
</head>
<body>
${body}
</body>
</html>`;
}
