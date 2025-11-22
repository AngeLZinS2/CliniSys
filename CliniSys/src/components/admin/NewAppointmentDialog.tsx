import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Selecione um paciente'),
  doctor_id: z.string().min(1, 'Selecione um médico'),
  appointment_date: z.string().min(1, 'Data é obrigatória'),
  appointment_time: z.string().min(1, 'Horário é obrigatório'),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface User {
  id: string;
  name: string;
}

export function NewAppointmentDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  useEffect(() => {
    if (open) {
      loadPatients();
      loadDoctors();
    }
  }, [open]);

  const loadPatients = async () => {
    try {
      const { data: patientRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'patient');

      if (patientRoles) {
        const patientIds = patientRoles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', patientIds);

        if (profiles) setPatients(profiles);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      const { data: doctorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'doctor');

      if (doctorRoles) {
        const doctorIds = doctorRoles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', doctorIds);

        if (profiles) setDoctors(profiles);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setIsLoading(true);
    try {
      const dateTime = `${data.appointment_date}T${data.appointment_time}:00`;

      const { error } = await supabase.from('appointments').insert({
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        appointment_date: dateTime,
        reason: data.reason || null,
        notes: data.notes || null,
        status: 'scheduled',
      });

      if (error) throw error;

      toast.success('Agendamento criado com sucesso!');
      setOpen(false);
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar agendamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Agendar uma nova consulta ou exame
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient_id">Paciente</Label>
            <Select onValueChange={(value) => setValue('patient_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.patient_id && (
              <p className="text-sm text-destructive">{errors.patient_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctor_id">Médico</Label>
            <Select onValueChange={(value) => setValue('doctor_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o médico" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.doctor_id && (
              <p className="text-sm text-destructive">{errors.doctor_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Data</Label>
              <Input
                id="appointment_date"
                type="date"
                {...register('appointment_date')}
              />
              {errors.appointment_date && (
                <p className="text-sm text-destructive">
                  {errors.appointment_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_time">Horário</Label>
              <Input
                id="appointment_time"
                type="time"
                {...register('appointment_time')}
              />
              {errors.appointment_time && (
                <p className="text-sm text-destructive">
                  {errors.appointment_time.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Input
              id="reason"
              {...register('reason')}
              placeholder="Ex: Consulta de rotina"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Criando...' : 'Criar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
