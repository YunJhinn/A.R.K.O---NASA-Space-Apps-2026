import { useState } from 'react'
import { useApp, type MyPlace } from '../lib/store'
import { cx } from '../lib/util'

/** Estrela para favoritar a região (ou o lugar buscado) que está aberta agora */
export function FavButton() {
  const { s, t, here, toggleFav } = useApp()
  const on = s.favs.some(x => x.key === here.key)
  return (
    <button onClick={() => toggleFav(here)} aria-pressed={on} title={t(on ? 'Remover dos favoritos' : 'Favoritar região')}
      className={cx('ml-3 inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[.08em] transition',
        on ? 'border-[#FFD43B]/60 bg-[#FFD43B]/15 text-[#FFD43B]' : 'border-white/20 bg-white/5 text-[#C8DEFA] hover:bg-white/10')}>
      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" fill={on ? '#FFD43B' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" />
      </svg>
      {t(on ? 'Favoritada' : 'Favoritar região')}
    </button>
  )
}

/** Aba do menu lateral: regiões favoritas e abertas/buscadas recentemente */
export function MyRegions() {
  const { s, t, here, openPlace, toggleFav, regionName } = useApp()
  const [tab, setTab] = useState<'fav' | 'rec'>(s.favs.length ? 'fav' : 'rec')
  const list = tab === 'fav' ? s.favs : s.recents
  const sub = (p: MyPlace) => (p.pin ? `${t(p.src === 'real' ? 'Dados reais · ' : 'Exemplo · ')}${t(regionName(p.src, p.region))}` : t(p.src === 'real' ? 'Dados reais' : 'Exemplo'))
  return (
    <div className="mb-3">
      <div style={{ fontSize: 11, color: 'var(--mu)', letterSpacing: '.06em', margin: '2px 0 6px' }}>{t('MINHAS REGIÕES')}</div>
      <div className="mb-1.5 flex gap-1 text-[11.5px] font-bold">
        {(['fav', 'rec'] as const).map(k => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k}
            className={cx('flex items-center gap-1 rounded px-2 py-1 transition', tab === k ? 'bg-white/12 text-white' : 'text-[#9AA0AA] hover:text-white')}
            style={tab === k ? { background: 'rgba(255,255,255,.1)' } : undefined}>
            {k === 'fav' ? '★' : '🕘'} {t(k === 'fav' ? 'Favoritas' : 'Recentes')}{k === 'fav' && s.favs.length > 0 && <span className="text-[#FFD43B]">{s.favs.length}</span>}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="px-1 text-[11.5px] leading-snug text-[#7C838E]">{t(tab === 'fav' ? 'Nenhuma região favoritada ainda. Use a estrela no painel.' : 'As regiões que você abrir ou buscar aparecem aqui.')}</p>
      ) : (
        <div className="flex max-h-[148px] flex-col gap-0.5 overflow-y-auto pr-1">
          {list.slice(0, 6).map(p => {
            const fav = s.favs.some(x => x.key === p.key)
            const cur = p.key === here.key
            return (
              <div key={p.key} className={cx('group flex items-center gap-2 rounded px-2 py-1.5 transition hover:bg-white/5', cur && 'bg-white/5')}>
                <button onClick={() => openPlace(p)} className="min-w-0 flex-1 text-left">
                  <span className={cx('block truncate text-[12.5px] font-bold', cur ? 'text-white' : 'text-[#D4D7DD]')}>{p.pin ? '📍 ' : ''}{t(p.label)}</span>
                  <span className="block truncate text-[10.5px] text-[#7C838E]">{sub(p)}</span>
                </button>
                <button onClick={() => toggleFav(p)} aria-label={t(fav ? 'Remover dos favoritos' : 'Favoritar região')}
                  className={cx('flex-none text-[13px] transition', fav ? 'text-[#FFD43B]' : 'text-[#5C636E] opacity-0 group-hover:opacity-100 hover:text-[#FFD43B]')}>★</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
