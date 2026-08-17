import { useQuery } from "@tanstack/react-query";
import { getChecklistPhotoUrls, type ChecklistPhoto } from "@/lib/api";

/** Miniaturas das imagens anexadas a um checklist já registrado. */
export function ChecklistPhotoGallery({ photos }: { photos: ChecklistPhoto[] }) {
  const paths = photos.map((p) => p.path);
  const urls = useQuery({
    queryKey: ["checklist-photo-urls", paths],
    queryFn: () => getChecklistPhotoUrls(paths),
    enabled: paths.length > 0,
    staleTime: 30 * 60 * 1000,
  });

  if (photos.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-muted-foreground">Imagens anexadas ({photos.length})</p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {photos.map((photo) => {
          const url = urls.data?.[photo.path];
          return (
            <li
              key={photo.path}
              className="aspect-square overflow-hidden rounded-xl border border-border bg-card"
            >
              {url ? (
                <a href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt={photo.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="size-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ) : (
                <span className="grid size-full place-items-center text-[10px] text-muted-foreground">
                  {urls.isLoading ? "Carregando..." : photo.name}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
