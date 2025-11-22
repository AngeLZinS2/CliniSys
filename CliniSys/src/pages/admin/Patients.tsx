import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { NewPatientDialog } from '@/components/admin/NewPatientDialog';

interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  lastVisit?: string;
  avatar?: string;
}

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      // Get all patient user IDs
      const { data: patientRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'patient');

      if (!patientRoles || patientRoles.length === 0) {
        setIsLoading(false);
        return;
      }

      const patientIds = patientRoles.map(r => r.user_id);

      // Get profiles for those patients
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds);

      if (profiles) {
        // For each profile, get email from auth.users and last appointment
        const patientsWithData = await Promise.all(
          profiles.map(async (profile) => {
            // Get last appointment
            const { data: lastAppointment } = await supabase
              .from('appointments')
              .select('appointment_date')
              .eq('patient_id', profile.id)
              .order('appointment_date', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              id: profile.id,
              name: profile.name,
              cpf: profile.cpf || '',
              phone: profile.phone || '',
              email: '', // Email will come from auth, but we can't query it directly
              avatar: profile.avatar,
              lastVisit: lastAppointment?.appointment_date,
            };
          })
        );

        setPatients(patientsWithData);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf.includes(searchTerm) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Pacientes</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerenciar cadastro de pacientes</p>
        </div>
        <NewPatientDialog onSuccess={loadPatients} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm 
                  ? 'Tente buscar por outro termo' 
                  : 'Cadastre o primeiro paciente clicando no botão "Novo Paciente"'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={patient.avatar} />
                      <AvatarFallback>{patient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>CPF: {patient.cpf}</span>
                        <span>Tel: {patient.phone}</span>
                      </div>
                      {patient.lastVisit && (
                        <p className="text-xs text-muted-foreground">
                          Última visita: {format(new Date(patient.lastVisit), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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

export default Patients;
