import { Camera, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadChecklistPhoto, type ChecklistPhoto } from "@/lib/api";

type Props = {
  photos: ChecklistPhoto[];
  onChange: (photos: ChecklistPhoto[]) => void;
  plate: string;
};

/** Anexo de imagens do checklist (câmera do celular ou arquivos do computador). */
export function ChecklistPhotoUploader({ photos, onChange, plate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: ChecklistPhoto[] = [];
      const localPreviews: Record<string, string> = {};
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} não é uma imagem.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede 10 MB.`);
          continue;
        }
        const photo = await uploadChecklistPhoto(file, plate);
        uploaded.push(photo);
        localPreviews[photo.path] = URL.createObjectURL(file);
      }
      if (uploaded.length > 0) {
        setPreviews((p) => ({ ...p, ...localPreviews }));
        onChange([...photos, ...uploaded]);
        toast.success(`${uploaded.length} imagem(ns) anexada(s).`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Fotos do checklist {photos.length > 0 && `(${photos.length})`}
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Camera className="size-3.5" />
          )}
          {uploading ? "Enviando..." : "Anexar imagens"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((photo) => (
            <li
              key={photo.path}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card"
            >
              {previews[photo.path] ? (
                <img
                  src={previews[photo.path]}
                  alt={photo.name}
                  className="size-full object-cover"
                />
              ) : (
                <span className="grid size-full place-items-center text-[10px] text-muted-foreground">
                  {photo.name}
                </span>
              )}
              <button
                type="button"
                aria-label={`Remover ${photo.name}`}
                onClick={() => onChange(photos.filter((p) => p.path !== photo.path))}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        As imagens são salvas na pasta do Drive da placa. JPG/PNG até 10 MB por imagem.
      </p>
    </div>
  );
}
