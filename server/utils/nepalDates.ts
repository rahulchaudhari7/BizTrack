import NepaliDate from 'nepali-date-converter';

export function toBikramSambat(date: Date | string): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    // @ts-ignore
    const nepDate = new (NepaliDate.default || NepaliDate)(d);
    return nepDate.format('YYYY-MM-DD');
  } catch (err) {
    return '';
  }
}

export function getCurrentFiscalYear(): { start: Date; end: Date; label: string; bsLabel: string } {
  const now = new Date();
  const year = now.getFullYear();

  // Shrawan 1 usually falls on July 16 or 17.
  // Standard approximation: July 16
  const shrawanThisYear = new Date(year, 6, 16, 0, 0, 0, 0); // Month 6 is July

  let startYear = year;
  if (now < shrawanThisYear) {
    startYear = year - 1;
  }

  const start = new Date(startYear, 6, 16, 0, 0, 0, 0);
  const end = new Date(startYear + 1, 6, 15, 23, 59, 59, 999);

  // Compute BS Year
  let bsStartYear = startYear + 57;
  const bsLabel = `FY ${bsStartYear}/${(bsStartYear + 1).toString().slice(2)}`;
  const label = `FY ${startYear}/${(startYear + 1).toString().slice(2)} (${bsLabel})`;

  return { start, end, label, bsLabel };
}

export function getLastFiscalYear(): { start: Date; end: Date; label: string; bsLabel: string } {
  const current = getCurrentFiscalYear();
  const start = new Date(current.start.getFullYear() - 1, 6, 16, 0, 0, 0, 0);
  const end = new Date(current.start.getFullYear(), 6, 15, 23, 59, 59, 999);

  const startYear = start.getFullYear();
  const bsStartYear = startYear + 57;
  const bsLabel = `FY ${bsStartYear}/${(bsStartYear + 1).toString().slice(2)}`;
  const label = `FY ${startYear}/${(startYear + 1).toString().slice(2)} (${bsLabel})`;

  return { start, end, label, bsLabel };
}
