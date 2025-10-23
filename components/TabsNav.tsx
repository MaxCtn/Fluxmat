'use client';
import classNames from 'classnames';

type TabKey = 'import' | 'controle' | 'export';

export default function TabsNav({ active, onChange }:{ active:TabKey; onChange:(k:TabKey)=>void }){
  const item = (k:TabKey, label:string)=>(
    <button key={k} className={classNames('tab', active===k?'tab-active':'tab-inactive')} onClick={()=>onChange(k)}>{label}</button>
  );
  return (
    <nav className="flex gap-2 p-2 bg-slate-50 rounded-xl border">
      {item('import','Import Dépenses')}
      {item('controle','Contrôle des lignes')}
      {item('export','Export')}
    </nav>
  );
}
