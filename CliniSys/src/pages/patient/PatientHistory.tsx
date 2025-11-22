import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, User, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface MedicalRecord {
  id: string;
  date: string;
  doctor: string;
  type: 'consultation' | 'exam';
  title: string;
  notes: string;
}

const PatientHistory = () => {
  const { user } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMedicalHistory();
    }
  }, [user]);

  const loadMedicalHistory = async () => {
    try {
      const { data } = await supabase
        .from('medical_records')
        .select(`
          *,
          doctor:profiles!medical_records_doctor_id_fkey(name)
        `)
        .eq('patient_id', user!.id)
        .order('record_date', { ascending: false });

      if (data) {
        const formattedRecords: MedicalRecord[] = data.map(record => ({
          id: record.id,
          date: format(parseISO(record.record_date), 'yyyy-MM-dd'),
          doctor: record.doctor?.name || 'Médico não definido',
          type: 'consultation',
          title: record.diagnosis || 'Consulta Médica',
          notes: record.notes || 'Sem observações',
        }));
        setMedicalRecords(formattedRecords);
      }
    } catch (error) {
      console.error('Error loading medical history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Histórico e Exames</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Consulte seu histórico médico e resultados de exames
        </p>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Histórico Médico</TabsTrigger>
          <TabsTrigger value="exams">Exames</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : medicalRecords.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum registro médico encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu histórico de consultas aparecerá aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            medicalRecords.map((record) => (
              <Card key={record.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(record.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {record.doctor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{record.notes}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="exams" className="space-y-4 mt-6">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum exame encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Resultados de exames aparecerão aqui quando disponíveis
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientHistory;
