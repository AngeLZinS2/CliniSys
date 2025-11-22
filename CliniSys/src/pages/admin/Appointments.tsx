import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NewAppointmentDialog } from '@/components/admin/NewAppointmentDialog';
import { supabase } from '@/integrations/supabase/client';

interface Appointment {
  id: string;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const Appointments = () => {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return;
      }

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        return;
      }

      // Get unique patient and doctor IDs
      const patientIds = [...new Set(appointmentsData.map(apt => apt.patient_id))];
      const doctorIds = [...new Set(appointmentsData.map(apt => apt.doctor_id))];
      const allIds = [...patientIds, ...doctorIds];

      // Fetch profiles for all users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', allIds);

      // Create a map for quick lookup
      const profileMap = new Map(profilesData?.map(p => [p.id, p.name]) || []);

      // Map database fields to component interface
      const mappedData = appointmentsData.map(apt => {
        let time = '';
        let dateStr = apt.appointment_date || '';
        
        if (dateStr) {
          try {
            // If it's an ISO string like "2025-11-20T12:00:00+00:00"
            // Extract HH:MM directly from the string
            if (dateStr.includes('T')) {
              const timePart = dateStr.split('T')[1];
              time = timePart?.substring(0, 5) || ''; // Get HH:MM
            } else {
              // Fallback: try to parse as Date
              const appointmentDate = new Date(dateStr);
              if (!isNaN(appointmentDate.getTime())) {
                time = appointmentDate.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                });
              }
            }
          } catch (e) {
            console.error('Erro ao formatar hora:', e);
          }
        }
        
        return {
          id: apt.id,
          patient: profileMap.get(apt.patient_id) || 'Paciente desconhecido',
          doctor: profileMap.get(apt.doctor_id) || 'Profissional desconhecido',
          date: apt.appointment_date || '',
          time: time,
          type: apt.reason || 'Consulta',
          status: (apt.status || 'pending') as 'pending' | 'confirmed' | 'completed' | 'cancelled',
        };
      });

      setAppointments(mappedData);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
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

  return (
    <div className="space-y-4 sm:space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Agendamentos</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerenciar consultas e exames</p>
        </div>
        <NewAppointmentDialog onSuccess={fetchAppointments} />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground">Data Selecionada</p>
              <p className="text-2xl font-bold mt-2">
                {new Date(selectedDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total do dia</span>
                <span className="font-semibold">{appointments.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confirmados</span>
                <span className="font-semibold text-success">
                  {appointments.filter((a) => a.status === 'confirmed').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pendentes</span>
                <span className="font-semibold text-warning">
                  {appointments.filter((a) => a.status === 'pending').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Agendamentos do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Novo Agendamento" para criar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{appointment.patient}</p>
                          <p className="text-sm text-muted-foreground">{appointment.doctor}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(appointment.status)}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground ml-15">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {appointment.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {appointment.type}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        Ver Detalhes
                      </Button>
                      {appointment.status === 'pending' && (
                        <Button size="sm">Confirmar</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Appointments;
