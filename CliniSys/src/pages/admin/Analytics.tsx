import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Activity,
  Clock,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AppointmentStats {
  month: string;
  total: number;
  completed: number;
  cancelled: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  color: string;
}

interface DoctorPerformance {
  doctor: string;
  appointments: number;
}

const COLORS = {
  scheduled: 'hsl(var(--primary))',
  completed: 'hsl(var(--success))',
  cancelled: 'hsl(var(--destructive))',
  confirmed: 'hsl(var(--accent))',
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<AppointmentStats[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [doctorPerformance, setDoctorPerformance] = useState<DoctorPerformance[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Total de pacientes
      const { count: patientsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('id', 'in', `(SELECT user_id FROM staff)`);
      
      setTotalPatients(patientsCount || 0);

      // Total de consultas e distribuição por status
      const { data: appointments } = await supabase
        .from('appointments')
        .select('status, appointment_date, doctor_id, profiles!appointments_doctor_id_fkey(name)');

      if (appointments) {
        setTotalAppointments(appointments.length);

        // Calcular taxa de conclusão
        const completed = appointments.filter(a => a.status === 'completed').length;
        setCompletionRate(Math.round((completed / appointments.length) * 100));

        // Distribuição por status
        const statusCounts = appointments.reduce((acc, apt) => {
          acc[apt.status] = (acc[apt.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const statusData: StatusDistribution[] = Object.entries(statusCounts).map(([status, count]) => ({
          status: getStatusText(status),
          count,
          color: COLORS[status as keyof typeof COLORS] || 'hsl(var(--muted))',
        }));
        setStatusDistribution(statusData);

        // Dados mensais (últimos 6 meses)
        const monthlyStats = generateMonthlyStats(appointments);
        setMonthlyData(monthlyStats);

        // Performance dos médicos
        const doctorStats = appointments.reduce((acc, apt) => {
          const doctorName = (apt.profiles as any)?.name || 'Desconhecido';
          acc[doctorName] = (acc[doctorName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const doctorData = Object.entries(doctorStats)
          .map(([doctor, appointments]) => ({ doctor, appointments }))
          .sort((a, b) => b.appointments - a.appointments)
          .slice(0, 5);
        
        setDoctorPerformance(doctorData);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyStats = (appointments: any[]): AppointmentStats[] => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const last6Months: AppointmentStats[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      
      const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.getMonth() === date.getMonth() && 
               aptDate.getFullYear() === date.getFullYear();
      });

      last6Months.push({
        month: monthName,
        total: monthAppointments.length,
        completed: monthAppointments.filter(a => a.status === 'completed').length,
        cancelled: monthAppointments.filter(a => a.status === 'cancelled').length,
      });
    }

    return last6Months;
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Analytics</h1>
          <p className="text-muted-foreground">Análise detalhada de consultas e desempenho</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Analytics</h1>
        <p className="text-muted-foreground">Análise detalhada de consultas e desempenho</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">pacientes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalAppointments}</div>
            <p className="text-xs text-muted-foreground">consultas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">consultas concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Mensal</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {monthlyData.length > 0 
                ? Math.round(monthlyData.reduce((acc, m) => acc + m.total, 0) / monthlyData.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">consultas por mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="doctors">Médicos</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consultas - Últimos 6 Meses</CardTitle>
              <CardDescription>Acompanhamento mensal de consultas agendadas</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="Total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    name="Concluídas" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cancelled" 
                    name="Canceladas" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--destructive))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <CardDescription>Status das consultas</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas por Status</CardTitle>
                <CardDescription>Quantidade de consultas por categoria</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="status" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="count" name="Consultas">
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Médicos</CardTitle>
              <CardDescription>Top 5 médicos por número de consultas</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-muted-foreground" />
                  <YAxis dataKey="doctor" type="category" width={150} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="appointments" name="Consultas" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
