import { AlertTriangle } from "lucide-react";

/**
 * Aviso exibido quando as abas de cadastro ainda não existem na planilha.
 * Técnicos e veículos são gravados nas abas "Tecnicos" e "Veiculos" do mesmo
 * Google Sheets usado pelos checklists.
 */
export function SheetSetupNotice({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className="panel mb-5 border-primary/40 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="text-xs leading-relaxed">
          <p className="text-sm font-semibold">Cadastro indisponível</p>
          <p className="mt-1 text-muted-foreground">{message}</p>
          <p className="mt-2 text-muted-foreground">
            Na mesma planilha dos checklists, crie duas abas com estes cabeçalhos na primeira
            linha:
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">Tecnicos:</span> id | nome | ativo |
              criado_em
            </li>
            <li>
              <span className="font-semibold text-foreground">Veiculos:</span> id | placa | apelido
              | tecnico_id | pasta_drive | ativo | criado_em
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
