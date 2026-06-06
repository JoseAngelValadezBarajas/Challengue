import type { RedactionEntry } from "../interfaces/apiInterfaces.js";

interface RedactionTableProps {
  redactions: RedactionEntry[];
}

export function RedactionTable({ redactions }: RedactionTableProps) {
  return (
    <section className="redaction-table" aria-label="Applied redactions">
      <h2>Applied redactions</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Term</th>
              <th>Original</th>
              <th>Range</th>
            </tr>
          </thead>
          <tbody>
            {redactions.map((redaction) => (
              <tr key={`${redaction.index}-${redaction.start}`}>
                <td>{redaction.index + 1}</td>
                <td>{redaction.term}</td>
                <td>{redaction.original}</td>
                <td>
                  {redaction.start}-{redaction.end}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
