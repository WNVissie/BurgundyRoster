import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
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
  LineChart,
  Line,
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
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Award
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function Analytics() {
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [employeesByRole, setEmployeesByRole] = useState([]);
  const [employeesByArea, setEmployeesByArea] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    total_employees: 0,
    employees_on_shift: 0,
    available_employees: 0,
    pending_approvals: 0,
    total_scheduled_hours: 0
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
    fetchSkillDistribution();
  }, [dateRange]);

  const fetchAnalytics = async () => {
      // Fetch weekly approval trends
      const weeklyTrendsRes = await analyticsAPI.getWeeklyApprovalTrends().catch(() => ({ data: { data: [] } }));
      if (weeklyTrendsRes.data && weeklyTrendsRes.data.data) {
        setWeeklyTrends(weeklyTrendsRes.data.data.map(item => ({
          week: item.week,
          approved: item.approved,
          pending: item.pending,
          rejected: item.rejected
        })));
      }
    try {
      setLoading(true);
      
      // Fetch all analytics data
      const [dashboardRes, roleRes, areaRes, shiftUtilRes] = await Promise.all([
        analyticsAPI.getDashboard({
          start_date: dateRange.start,
          end_date: dateRange.end
        }).catch(() => ({ data: {} })), // Handle if dashboard endpoint has issues
        analyticsAPI.getEmployeesByRole(),
        analyticsAPI.getEmployeesByArea().catch(() => ({ data: [] })), // Handle if area endpoint doesn't exist yet
        analyticsAPI.getShiftCoverage({
          start_date: dateRange.start,
          end_date: dateRange.end
        }).catch(() => ({ data: { utilization: [] } }))
      ]);

      setAnalytics(dashboardRes.data);

      // Set dashboard metrics
      if (dashboardRes.data && dashboardRes.data.metrics) {
        setDashboardMetrics(dashboardRes.data.metrics);
        setTotalEmployees(dashboardRes.data.metrics.total_employees);
      } else {
        // Fallback to role-based count if dashboard fails
        const roleData = roleRes.data.data.map((item, index) => ({
          name: item.role_name,
          value: item.employee_count,
          color: COLORS[index % COLORS.length]
        }));
        const total = roleData.reduce((sum, item) => sum + item.value, 0);
        setTotalEmployees(total);
        setEmployeesByRole(roleData);
      }

      // Transform role data for the pie chart
      const roleData = roleRes.data.data.map((item, index) => ({
        name: item.role_name,
        value: item.employee_count,
        color: COLORS[index % COLORS.length]
      }));
      setEmployeesByRole(roleData);

      // Transform area data if available
      if (areaRes.data && areaRes.data.data) {
        setEmployeesByArea(areaRes.data.data);
      }

      // Set shift utilization data
      if (shiftUtilRes.data && shiftUtilRes.data.utilization) {
        setShiftUtilization(shiftUtilRes.data.utilization.map(item => ({
          shift: item.shift_name,
          planned: item.planned,
          actual: item.actual,
          utilization: item.utilization
        })));
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillDistribution = async () => {
    try {
      const res = await analyticsAPI.getSkillDistribution();
      setSkillDistribution(res.data.data || []);
    } catch (err) {
      setSkillDistribution([]);
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

  const exportChart = (chartName) => {
    // In a real implementation, this would export the chart as PDF/PNG
    console.log(`Exporting ${chartName} chart...`);
    alert(`Export functionality for ${chartName} would be implemented here`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // shiftUtilization now comes from backend

  // weeklyTrends now comes from backend

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-blue-600">{dashboardMetrics.total_employees || totalEmployees}</p>
                <p className="text-xs text-gray-500">Active employees</p>
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
                <p className="text-3xl font-bold text-green-600">{dashboardMetrics.employees_on_shift || 0}</p>
                <p className="text-xs text-gray-500">
                  {dashboardMetrics.employees_on_shift > 0 
                    ? `${dashboardMetrics.total_scheduled_hours || 0} hours scheduled` 
                    : 'No shifts scheduled yet'
                  }
                </p>
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
                <p className="text-3xl font-bold text-emerald-600">{dashboardMetrics.pending_approvals || 0}</p>
                <p className="text-xs text-gray-500">
                  {dashboardMetrics.pending_approvals > 0 
                    ? 'Shifts waiting approval' 
                    : 'All shifts processed'
                  }
                </p>
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
                <p className="text-3xl font-bold text-purple-600">{dashboardMetrics.available_employees || totalEmployees}</p>
                <p className="text-xs text-gray-500">
                  {dashboardMetrics.employees_on_shift > 0 
                    ? `${dashboardMetrics.employees_on_shift} on shift` 
                    : 'All staff available'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Distribution by Role */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" />
                    Employee Distribution by Role
                  </CardTitle>
                  <CardDescription>Current workforce composition</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportChart('role-distribution')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={employeesByRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {employeesByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Shift Utilization */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Shift Utilization
                  </CardTitle>
                  <CardDescription>Planned vs actual shift coverage</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportChart('shift-utilization')}>
                  <Download className="h-4 w-4" />
                </Button>
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

          {/* Weekly Trends */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Weekly Approval Trends
                </CardTitle>
                <CardDescription>Shift approval patterns over time</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportChart('weekly-trends')}>
                <Download className="h-4 w-4" />
              </Button>
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

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employees by Area */}
            <Card>
              <CardHeader>
                <CardTitle>Employees by Area</CardTitle>
                <CardDescription>Distribution across work areas</CardDescription>
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

            {/* Employee Status */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Availability</CardTitle>
                <CardDescription>Current status breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Available</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {dashboardMetrics.available_employees || totalEmployees}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">On Shift</span>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {dashboardMetrics.employees_on_shift || 0}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">On Leave</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {dashboardMetrics.employees_on_leave || 0}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <UserX className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Sick Leave</span>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">0</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shift Coverage by Area</CardTitle>
              <CardDescription>Number of shifts scheduled per area</CardDescription>
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

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-green-600">94%</p>
                <p className="text-sm text-gray-600">Approval Rate</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-blue-600">2.3h</p>
                <p className="text-sm text-gray-600">Avg Response Time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-purple-600">92%</p>
                <p className="text-sm text-gray-600">Utilization Rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Skill Distribution
              </CardTitle>
              <CardDescription>Employee skills across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillDistribution.map((skill, index) => (
                  <div key={skill.skill} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Award className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{skill.skill}</p>
                        <p className="text-sm text-gray-500">{skill.employees} employees</p>
                      </div>
                    </div>
                    <Badge 
                      variant={skill.level === 'High' ? 'default' : skill.level === 'Medium' ? 'secondary' : 'outline'}
                    >
                      {skill.level}
                    </Badge>
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

