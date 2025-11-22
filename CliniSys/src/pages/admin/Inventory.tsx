import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Pencil,
  X,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minimum_quantity: number;
  unit: string;
  description?: string;
}

const UNITS = ["un", "kg", "g", "mg", "L", "mL", "cx", "frasco", "comprimido"];

// --- Componente de Campo de Descrição ---

const DescriptionField = ({ description }: { description?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LENGTH = 60; // caracteres antes de truncar
  
  if (!description || description.trim() === '') {
    return (
      <>
        <p className="text-muted-foreground">Descrição</p>
        <p className="font-medium">-</p>
      </>
    );
  }

  const needsTruncation = description.length > MAX_LENGTH;
  const displayText = isExpanded || !needsTruncation 
    ? description 
    : `${description.substring(0, MAX_LENGTH)}...`;

  return (
    <>
      <p className="text-muted-foreground">Descrição</p>
      <div>
        <p className="font-medium break-words">{displayText}</p>
        {needsTruncation && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary hover:underline mt-1"
          >
            {isExpanded ? 'Ver menos' : 'Ver mais'}
          </button>
        )}
      </div>
    </>
  );
};

// --- Componente de Formulário Reutilizável ---

interface ItemFormProps {
  defaultValues?: Partial<InventoryItem>;
  onSubmit: (data: Omit<InventoryItem, 'id'>) => void;
  isSubmitting: boolean;
  submitText: string;
  isEditMode?: boolean;
}

const ItemForm = ({ defaultValues, onSubmit, isSubmitting, submitText, isEditMode = false }: ItemFormProps) => {
  const [name, setName] = useState(defaultValues?.name || '');
  const [category, setCategory] = useState(defaultValues?.category || '');
  const [quantity, setQuantity] = useState(defaultValues?.quantity || 0);
  const [minimum_quantity, setMinimumQuantity] = useState(defaultValues?.minimum_quantity || 0);
  const [unit, setUnit] = useState(defaultValues?.unit || 'un');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name) newErrors.name = "Nome é obrigatório";
    if (!category) newErrors.category = "Categoria é obrigatória";
    if (minimum_quantity < 0) newErrors.minimum_quantity = "Mínimo não pode ser negativo";
    if (!isEditMode && quantity < 0) newErrors.quantity = "Quantidade inicial não pode ser negativa";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({
        name,
        category,
        quantity: isEditMode ? (defaultValues?.quantity || 0) : quantity,
        minimum_quantity,
        unit,
        description,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Item</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Seringa 10mL" />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Medicamento, Material" />
          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {!isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="quantity">Qtd. Inicial</Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="minimum_quantity">Qtd. Mínima</Label>
          <Input id="minimum_quantity" type="number" value={minimum_quantity} onChange={(e) => setMinimumQuantity(Number(e.target.value))} />
          {errors.minimum_quantity && <p className="text-xs text-destructive">{errors.minimum_quantity}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unidade</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger id="unit">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes adicionais sobre o item..." />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancelar</Button>
        </DialogClose>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitText}
        </Button>
      </DialogFooter>
    </div>
  );
};

// --- Componente Diálogo Novo Item ---

const NewInventoryItemDialog = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Omit<InventoryItem, 'id'>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('inventory')
        .insert({
          ...data,
        });

      if (error) {
        console.error("Erro ao adicionar novo item:", error);
      } else {
        onSuccess();
        setOpen(false);
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo Item de Estoque</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do novo item a ser cadastrado no almoxarifado.
          </DialogDescription>
        </DialogHeader>
        <ItemForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitText="Cadastrar Item"
          isEditMode={false}
        />
      </DialogContent>
    </Dialog>
  );
};

// --- Componente Diálogo Editar Item ---

const EditInventoryItemDialog = ({ item, open, onOpenChange, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Omit<InventoryItem, 'id' | 'quantity'>) => {
    if (!item) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          name: data.name,
          category: data.category,
          minimum_quantity: data.minimum_quantity,
          unit: data.unit,
          description: data.description,
        })
        .eq('id', item.id);

      if (error) {
        console.error("Erro ao editar item:", error);
      } else {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Item: {item?.name}</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do item. A quantidade é gerenciada via "Entrada" e "Saída".
          </DialogDescription>
        </DialogHeader>
        <ItemForm
          defaultValues={item}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitText="Salvar Alterações"
          isEditMode={true}
        />
      </DialogContent>
    </Dialog>
  );
};

// --- Componente Diálogo Movimentação de Estoque ---

const StockMovementDialog = ({ item, type, open, onOpenChange, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = type === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída';
  const description = `Item: ${item?.name} (Estoque atual: ${item?.quantity} ${item?.unit})`;
  const buttonText = type === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Saída';

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setReason('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!item) return;

    if (quantity <= 0) {
      setError("Quantidade deve ser maior que zero.");
      return;
    }
    if (type === 'saida' && quantity > item.quantity) {
      setError(`Saída (${quantity}) maior que o estoque atual (${item.quantity}).`);
      return;
    }
    if (!reason) {
      setError("Motivo é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const newQuantity = type === 'entrada' ? item.quantity + quantity : item.quantity - quantity;

      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', item.id);

      if (updateError) {
        throw updateError;
      }

      onSuccess();
      onOpenChange(false);

    } catch (err) {
      console.error("Erro na transação de estoque:", err);
      setError("Falha ao atualizar estoque. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="move_quantity">Quantidade</Label>
            <Input 
              id="move_quantity" 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="move_reason">Motivo</Label>
            <Input 
              id="move_reason" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === 'entrada' ? 'Ex: Recebimento NF 123' : 'Ex: Uso paciente, Descarte'}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buttonText}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};


// --- Componente Principal ---

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [dialogType, setDialogType] = useState<'edit' | 'entrada' | 'saida' | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Erro ao buscar inventário:', error);
        return;
      }
      
      setInventory(data || []);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setSelectedItem(null);
    setDialogType(null);
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setDialogType('edit');
  };

  const openStockDialog = (item: InventoryItem, type: 'entrada' | 'saida') => {
    setSelectedItem(item);
    setDialogType(type);
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      return { status: 'empty', color: 'text-destructive', icon: X };
    }
    if (item.quantity <= item.minimum_quantity) {
      return { status: 'low', color: 'text-destructive', icon: AlertTriangle };
    }
    return { status: 'ok', color: 'text-success', icon: Package };
  };

  const lowStockCount = inventory.filter(
    (item) => item.quantity <= item.minimum_quantity
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6 fade-in p-4 md:p-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Almoxarifado</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerenciar estoque de materiais e medicamentos
          </p>
        </div>
        <NewInventoryItemDialog onSuccess={fetchInventory} />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Itens
            </CardTitle>
            <Package className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inventory.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estoque Baixo
            </CardTitle>
            <TrendingDown className="w-5 h-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requer atenção
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="text-center py-12">
               <Loader2 className="w-12 h-12 mx-auto text-muted-foreground animate-spin mb-4" />
               <p className="text-muted-foreground">Carregando estoque...</p>
             </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item cadastrado no estoque'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm 
                  ? 'Tente buscar por outro termo' 
                  : 'Cadastre materiais e medicamentos clicando no botão "Novo Item"'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const StockIcon = stockStatus.icon;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center ${stockStatus.color}`}>
                          <StockIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0 flex-shrink-0">
                        {item.quantity <= 0 && (
                          <Badge variant="destructive">Zerad@</Badge>
                        )}
                        {item.quantity > 0 && item.quantity <= item.minimum_quantity && (
                          <Badge variant="destructive">Estoque Baixo</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Quantidade</p>
                        <p className="font-medium">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mínimo</p>
                        <p className="font-medium">
                          {item.minimum_quantity} {item.unit}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <DescriptionField description={item.description} />
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => openStockDialog(item, 'entrada')}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Entrada
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openStockDialog(item, 'saida')} disabled={item.quantity <= 0}>
                        <TrendingDown className="w-4 h-4 mr-1" />
                        Saída
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedItem && (
        <>
          <EditInventoryItemDialog
            item={selectedItem}
            open={dialogType === 'edit'}
            onOpenChange={handleDialogClose}
            onSuccess={fetchInventory}
          />
          <StockMovementDialog
            item={selectedItem}
            type={dialogType === 'entrada' ? 'entrada' : 'saida'}
            open={dialogType === 'entrada' || dialogType === 'saida'}
            onOpenChange={handleDialogClose}
            onSuccess={fetchInventory}
          />
        </>
      )}

    </div>
  );
};

export default Inventory;
