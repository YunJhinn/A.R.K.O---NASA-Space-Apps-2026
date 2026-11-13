import { AppProvider, useApp } from './lib/store'
import { Sprite } from './components/Sprite'
import { Sidebar } from './components/Sidebar'
import { Protobar } from './components/Protobar'
import { Home } from './components/home/Home'
import { Compare } from './components/compare/Compare'
import { PhoneView } from './components/phone/Phone'
import { Onboarding } from './components/Onboarding'

function Screens() {
  const { s } = useApp()
  return (
    <>
      <div className="app">
        <Sidebar />
        <main className="main">
          {s.view === 'inicio' && <Home />}
          {s.view === 'comparar' && <Compare />}
          {s.view === 'celular' && <PhoneView />}
        </main>
      </div>
      <Onboarding />
      <Protobar />
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
