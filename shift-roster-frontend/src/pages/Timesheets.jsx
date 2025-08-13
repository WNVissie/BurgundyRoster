
import React, { useEffect, useState } from 'react';
import { Table } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { timesheetsAPI } from '../lib/api';

const Timesheets = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTimesheets();
  }, []);

  async function fetchTimesheets() {
    setLoading(true);
    try {
  const res = await timesheetsAPI.getAll();
      setTimesheets(res.data.data || []);
    } catch {
      setTimesheets([]);
    }
    setLoading(false);
  }

  function getCurrentWeek() {
    const today = new Date();
    const first = today.getDate() - today.getDay() + 1;
    const last = first + 6;
    const monday = new Date(today.setDate(first));
    const sunday = new Date(today.setDate(last));
    return {
      start: monday.toISOString().slice(0, 10),
      end: sunday.toISOString().slice(0, 10)
    };
  }

  async function handleGenerate(period) {
    setGenerating(true);
    let payload;
    if (period === 'week') {
      const week = getCurrentWeek();
      payload = { start_date: week.start, end_date: week.end };
      setStartDate(week.start);
      setEndDate(week.end);
    } else {
      payload = { start_date: startDate, end_date: endDate };
    }
    try {
  await timesheetsAPI.generate(payload);
      await fetchTimesheets();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <h2>Timesheets</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Start Date: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
        <label style={{ marginLeft: 8 }}>End Date: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
        <Button onClick={() => handleGenerate('custom')} disabled={!startDate || !endDate || generating} style={{ marginLeft: 8 }}>
          Generate for Period
        </Button>
        <Button onClick={() => handleGenerate('week')} disabled={generating} style={{ marginLeft: 8 }}>
          Generate for Current Week
        </Button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Hours Worked</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.map(ts => (
              <tr key={ts.id}>
                <td>{ts.date}</td>
                <td>{ts.employee?.name} {ts.employee?.surname}</td>
                <td>{ts.hours_worked}</td>
                <td>
                  <Badge color={ts.status === 'approved' ? 'green' : ts.status === 'pending' ? 'yellow' : 'red'}>
                    {ts.status}
                  </Badge>
                </td>
                <td>
                  {/* Approve/Reject buttons for admin/manager */}
                  <Button disabled={ts.status !== 'pending'}>Approve</Button>
                  <Button disabled={ts.status !== 'pending'}>Reject</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default Timesheets;
