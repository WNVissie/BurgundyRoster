import React, { useEffect, useState } from 'react';
import { Table } from '../components/ui/table';
import { Button } from '../components/ui/button';
import api, { timesheetsAPI } from '../lib/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { DragDropRoster } from '../components/roster/DragDropRoster';


const Timesheets = () => {
  const { user, isEmployee, isAdmin, isManager } = useAuth();
  console.log('User:', user);
  console.log('isEmployee:', isEmployee());
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
      console.log('Timesheets API response:', res.data);
      setTimesheets(res.data || []);
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

  const handleExportExcel = async () => {
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
      };
      const res = await api.get('/export/timesheets/excel', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheets_${format(new Date(), 'yyyyMMdd')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export timesheets to Excel", err);
      // You might want to show an error message to the user
    }
  };

  console.log('Timesheets:', timesheets);

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
        <Button onClick={handleExportExcel} style={{ marginLeft: 8 }}>
          Export to Excel
        </Button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {(isAdmin() || isManager()) ? (
            <TraditionalShiftView shifts={timesheets} />
          ) : (
            <TraditionalShiftView shifts={timesheets.filter(shift => shift.employee_id === user.id)} />
          )}
        </>
      )}
    </div>
  );
};

const TraditionalShiftView = ({ shifts }) => {
  return (
    <div style={{ marginTop: 24 }}>
      {shifts.length === 0 ? (
        <div>No timesheets found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Employee</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Hours Worked</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map(shift => (
              <tr key={shift.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{shift.date}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{shift.employee_name} {shift.employee_surname}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{shift.hours_worked ?? shift.hours ?? ''}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{shift.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Timesheets;
