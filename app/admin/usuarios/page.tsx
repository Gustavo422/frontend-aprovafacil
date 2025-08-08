"use client";

import React, { memo, useMemo } from "react";
import { useListarUsuarios } from "@/features/auth/hooks/use-usuarios";
import { VirtualizedList } from "@/components/ui/virtualized-list";

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define the user type
interface Usuario {
  id: string;
  nome: string;
  email: string;
  role?: string;
  ativo: boolean;
  criado_em?: string;
}

// Memoized table header component
const TableHeader = memo(() => (
  <div className="grid grid-cols-5 gap-2 p-2 bg-muted font-medium text-sm border-b">
    <div>Nome</div>
    <div>Email</div>
    <div>Role</div>
    <div>Status</div>
    <div>Criado em</div>
  </div>
));
TableHeader.displayName = 'TableHeader';

// Memoized user row component
const UserRow = memo(({ item, style }: { item: Usuario; style: React.CSSProperties; index: number }) => {
  // Format the date once and memoize it
  const formattedDate = useMemo(() => {
    return item.criado_em ? new Date(item.criado_em).toLocaleDateString() : "-";
  }, [item.criado_em]);

  return (
    <div
      style={style}
      className="grid grid-cols-5 gap-2 p-2 border-b hover:bg-muted/50 transition-colors text-sm"
    >
      <div className="truncate">{item.nome}</div>
      <div className="truncate">{item.email}</div>
      <div>{item.role || "user"}</div>
      <div>
        <span
          className={`px-2 py-1 rounded text-xs ${item.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
        >
          {item.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>
      <div>{formattedDate}</div>
    </div>
  );
});
UserRow.displayName = 'UserRow';

export default function UsuariosAdminPage() {
  const { data: usuarios, isLoading, error, refetch } = useListarUsuarios();



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-2">Erro ao carregar usuários</p>
        <Button onClick={async () => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Usuários do Sistema</h1>
      {usuarios && usuarios.length > 0 ? (
        <div className="border rounded-md">
          <TableHeader />
          <div className="h-[600px]">
            <VirtualizedList
              items={usuarios}
              height={600}
              itemHeight={40}
              renderItem={({ index, style }) => (
                <UserRow
                  item={usuarios[index]}
                  style={style}
                  index={index}
                />
              )}
            />
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
      )}
    </div>
  );
}