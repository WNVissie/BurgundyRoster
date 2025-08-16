import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import api, { timesheetsAPI } from '../lib/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Timesheets = () => {
  const { user, isEmployee, isAdmin, isManager } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  useEffect(() => {
    fetchTimesheets();
  }, []);

  async function fetchTimesheets() {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await timesheetsAPI.getAll(params);
      setTimesheets(res.data || []);
    } catch (e) {
      setTimesheets([]);
    } finally {
      setLoading(false);
    }
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

  const handleApprove = async (id) => {
    await timesheetsAPI.approve(id);
    fetchTimesheets();
  };

  const openRejectDialog = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedTimesheet) return;
    await timesheetsAPI.reject(selectedTimesheet.id, { notes: rejectionNotes });
    setIsRejectDialogOpen(false);
    setRejectionNotes('');
    setSelectedTimesheet(null);
    fetchTimesheets();
  };

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
    }
  };

  return (
    <div>
      <h2>Timesheets</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Start Date: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
        <label style={{ marginLeft: 8 }}>End Date: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
        <Button
          onClick={() => handleGenerate('custom')}
          disabled={!startDate || !endDate || generating}
        >
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
          <TraditionalShiftView
            shifts={timesheets}
            isManager={isAdmin() || isManager()}
            onApprove={handleApprove}
            onReject={openRejectDialog}
          />
        </>
      )}

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Add rejection notes..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReject}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TraditionalShiftView = ({ shifts, isManager, onApprove, onReject }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'accepted':
        return <Badge variant="success">{status}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      {shifts.length === 0 ? (
        <div>No timesheets found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Hours Worked</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              {isManager && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map(shift => (
              <TableRow key={shift.id}>
                <TableCell>{shift.date}</TableCell>
                <TableCell>{shift.employee_name} {shift.employee_surname}</TableCell>
                <TableCell>{shift.hours_worked ?? shift.hours ?? ''}</TableCell>
                <TableCell>{getStatusBadge(shift.status)}</TableCell>
                <TableCell>{shift.notes}</TableCell>
                {isManager && (
                  <TableCell>
                    {shift.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => onApprove(shift.id)}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => onReject(shift)}>Reject</Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default Timesheets;
