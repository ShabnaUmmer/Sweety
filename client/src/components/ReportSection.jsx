import { Link } from 'react-router-dom';
import { formatRange } from '../dates.js';

export default function ReportSection({ title, report, addDate, children }) {
  return (
    <section className="report">
      <h2>{title}</h2>
      <p className="report-range">{formatRange(report.from, report.to)}</p>

      {report.count === 0 ? (
        <p>
          No readings recorded for this period.
          {addDate && (
            <>
              {' '}
              <Link to={`/?date=${addDate}`}>Add a reading</Link>
            </>
          )}
        </p>
      ) : (
        <dl className="stats">
          <div>
            <dt>Highest</dt>
            <dd><span className="number">{report.highest}</span> <span className="unit">mg/dl</span></dd>
          </div>
          <div>
            <dt>Lowest</dt>
            <dd><span className="number">{report.lowest}</span> <span className="unit">mg/dl</span></dd>
          </div>
          <div>
            <dt>Average</dt>
            <dd><span className="number">{report.average}</span> <span className="unit">mg/dl</span></dd>
          </div>
          <div>
            <dt>Readings</dt>
            <dd><span className="number">{report.count}</span></dd>
          </div>
        </dl>
      )}
      {children}
    </section>
  );
}
