import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalAppointments: 0,
    medicalRecords: 0,
  });
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const now = new Date().toISOString();

      // Count upcoming appointments
      const { count: upcomingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', user!.id)
        .gte('appointment_date', now)
        .in('status', ['scheduled', 'confirmed']);

      // Count total appointments
      const { count: totalCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', user!.id);

      // Count medical records
      const { count: recordsCount } = await supabase
        .from('medical_records')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', user!.id);

      // Get next appointment
      const { data: appointmentsData, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user!.id)
        .gte('appointment_date', now)
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .limit(1);

      console.log('Appointments data:', appointmentsData);
      console.log('Appointments error:', apptError);

      if (appointmentsData && appointmentsData.length > 0) {
        const nextAppt = appointmentsData[0];
        console.log('Next appointment:', nextAppt);
        
        // Get doctor name from profiles
        const { data: doctorProfile, error: docError } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', nextAppt.doctor_id);

        console.log('Doctor profile:', doctorProfile);
        console.log('Doctor error:', docError);

        setNextAppointment({
          ...nextAppt,
          doctor: { name: doctorProfile?.[0]?.name || 'Médico não definido' }
        });
      }

      setStats({
        upcomingAppointments: upcomingCount || 0,
        totalAppointments: totalCount || 0,
        medicalRecords: recordsCount || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Bem-vindo, {user?.name}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Visão geral do seu perfil</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximas Consultas
            </CardTitle>
            <Calendar className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.upcomingAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Consultas
            </CardTitle>
            <Clock className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registros Médicos
            </CardTitle>
            <FileText className="w-5 h-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.medicalRecords}</div>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Próxima Consulta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : nextAppointment ? (
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Dr(a). {nextAppointment.doctor?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(nextAppointment.appointment_date), "dd/MM/yyyy 'às' HH:mm")}
                </p>
                {nextAppointment.reason && (
                  <p className="text-sm text-muted-foreground mt-1">{nextAppointment.reason}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Você não tem consultas agendadas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;
