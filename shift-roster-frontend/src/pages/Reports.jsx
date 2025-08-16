import React, { useState, useEffect } from 'react';
import { reportsAPI, skillsAPI, licensesAPI, rolesAPI, areasAPI, designationsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { FileText, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '../components/ui/alert';

export function Reports() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for acceptance report
  const [acceptanceReportData, setAcceptanceReportData] = useState([]);
  const [acceptanceReportLoading, setAcceptanceReportLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 7)),
  });

  // Data for filters
  const [skills, setSkills] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [areas, setAreas] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Selected filter values
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedLicenses, setSelectedLicenses] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedDesignations, setSelectedDesignations] = useState([]);

  // State for history report
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState('');
  const [historyReport, setHistoryReport] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);


  useEffect(() => {
    // Fetch data for populating filter dropdowns
    const fetchFilterData = async () => {
      try {
        const [skillsRes, licensesRes, rolesRes, areasRes, designationsRes, employeesRes] = await Promise.all([
          skillsAPI.getAll(),
          licensesAPI.getAll(),
          rolesAPI.getAll(),
          areasAPI.getAll(),
          designationsAPI.getAll(),
          employeesAPI.getAll(),
        ]);
        setSkills(skillsRes.data.skills || []);
        setLicenses((licensesRes.data.licenses || []).map(l => ({ id: l.id, name: l.name })));
        setRoles(rolesRes.data.roles || []);
        setAreas(areasRes.data.areas || []);
        setDesignations((designationsRes.data.designations || []).map(d => ({ id: d.designation_id, name: d.designation_name })));
        setAllEmployees(employeesRes.data.employees || []);
      } catch (err) {
        setError('Failed to load filter options.');
      }
    };
    fetchFilterData();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        skill_ids: selectedSkills,
        license_ids: selectedLicenses,
        role_ids: selectedRoles,
        area_ids: selectedAreas,
        designation_ids: selectedDesignations,
      };
      const res = await reportsAPI.employeeSearch(params);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to perform search.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySearch = async () => {
    if (!selectedEmployeeForHistory) return;
    try {
      setHistoryLoading(true);
      setError(null);
      const res = await reportsAPI.getEmployeeHistory(selectedEmployeeForHistory);
      setHistoryReport(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch history report.');
      setHistoryReport(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAcceptanceReportSearch = async () => {
    try {
      setAcceptanceReportLoading(true);
      setError(null);
      const params = {
        start_date: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        end_date: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      };
      const res = await reportsAPI.shiftAcceptance(params);
      setAcceptanceReportData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate acceptance report.');
      setAcceptanceReportData([]);
    } finally {
      setAcceptanceReportLoading(false);
    }
  };

  const FilterCheckboxGroup = ({ title, items, selectedItems, setSelectedItems }) => (
    <div className="p-4 border rounded-lg">
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="max-h-40 overflow-y-auto space-y-2">
        {items.map(item => (
          <label key={item.id} className="flex items-center space-x-2 text-sm">
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onCheckedChange={(checked) => {
                setSelectedItems(prev =>
                  checked ? [...prev, item.id] : prev.filter(id => id !== item.id)
                );
              }}
            />
            <span>{item.name || item.role_name || item.designation_name}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Advanced Employee Report
          </CardTitle>
          <CardDescription>
            Find employees based on their skills, licenses, roles, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <FilterCheckboxGroup title="Skills" items={skills} selectedItems={selectedSkills} setSelectedItems={setSelectedSkills} />
            <FilterCheckboxGroup title="Licenses" items={licenses} selectedItems={selectedLicenses} setSelectedItems={setSelectedLicenses} />
            <FilterCheckboxGroup title="Roles" items={roles} selectedItems={selectedRoles} setSelectedItems={setSelectedRoles} />
            <FilterCheckboxGroup title="Areas" items={areas} selectedItems={selectedAreas} setSelectedItems={setSelectedAreas} />
            <FilterCheckboxGroup title="Designations" items={designations} selectedItems={selectedDesignations} setSelectedItems={setSelectedDesignations} />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </CardContent>
      </Card>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Shift Acceptance Report</CardTitle>
          <CardDescription>View who has accepted their shifts for a given period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleAcceptanceReportSearch} disabled={acceptanceReportLoading}>
              {acceptanceReportLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
          {acceptanceReportData.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Acceptance Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acceptanceReportData.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.employee.name} {entry.employee.surname}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.shift.name}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status === 'accepted' ? 'success' : 'secondary'}>
                        {entry.status === 'accepted' ? 'Accepted' : 'Not Accepted'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee History Report</CardTitle>
          <CardDescription>View the complete shift history for a single employee.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-2">
          <Select onValueChange={setSelectedEmployeeForHistory} value={selectedEmployeeForHistory}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {allEmployees.map(emp => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  {emp.name} {emp.surname} ({emp.employee_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleHistorySearch} disabled={historyLoading || !selectedEmployeeForHistory}>
            {historyLoading ? 'Loading...' : 'View History'}
          </Button>
        </CardContent>
        {historyReport && (
          <CardContent>
            <h3 className="font-bold text-lg mb-2">History for {historyReport.employee_details.name} {historyReport.employee_details.surname}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Total Shifts</p>
                <p className="text-2xl font-bold">{historyReport.summary.total_shifts}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Shift Status</TableHead>
                  <TableHead>Timesheet Status</TableHead>
                  <TableHead>Timesheet Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyReport.shift_history.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.shift.name}</TableCell>
                    <TableCell>{entry.hours}</TableCell>
                    <TableCell><Badge variant={entry.status === 'accepted' ? 'success' : 'secondary'}>{entry.status}</Badge></TableCell>
                    <TableCell>
                      {entry.timesheet ? (
                        <Badge variant={entry.timesheet.status === 'approved' ? 'success' : entry.timesheet.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {entry.timesheet.status}
                        </Badge>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>{entry.timesheet?.notes || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Search Results</CardTitle>
          <CardDescription>{results.length} employee(s) found.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Current Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name} {employee.surname}</TableCell>
                  <TableCell>{employee.role?.name}</TableCell>
                  <TableCell>{employee.area_of_responsibility?.name}</TableCell>
                  <TableCell>
                    <Badge variant={employee.current_status === 'Available' ? 'success' : 'secondary'}>
                      {employee.current_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
