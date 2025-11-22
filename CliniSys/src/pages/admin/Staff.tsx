import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCog, Phone, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { NewStaffDialog } from '@/components/admin/NewStaffDialog';
import { supabase } from '@/integrations/supabase/client';

interface StaffMember {
  id: string;
  user_id: string;
  name?: string;
  specialty?: string;
  registration_number?: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'on_leave';
}

const Staff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      
      // Get all staff records
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*');

      if (staffError) {
        console.error('Erro ao buscar profissionais:', staffError);
        return;
      }

      // Get profiles for each staff member
      if (staffData && staffData.length > 0) {
        const profileIds = staffData.map(s => s.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds);

        if (profilesError) {
          console.error('Erro ao buscar perfis:', profilesError);
          setStaff((staffData as StaffMember[]) || []);
          return;
        }

        // Merge staff data with profiles data
        const mergedData = staffData.map(staff => {
          const profile = profilesData?.find(p => p.id === staff.user_id);
          return {
            ...staff,
            name: profile?.name || 'Sem nome',
            phone: profile?.phone,
            avatar: profile?.avatar,
          } as StaffMember;
        });

        setStaff(mergedData);
      } else {
        setStaff([]);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role: string) => {
    return role === 'doctor' ? 'Médico(a)' : 'Enfermeiro(a)';
  };

  const getStatusName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'on_leave': 'Licença'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-4 sm:space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Profissionais</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerenciar médicos e enfermeiros</p>
        </div>
        <NewStaffDialog onSuccess={fetchStaff} />
      </div>

      {staff.length === 0 ? (
        <div className="col-span-2">
          <div className="text-center py-12 border rounded-lg bg-card">
            <UserCog className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum profissional cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre médicos e enfermeiros clicando no botão "Novo Profissional"
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {staff.map((staffMember) => (
          <Card key={staffMember.id} className="card-hover">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={staffMember.avatar} />
                  <AvatarFallback>{(staffMember.name || 'S').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{staffMember.name || 'Sem nome'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Profissional
                      </p>
                    </div>
                    <Badge
                      variant={staffMember.status === 'active' ? 'default' : 'secondary'}
                    >
                      {getStatusName(staffMember.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Especialidade:</span>
                  <span className="font-medium">{staffMember.specialty || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserCog className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Registro:</span>
                  <span className="font-medium">{staffMember.registration_number || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{staffMember.phone || '-'}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Ver Agenda
                </Button>
                <Button size="sm" className="flex-1">
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Staff;
