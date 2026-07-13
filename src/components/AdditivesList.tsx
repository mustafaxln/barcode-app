import { getAdditiveInfo } from '../lib/additives';

export function AdditivesList({ additivesTags }: { additivesTags: string[] }) {
  if (additivesTags.length === 0) {
    return <p className="text-sm text-neutral-400">Bu üründe katkı maddesi tespit edilmedi.</p>;
  }

  return (
    <ul className="flex flex-col gap-2 text-left">
      {additivesTags.map((tag) => {
        const info = getAdditiveInfo(tag);
        return (
          <li
            key={tag}
            className={`rounded-lg border px-3 py-2 text-sm ${
              info?.attention ? 'border-warn-500/30 bg-warn-100' : 'border-neutral-200 bg-white'
            }`}
          >
            <span className="font-mono text-xs text-neutral-400">{tag.toUpperCase()}</span>
            {info ? (
              <>
                <span className="ml-2 font-medium text-neutral-800">{info.name}</span>
                <p className="mt-0.5 text-xs text-neutral-500">{info.description}</p>
              </>
            ) : (
              <span className="ml-2 text-neutral-500">Bu katkı maddesi için henüz açıklama eklenmedi.</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
