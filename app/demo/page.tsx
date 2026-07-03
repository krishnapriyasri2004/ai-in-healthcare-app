import { Dashboard } from '@/components/dashboard'

export default function DemoPage() {
  return (
    <>
      <style>{`
        html { background: linear-gradient(to br, rgb(229, 231, 235) 0%, rgb(228, 227, 226) 100%); }
      `}</style>
      <Dashboard />
    </>
  )
}
