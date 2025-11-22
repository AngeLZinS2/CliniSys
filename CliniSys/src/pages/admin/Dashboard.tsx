import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, UserCog, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    patients: 0,
    appointmentsToday: 0,
    staff: 0,
    lowStock: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Count patients
      const { count: patientsCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'patient');

      // Count today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', today.toISOString())
        .lt('appointment_date', tomorrow.toISOString());

      // Count staff
      const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Count low stock items
      const { count: lowStockCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'low_stock');

      setStats({
        patients: patientsCount || 0,
        appointmentsToday: appointmentsCount || 0,
        staff: staffCount || 0,
        lowStock: lowStockCount || 0,
      });

      // Load today's appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:profiles!appointments_patient_id_fkey(name),
          doctor:profiles!appointments_doctor_id_fkey(name)
        `)
        .gte('appointment_date', today.toISOString())
        .lt('appointment_date', tomorrow.toISOString())
        .order('appointment_date', { ascending: true })
        .limit(5);

      setRecentAppointments(appointments || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statsData = [
    {
      title: 'Pacientes Ativos',
      value: stats.patients.toString(),
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Consultas Hoje',
      value: stats.appointmentsToday.toString(),
      icon: Calendar,
      color: 'text-accent',
    },
    {
      title: 'Profissionais',
      value: stats.staff.toString(),
      icon: UserCog,
      color: 'text-warning',
    },
    {
      title: 'Alertas Estoque',
      value: stats.lowStock.toString(),
      icon: AlertTriangle,
      color: 'text-destructive',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Agendamentos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : recentAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
              <p className="text-sm text-muted-foreground mt-1">
                Os agendamentos aparecerão aqui quando cadastrados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{appointment.patient?.name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.doctor?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{format(new Date(appointment.appointment_date), 'HH:mm')}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
