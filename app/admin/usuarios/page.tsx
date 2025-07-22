"use client";

import React, { memo, useMemo } from "react";
import { useListarUsuarios } from "@/features/auth/hooks/use-usuarios";
import { VirtualizedList } from "@/components/ui/virtualized-list";
import type { AppUser } from '@/src/features/auth/types/user.types';

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
  const { data: usuarios, isLoading, error } = useListarUsuarios();

  // Generate a stable key for each user row
  const getItemKey = (index: number, data: AppUser) => {
    return data.id;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Usuários do Sistema</h1>
      {isLoading && <p>Carregando usuários...</p>}
      {error && <p className="text-red-500">Erro ao carregar usuários</p>}
      {!isLoading && usuarios && usuarios.length > 0 ? (
        <div className="border rounded-md">
          <TableHeader />
          <div className="h-[600px]">
            <VirtualizedList
              items={usuarios}
              height={600}
              itemSize={40}
              renderItem={UserRow}
              itemKey={getItemKey}
              overscanCount={5}
            />
          </div>
        </div>
      ) : (
        !isLoading && <p className="text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
      )}
    </div>
  );
}