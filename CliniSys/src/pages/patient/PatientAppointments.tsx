import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'scheduled';
  location: string;
}

const PatientAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user!.id)
        .order('appointment_date', { ascending: true });

      console.log('All appointments data:', appointmentsData);
      console.log('Appointments error:', error);

      if (appointmentsData && appointmentsData.length > 0) {
        // Get all unique doctor IDs
        const doctorIds = [...new Set(appointmentsData.map(apt => apt.doctor_id))];
        console.log('Doctor IDs to fetch:', doctorIds);
        
        // Fetch all doctor profiles
        const { data: doctorProfiles, error: docError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', doctorIds);

        console.log('Doctor profiles:', doctorProfiles);
        console.log('Doctor profiles error:', docError);

        // Create a map for quick lookup
        const doctorMap = new Map(doctorProfiles?.map(d => [d.id, d.name]) || []);
        console.log('Doctor map:', doctorMap);

        const formattedAppointments: Appointment[] = appointmentsData.map(appt => {
          const date = parseISO(appt.appointment_date);
          return {
            id: appt.id,
            doctor: doctorMap.get(appt.doctor_id) || 'Médico não definido',
            specialty: 'Clínico Geral',
            date: format(date, 'yyyy-MM-dd'),
            time: format(date, 'HH:mm'),
            location: 'Consultório',
            type: appt.reason || 'Consulta',
            status: appt.status as any,
          };
        });
        console.log('Formatted appointments:', formattedAppointments);
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const now = new Date();
  const upcomingAppointments = appointments.filter(appt => {
    const apptDate = new Date(appt.date);
    return apptDate >= now && ['confirmed', 'pending', 'scheduled'].includes(appt.status);
  });

  const pastAppointments = appointments.filter(appt => {
    const apptDate = new Date(appt.date);
    return apptDate < now || ['completed', 'cancelled'].includes(appt.status);
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{appointment.doctor}</p>
              <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
            </div>
          </div>
          <Badge variant={getStatusVariant(appointment.status)}>
            {getStatusText(appointment.status)}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>
              {new Date(appointment.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{appointment.time} - {appointment.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">
              {appointment.type}
            </span>
          </div>
        </div>

        {(['confirmed', 'pending', 'scheduled'].includes(appointment.status)) && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              Remarcar
            </Button>
            <Button variant="destructive" size="sm" className="gap-1">
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6 fade-in max-w-5xl">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Meus Agendamentos</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Consultas e exames</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Consulta</span>
          <span className="sm:hidden">Agendar</span>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Próximos ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Histórico ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Você não tem consultas agendadas
                </p>
                <Button className="mt-4">Agendar Consulta</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma consulta anterior</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientAppointments;
