import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar as CalendarIcon,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  UserCheck
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function Analytics() {
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [employeesByRole, setEmployeesByRole] = useState([]);
  const [employeesByArea, setEmployeesByArea] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    total_employees: 0,
    employees_on_shift: 0,
    available_employees: 0,
    pending_approvals: 0,
    total_scheduled_hours: 0,
    employees_on_leave: 0
  });
  const [shiftUtilization, setShiftUtilization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [skillDistribution, setSkillDistribution] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [dashboardRes, roleRes, areaRes, shiftUtilRes, weeklyTrendsRes, skillDistRes] = await Promise.all([
        analyticsAPI.getDashboard({ start_date: dateRange.start, end_date: dateRange.end }),
        analyticsAPI.getEmployeesByRole(),
        analyticsAPI.getEmployeesByArea(),
        analyticsAPI.getShiftCoverage({ start_date: dateRange.start, end_date: dateRange.end }),
        analyticsAPI.getWeeklyApprovalTrends(),
        analyticsAPI.getSkillDistribution()
      ]);

      if (dashboardRes.data && dashboardRes.data.metrics) {
        setDashboardMetrics(dashboardRes.data.metrics);
        setTotalEmployees(dashboardRes.data.metrics.total_employees);
      }

      const roleData = (roleRes.data.data || []).map((item, index) => ({
        name: item.role_name,
        value: item.employee_count,
        color: COLORS[index % COLORS.length]
      }));
      setEmployeesByRole(roleData);
      if (!dashboardMetrics.total_employees) {
          setTotalEmployees(roleData.reduce((sum, item) => sum + item.value, 0));
      }

      setEmployeesByArea(areaRes.data.data || []);

      setShiftUtilization((shiftUtilRes.data.utilization || []).map(item => ({
        shift: item.shift_name,
        planned: item.planned,
        actual: item.actual,
        utilization: item.utilization
      })));

      setWeeklyTrends((weeklyTrendsRes.data.data || []).map(item => ({
        week: item.week,
        approved: item.approved + item.accepted,
        pending: item.pending,
        rejected: item.rejected
      })));

      setSkillDistribution(skillDistRes.data.data || []);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    const now = new Date();
    let start, end;
    
    switch (period) {
      case 'week':
        start = subDays(now, 7);
        end = now;
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'quarter':
        start = subDays(now, 90);
        end = now;
        break;
      case 'year':
        start = subDays(now, 365);
        end = now;
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }
    
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive workforce analytics and insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-blue-600">{totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Shifts</p>
                <p className="text-3xl font-bold text-green-600">{dashboardMetrics.employees_on_shift}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-emerald-600">{dashboardMetrics.pending_approvals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Available Staff</p>
                <p className="text-3xl font-bold text-purple-600">{dashboardMetrics.available_employees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Distribution by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={employeesByRole} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {employeesByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shift Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={shiftUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shift" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="planned" fill="#8884d8" name="Planned" />
                    <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Approval Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="approved" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="pending" stackId="1" stroke="#ffc658" fill="#ffc658" />
                  <Area type="monotone" dataKey="rejected" stackId="1" stroke="#ff7c7c" fill="#ff7c7c" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employees by Area</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeesByArea}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="employees" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shift Coverage by Area</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={employeesByArea}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="employees" fill="#8884d8" name="Employees" />
                  <Bar dataKey="shifts" fill="#82ca9d" name="Shifts" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skill Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillDistribution.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <p className="font-medium">{skill.skill}</p>
                    <Badge>{skill.employees} employees</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
