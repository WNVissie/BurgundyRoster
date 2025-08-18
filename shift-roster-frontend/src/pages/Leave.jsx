import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leaveAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Plus,
  Check,
  X,
  Plane,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function Leave() {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    leave_type: 'Unpaid',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [comment, setComment] = useState('');
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);

  const isManager = useMemo(() => user?.role?.name === 'Admin' || user?.role?.name === 'Manager', [user]);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await leaveAPI.getAll();
      setLeaveRequests(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.create(form);
      setIsDialogOpen(false);
      setForm({ leave_type: 'Unpaid', start_date: '', end_date: '', reason: '' });
      fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit leave request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await leaveAPI.delete(id);
      fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete leave request');
    }
  }

  const handleActionClick = (leaveId, type) => {
    setSelectedLeaveId(leaveId);
    setActionType(type);
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    try {
      await leaveAPI.action(selectedLeaveId, { action: actionType, action_comment: comment });
      setShowModal(false);
      setComment('');
      fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${actionType} leave request`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Plane className="h-5 w-5 mr-2" />
                Leave Management
              </CardTitle>
              <CardDescription>
                Request time off and view your leave history. {isManager && "Managers can approve or reject requests."}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Leave Request</DialogTitle>
                  <DialogDescription>
                    Fill out the form to request time off.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="leave-type">Leave Type</Label>
                    <select
                      id="leave-type"
                      value={form.leave_type}
                      onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option>Unpaid</option>
                      <option>Paid</option>
                      <option>Sick</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit Request</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                {isManager && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action Comment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((req) => (
                <TableRow key={req.id}>
                  {isManager && <TableCell>{req.employee.name} {req.employee.surname}</TableCell>}
                  <TableCell>{req.leave_type}</TableCell>
                  <TableCell>
                    {format(parseISO(req.start_date), 'MMM d, yyyy')} - {format(parseISO(req.end_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{req.days}</TableCell>
                  <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell>{req.action_comment || ''}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {isManager && req.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleActionClick(req.id, 'approve')}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleActionClick(req.id, 'reject')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {!isManager && req.status === 'pending' && (
                         <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(req.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionType === 'approve' ? 'Approve' : 'Reject'} Leave</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment (optional)"
                rows={4}
                style={{ width: '100%' }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAction}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
