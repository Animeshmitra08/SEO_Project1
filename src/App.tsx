import { BrowserRouter, Route, Routes } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import Landing from "@/pages/Landing"
import Designer from "@/pages/Designer"

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/designer" element={<Designer />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}
