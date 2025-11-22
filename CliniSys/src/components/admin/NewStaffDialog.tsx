import { useState } from 'react';
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

const staffSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['doctor', 'nurse'], {
    required_error: 'Selecione uma função',
  }),
  specialty: z.string().optional(),
  registration: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

export function NewStaffDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      cpf: '',
      phone: '',
      email: '',
      password: '',
      role: undefined,
      specialty: '',
      registration: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: StaffFormData) => {
    setIsLoading(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            cpf: data.cpf,
            phone: data.phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role: data.role });

      if (roleError) throw roleError;

      // Create staff record
      const { error: staffError } = await supabase.from('staff').insert({
        user_id: authData.user.id,
        specialty: data.specialty || null,
        registration_number: data.registration || null,
      });

      if (staffError) throw staffError;

      toast.success('Profissional cadastrado com sucesso!');
      setOpen(false);
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar profissional');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Profissional
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Profissional</DialogTitle>
          <DialogDescription>
            Preencha os dados do profissional de saúde
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" {...register('name')} placeholder="Dr. João Silva" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select onValueChange={(value) => setValue('role', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Médico(a)</SelectItem>
                <SelectItem value="nurse">Enfermeiro(a)</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {(selectedRole === 'doctor' || selectedRole === 'nurse') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Input
                  id="specialty"
                  {...register('specialty')}
                  placeholder="Cardiologia, Clínico Geral, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration">
                  {selectedRole === 'doctor' ? 'CRM' : 'COREN'}
                </Label>
                <Input
                  id="registration"
                  {...register('registration')}
                  placeholder={selectedRole === 'doctor' ? 'CRM 12345' : 'COREN 12345'}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              {...register('cpf')}
              placeholder="12345678900"
              maxLength={11}
            />
            {errors.cpf && (
              <p className="text-sm text-destructive">{errors.cpf.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" {...register('phone')} placeholder="11999999999" />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="joao@exemplo.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="••••••"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
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
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
