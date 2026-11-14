import { useState } from 'react'
import { AppProvider, useApp } from './lib/store'
import brandWord from './assets/brand-word-light.webp'
import './styles/clean.css'
import { Sprite } from './components/Sprite'
import { Sidebar } from './components/Sidebar'
import { Home } from './components/home/Home'
import { Compare } from './components/compare/Compare'
import { PhoneView } from './components/phone/Phone'
import { Onboarding } from './components/Onboarding'
import { Future } from './components/Future'
import { Validacao } from './components/Validacao'

function Screens() {
  const { s, t, ds } = useApp()
  const [menu, setMenu] = useState(false)
  return (
    <>
      {/* celular: barra fixa com o botão de menu (o menu lateral vira uma gaveta) */}
      <div className="mbar">
        <button type="button" aria-label={t('Abrir menu')} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? '✕' : '☰'}</button>
        <img src={brandWord} alt="A.R.K.O" style={{ height: 13 }} />
        <span>{t(ds.realMeta.nome.split(' · ')[0])}</span>
      </div>
      {menu && <div className="mshade" onClick={() => setMenu(false)} />}
      <div className="app">
        <Sidebar open={menu} onNav={() => setMenu(false)} />
        <main className="main">
          {s.view === 'inicio' && <Home />}
          {s.view === 'comparar' && <Compare />}
          {s.view === 'celular' && <PhoneView />}
          {s.view === 'futuro' && <Future />}
          {s.view === 'validacao' && <Validacao />}
        </main>
      </div>
      <Onboarding />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Sprite />
      <Screens />
    </AppProvider>
  )
}
