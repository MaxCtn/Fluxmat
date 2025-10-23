'use client';
export default function FileDrop({ onFile }:{ onFile:(f:File)=>void }){
  return (
    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-8 cursor-pointer hover:bg-slate-50">
      <span className="text-sm text-slate-600">Dépose ton fichier .xlsx ici ou clique pour choisir</span>
      <input type="file" accept=".xlsx,.xls" className="hidden"
        onChange={(e)=>{ const f=e.currentTarget.files?.[0]; if(f) onFile(f); }}/>
      <span className="text-xs text-slate-400">Formats: .xlsx/.xls</span>
    </label>
  );
}
