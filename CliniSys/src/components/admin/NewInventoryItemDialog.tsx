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
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const inventorySchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  category: z.string().min(2, 'Categoria é obrigatória'),
  quantity: z.coerce.number().min(0, 'Quantidade inválida'),
  minimum_quantity: z.coerce.number().min(0, 'Quantidade mínima inválida'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  description: z.string().optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

export function NewInventoryItemDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
  });

  const onSubmit = async (data: InventoryFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('inventory').insert({
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        minimum_quantity: data.minimum_quantity,
        unit: data.unit,
        description: data.description || null,
      });

      if (error) throw error;

      toast.success('Item cadastrado com sucesso!');
      setOpen(false);
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Item</DialogTitle>
          <DialogDescription>
            Adicione um novo item ao estoque
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Item</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Luva cirúrgica"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              {...register('category')}
              placeholder="Ex: Equipamentos, Medicamentos"
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                {...register('quantity')}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_quantity">Quantidade Mínima</Label>
              <Input
                id="minimum_quantity"
                type="number"
                {...register('minimum_quantity')}
                placeholder="0"
              />
              {errors.minimum_quantity && (
                <p className="text-sm text-destructive">
                  {errors.minimum_quantity.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidade</Label>
            <Input
              id="unit"
              {...register('unit')}
              placeholder="Ex: unidade, caixa, frasco"
            />
            {errors.unit && (
              <p className="text-sm text-destructive">{errors.unit.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Informações adicionais sobre o item"
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
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
