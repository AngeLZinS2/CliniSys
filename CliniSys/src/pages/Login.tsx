import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stethoscope, User } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedDNABackground } from '@/components/AnimatedDNABackground';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && user) {
      const isStaff = ['admin', 'doctor', 'nurse', 'receptionist'].includes(user.role);
      navigate(isStaff ? '/admin/dashboard' : '/patient/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (role: 'staff' | 'patient') => {
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password, role);
      toast.success('Login realizado com sucesso!');
      // Navigation will be handled by useEffect when user is loaded
    } catch (error) {
      toast.error('Credenciais inválidas');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      <AnimatedDNABackground />
      <div className="w-full max-w-md fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">CliniSys</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestão Médica</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Acessar Sistema</CardTitle>
            <CardDescription>
              Selecione o tipo de acesso e faça login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="staff" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="staff" className="gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Funcionário
                </TabsTrigger>
                <TabsTrigger value="patient" className="gap-2">
                  <User className="w-4 h-4" />
                  Paciente
                </TabsTrigger>
              </TabsList>

              <TabsContent value="staff" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password">Senha</Label>
                  <Input
                    id="staff-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleLogin('staff')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar como Funcionário'}
                </Button>
              </TabsContent>

              <TabsContent value="patient" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-email">Email</Label>
                  <Input
                    id="patient-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-password">Senha</Label>
                  <Input
                    id="patient-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => handleLogin('patient')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar como Paciente'}
                </Button>
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => navigate('/register')}
                >
                  Não tem conta? Cadastre-se
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
