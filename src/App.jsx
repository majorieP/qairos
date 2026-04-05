import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Roster from './pages/Roster'
import Contacts from './pages/Contacts'
import Deals from './pages/Deals'
import Campaigns from './pages/Campaigns'
import Contracts from './pages/Contracts'
import Invoices from './pages/Invoices'
import Payouts from './pages/Payouts'
import Expenses from './pages/Expenses'
import Team from './pages/Team'
import Tasks from './pages/Tasks'
import BusinessPerformance from './pages/BusinessPerformance'
import { CampaignsProvider } from './context/CampaignsContext'
import { ContractsProvider } from './context/ContractsContext'
import { InvoicesProvider } from './context/InvoicesContext'
import { PayoutsProvider } from './context/PayoutsContext'
import { ExpensesProvider } from './context/ExpensesContext'
import { TasksProvider } from './context/TasksContext'
import { ProposalsProvider } from './context/ProposalsContext'
import Proposals from './pages/Proposals'
import ProposalView from './pages/ProposalView'
import { MediaKitsProvider } from './context/MediaKitsContext'
import MediaKits from './pages/MediaKits'
import MediaKitView from './pages/MediaKitView'

export default function App() {
  return (
    <ExpensesProvider>
    <InvoicesProvider>
    <PayoutsProvider>
    <ContractsProvider>
    <CampaignsProvider>
    <TasksProvider>
    <ProposalsProvider>
    <MediaKitsProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="roster" element={<Roster />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="deals" element={<Deals />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payouts" element={<Payouts />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="team" element={<Team />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="analytics/business-performance" element={<BusinessPerformance />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="media-kits" element={<MediaKits />} />
        </Route>
        <Route path="/proposals/view/:token" element={<ProposalView />} />
        <Route path="/media-kits/view/:token" element={<MediaKitView />} />
      </Routes>
    </BrowserRouter>
    </MediaKitsProvider>
    </ProposalsProvider>
    </TasksProvider>
    </CampaignsProvider>
    </ContractsProvider>
    </PayoutsProvider>
    </InvoicesProvider>
    </ExpensesProvider>
  )
}
