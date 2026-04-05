import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import BrandLogo from '../components/BrandLogo'

// ── Seed data ──────────────────────────────────────────────────────────────

const agenciesData = [
  {
    id: 1,
    name: 'Apex Talent Group',
    type: 'talent',
    website: 'apextalentgroup.com',
    notes: 'Partner agency — refer overflow roster clients. Strong in entertainment.',
  },
  {
    id: 2,
    name: 'Blue Horizon Media',
    type: 'marketing',
    website: 'bluehorizonmedia.com',
    notes: 'Handles brand-side campaign activation for Verdant Foods.',
  },
  {
    id: 3,
    name: 'Momentum Collective',
    type: 'marketing',
    website: 'momentumco.agency',
    notes: 'Sports and wellness brand campaigns. Great for athletic creators.',
  },
  {
    id: 4,
    name: 'Nēo Talent',
    type: 'talent',
    website: 'neotalent.co',
    notes: 'Gen-Z focused representation. Co-manage several crossover clients.',
  },
]

export const brandsData = [
  {
    id: 1,
    name: 'Luminary Beauty',
    niche: 'Beauty & Skincare',
    website: 'luminarybeauty.com',
    billing_name: 'Luminary Beauty Co. LLC',
    billing_address: '1200 Sunset Blvd, Los Angeles, CA 90028',
    billing_email: 'billing@luminarybeauty.com',
    tax_id: '82-4491023',
    agencyId: 1,
    notes: 'Prefers Q1–Q2 campaign windows. Strong UGC focus.',
  },
  {
    id: 2,
    name: 'Peak Athletics',
    niche: 'Sports & Fitness',
    website: 'peakathletics.com',
    billing_name: 'Peak Athletics Inc.',
    billing_address: '45 Varsity Drive, Portland, OR 97201',
    billing_email: 'ap@peakathletics.com',
    tax_id: '91-3302874',
    agencyId: null,
    notes: 'Looking for endurance sports creators.',
  },
  {
    id: 3,
    name: 'Verdant Foods',
    niche: 'Food & Wellness',
    website: 'verdantfoods.co',
    billing_name: 'Verdant Foods PBC',
    billing_address: '800 Green St, Boulder, CO 80302',
    billing_email: 'finance@verdantfoods.co',
    tax_id: '37-2291045',
    agencyId: 2,
    notes: 'Focus on plant-based lifestyle creators.',
  },
  {
    id: 4,
    name: 'TechFlow',
    niche: 'Technology',
    website: 'techflow.io',
    billing_name: 'TechFlow Systems Inc.',
    billing_address: '210 Innovation Way, Austin, TX 78701',
    billing_email: 'billing@techflow.io',
    tax_id: '55-7784310',
    agencyId: null,
    notes: 'Primarily interested in YouTube and podcast integrations.',
  },
  {
    id: 5,
    name: 'Solstice Travel',
    niche: 'Travel & Lifestyle',
    website: 'solsticetravel.com',
    billing_name: 'Solstice Travel Ltd.',
    billing_address: '500 Harbor Dr, Miami, FL 33132',
    billing_email: 'accounts@solsticetravel.com',
    tax_id: '64-1190287',
    agencyId: 1,
    notes: 'Premium travel partnerships. High budgets. Long lead time required.',
  },
]

const contactsData = [
  { id: 1, firstName: 'Claire', lastName: 'Fontaine', email: 'claire@luminarybeauty.com', phone: '+1 (310) 555-0142', role: 'Brand Manager', brandId: 1, agencyId: null },
  { id: 2, firstName: 'Derek', lastName: 'Wills', email: 'derek.wills@peakathletics.com', phone: '+1 (503) 555-0187', role: 'Marketing Director', brandId: 2, agencyId: null },
  { id: 3, firstName: 'Priya', lastName: 'Mehta', email: 'priya@verdantfoods.co', phone: '+1 (720) 555-0093', role: 'Partnerships Lead', brandId: 3, agencyId: 2 },
  { id: 4, firstName: 'Sam', lastName: 'Torres', email: 'sam.t@techflow.io', phone: '+1 (512) 555-0254', role: 'Head of Growth', brandId: 4, agencyId: null },
  { id: 5, firstName: 'Elena', lastName: 'Voss', email: 'elena.voss@solsticetravel.com', phone: '+1 (305) 555-0178', role: 'Brand Director', brandId: 5, agencyId: 1 },
  { id: 6, firstName: 'Jordan', lastName: 'Blake', email: 'jordan@apextalent.com', phone: '+1 (424) 555-0261', role: 'Talent Manager', brandId: 1, agencyId: 1 },
  { id: 7, firstName: 'Nadia', lastName: 'Khoury', email: 'nadia@bluehorizon.com', phone: '+1 (213) 555-0334', role: 'Campaign Manager', brandId: 3, agencyId: 2 },
  { id: 8, firstName: 'Tara', lastName: 'Singh', email: 'tara@momentumco.agency', phone: '+1 (971) 555-0209', role: 'Campaign Strategist', brandId: 2, agencyId: 3 },
  { id: 9, firstName: 'Felix', lastName: 'Carr', email: 'felix@neotalent.co', phone: '+1 (786) 555-0167', role: 'Talent Rep', brandId: 5, agencyId: 4 },
]

// ── Style constants ────────────────────────────────────────────────────────

const avatarColors = [
  'bg-gray-100 text-gray-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

const nicheColors = {
  'Beauty & Skincare': { background: '#F3F3F3', color: '#666666' },
  'Sports & Fitness': { background: '#EEF4FF', color: '#2D5BE3' },
  'Food & Wellness': { background: '#EDFAF3', color: '#1A7A4A' },
  Technology: { background: '#F3F3F3', color: '#666666' },
  'Travel & Lifestyle': { background: '#FFF4EC', color: '#C4622D' },
}

const NICHE_DOT = {
  'Beauty & Skincare':  '#EC4899',
  'Sports & Fitness':   '#3B82F6',
  'Food & Wellness':    '#22C55E',
  'Technology':         '#8B5CF6',
  'Travel & Lifestyle': '#F97316',
  'Fashion':            '#E879F9',
  'Other':              '#9CA3AF',
}

const typeColors = {
  talent: { background: '#F3F3F3', color: '#666666' },
  marketing: { background: '#EEF4FF', color: '#2D5BE3' },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function avatarColor(index) {
  return avatarColors[index % avatarColors.length]
}

// ── Icons ──────────────────────────────────────────────────────────────────

const PersonIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1.5 11c0-2.21 2.015-4 4.5-4s4.5 1.79 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

const HexIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)

const BriefcaseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="1.5" y="4" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4 4V3a2 2 0 0 1 4 0v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

// ── Card sub-components ────────────────────────────────────────────────────

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
      >
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-72 pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent placeholder:text-gray-400"
      />
    </div>
  )
}

function ContactCard({ contact, index, brandMap, agencyMap, onClick }) {
  const fullName = `${contact.firstName} ${contact.lastName}`
  const brandName = brandMap[contact.brandId]?.name
  const agencyName = contact.agencyId ? agencyMap[contact.agencyId]?.name : null

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm hover:border-gray-300 transition-all cursor-pointer"
      onClick={() => onClick(contact)}
    >
      <div className="flex items-start gap-3.5">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColor(index)}`}>
          {getInitials(fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{fullName}</h3>
            {contact.role && (
              <span className="text-[11px] text-gray-400 shrink-0">{contact.role}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{contact.email}</p>
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            {brandName && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <BriefcaseIcon />
                {brandName}
              </span>
            )}
            {agencyName && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <HexIcon />
                {agencyName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BrandRow({ brand, primaryContact, isLast, onClick }) {
  const [hovered, setHovered] = useState(false)
  const dotColor = NICHE_DOT[brand.niche] || '#9CA3AF'

  return (
    <div
      onClick={() => onClick(brand)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px', cursor: 'pointer',
        background: hovered ? '#FAFAFA' : '#FFFFFF',
        borderBottom: isLast ? 'none' : '1px solid #F3F3F3',
        transition: 'background 0.12s',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      <BrandLogo name={brand.name} website={brand.website} size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#111111', margin: 0, lineHeight: 1.35 }}>
          {brand.name}
        </p>
        {primaryContact?.email && (
          <p style={{ fontSize: 13, fontWeight: 400, color: '#999999', margin: '2px 0 0', lineHeight: 1.35 }}>
            {primaryContact.email}
          </p>
        )}
      </div>
      {brand.niche && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 400, color: '#666666', whiteSpace: 'nowrap' }}>{brand.niche}</span>
        </div>
      )}
    </div>
  )
}

function AgencyCard({ agency, index, primaryContact, brandCount, onClick }) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm hover:border-gray-300 transition-all cursor-pointer"
      onClick={() => onClick(agency)}
    >
      <div className="flex items-start gap-3.5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColor(index + 2)}`}>
          {getInitials(agency.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{agency.name}</h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 capitalize" style={typeColors[agency.type] || { background: '#F3F3F3', color: '#666666' }}>
              {agency.type}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2.5">
            {primaryContact && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <PersonIcon />
                {primaryContact.firstName} {primaryContact.lastName}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {brandCount} brand{brandCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Drawer detail views ────────────────────────────────────────────────────

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">{children}</p>
  )
}

function FieldLink({ label, value, onClick }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <button
        onClick={onClick}
        className="text-sm text-[#111111] hover:underline text-left transition-colors"
      >
        {value}
      </button>
    </div>
  )
}

function ContactDetail({ contact, brandMap, agencyMap, onNavigate }) {
  const fullName = `${contact.firstName} ${contact.lastName}`
  const brand = brandMap[contact.brandId]
  const agency = contact.agencyId ? agencyMap[contact.agencyId] : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 ${avatarColor(contact.id - 1)}`}>
          {getInitials(fullName)}
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">{fullName}</p>
          <p className="text-sm text-gray-500">{contact.role}</p>
        </div>
      </div>
      <Field label="Email" value={contact.email} />
      <Field label="Phone" value={contact.phone} />
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <FieldLink label="Brand" value={brand?.name} onClick={() => onNavigate(brand, 'brand')} />
        {agency && (
          <FieldLink label="Agency" value={agency.name} onClick={() => onNavigate(agency, 'agency')} />
        )}
      </div>
    </div>
  )
}

function BrandDetail({ brand, agencies, contacts, onNavigate }) {
  const agency = brand.agencyId ? agencies.find((a) => a.id === brand.agencyId) : null
  const primaryContact = contacts.find((c) => c.brandId === brand.id)

  return (
    <div className="space-y-4">
      {/* Logo header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
        <BrandLogo name={brand.name} website={brand.website} size={80} />
        <div>
          <p className="text-lg font-semibold text-gray-900">{brand.name}</p>
          {brand.niche && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: NICHE_DOT[brand.niche] || '#9CA3AF', display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: '#666666' }}>{brand.niche}</span>
            </div>
          )}
        </div>
      </div>
      <Field label="Website" value={brand.website} />
      <Field label="Niche" value={brand.niche} />
      {agency && (
        <FieldLink label="Agency" value={agency.name} onClick={() => onNavigate(agency, 'agency')} />
      )}

      <div className="border-t border-gray-100 pt-4">
        <SectionLabel>Billing</SectionLabel>
        <div className="space-y-3">
          <Field label="Billing Name" value={brand.billing_name} />
          <Field label="Billing Address" value={brand.billing_address} />
          <Field label="Billing Email" value={brand.billing_email} />
          <Field label="Tax ID" value={brand.tax_id} />
        </div>
      </div>

      {primaryContact && (
        <div className="border-t border-gray-100 pt-4">
          <SectionLabel>Primary Contact</SectionLabel>
          <div className="space-y-3">
            <FieldLink
              label="Name"
              value={`${primaryContact.firstName} ${primaryContact.lastName}`}
              onClick={() => onNavigate(primaryContact, 'contact')}
            />
            <Field label="Email" value={primaryContact.email} />
            <Field label="Role" value={primaryContact.role} />
            <Field label="Phone" value={primaryContact.phone} />
          </div>
        </div>
      )}

      {brand.notes && (
        <div className="border-t border-gray-100 pt-4">
          <Field label="Notes" value={brand.notes} />
        </div>
      )}
    </div>
  )
}

function AgencyDetail({ agency, contacts, brands, onNavigate }) {
  const primaryContact = contacts.find((c) => c.agencyId === agency.id)
  const brandIds = [...new Set(contacts.filter((c) => c.agencyId === agency.id).map((c) => c.brandId))]
  const agencyBrands = brandIds.map((id) => brands.find((b) => b.id === id)).filter(Boolean)

  return (
    <div className="space-y-4">
      <Field label="Type" value={agency.type.charAt(0).toUpperCase() + agency.type.slice(1)} />
      <Field label="Website" value={agency.website} />

      {primaryContact && (
        <div className="border-t border-gray-100 pt-4">
          <SectionLabel>Primary Contact</SectionLabel>
          <div className="space-y-3">
            <FieldLink
              label="Name"
              value={`${primaryContact.firstName} ${primaryContact.lastName}`}
              onClick={() => onNavigate(primaryContact, 'contact')}
            />
            <Field label="Email" value={primaryContact.email} />
            <Field label="Role" value={primaryContact.role} />
          </div>
        </div>
      )}

      {agencyBrands.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <SectionLabel>Brands Represented ({agencyBrands.length})</SectionLabel>
          <div className="space-y-2">
            {agencyBrands.map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0" style={nicheColors[b.niche] || { background: '#F3F3F3', color: '#666666' }}>
                  {b.niche}
                </span>
                <button
                  onClick={() => onNavigate(b, 'brand')}
                  className="text-sm text-[#111111] hover:underline text-left transition-colors"
                >
                  {b.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {agency.notes && (
        <div className="border-t border-gray-100 pt-4">
          <Field label="Notes" value={agency.notes} />
        </div>
      )}
    </div>
  )
}

// ── Edit form ──────────────────────────────────────────────────────────────

function EditInput({ label, field, form, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[field] ?? ''}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
      />
    </div>
  )
}

function EditSelect({ label, field, form, onChange, options }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <select
        value={form[field] ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          const val = raw === '' ? null : isNaN(raw) ? raw : Number(raw)
          onChange(field, val)
        }}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const NICHES = ['Beauty & Skincare', 'Sports & Fitness', 'Food & Wellness', 'Technology', 'Travel & Lifestyle']

function EditForm({ type, form, onChange, brands, agencies, onSave, onCancel }) {
  return (
    <div className="space-y-4">
      {type === 'contact' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <EditInput label="First Name" field="firstName" form={form} onChange={onChange} />
            <EditInput label="Last Name" field="lastName" form={form} onChange={onChange} />
          </div>
          <EditInput label="Email" field="email" form={form} onChange={onChange} type="email" />
          <EditInput label="Phone" field="phone" form={form} onChange={onChange} type="tel" />
          <EditInput label="Role / Title" field="role" form={form} onChange={onChange} />
          <EditSelect
            label="Brand"
            field="brandId"
            form={form}
            onChange={onChange}
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
          />
          <EditSelect
            label="Agency"
            field="agencyId"
            form={form}
            onChange={onChange}
            options={[{ value: '', label: 'No agency' }, ...agencies.map((a) => ({ value: a.id, label: a.name }))]}
          />
        </>
      )}

      {type === 'brand' && (
        <>
          <EditInput label="Brand Name" field="name" form={form} onChange={onChange} />
          <EditSelect
            label="Niche"
            field="niche"
            form={form}
            onChange={onChange}
            options={NICHES.map((n) => ({ value: n, label: n }))}
          />
          <EditInput label="Website" field="website" form={form} onChange={onChange} />
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Billing</p>
            <EditInput label="Billing Name" field="billing_name" form={form} onChange={onChange} />
            <EditInput label="Billing Address" field="billing_address" form={form} onChange={onChange} />
            <EditInput label="Billing Email" field="billing_email" form={form} onChange={onChange} type="email" />
            <EditInput label="Tax ID" field="tax_id" form={form} onChange={onChange} />
          </div>
          <EditSelect
            label="Agency"
            field="agencyId"
            form={form}
            onChange={onChange}
            options={[{ value: '', label: 'No agency' }, ...agencies.map((a) => ({ value: a.id, label: a.name }))]}
          />
        </>
      )}

      {type === 'agency' && (
        <>
          <EditInput label="Agency Name" field="name" form={form} onChange={onChange} />
          <EditSelect
            label="Type"
            field="type"
            form={form}
            onChange={onChange}
            options={[
              { value: 'marketing', label: 'Marketing' },
              { value: 'talent', label: 'Talent' },
            ]}
          />
          <EditInput label="Website" field="website" form={form} onChange={onChange} />
        </>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onSave}
          className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}
        >
          Save changes
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Back arrow icon ────────────────────────────────────────────────────────

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M8.5 2.5L4 7l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ── Detail Drawer ──────────────────────────────────────────────────────────

function DetailDrawer({ drawerState, onClose, onSave, onNavigate, onBack, brands, agencies, contacts, brandMap, agencyMap }) {
  const { open, item, type, history = [] } = drawerState
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({})
  const [fade, setFade] = useState(false)

  useEffect(() => {
    if (item) setForm({ ...item })
    setIsEditing(false)
  }, [item])

  const handleSave = () => {
    onSave(type, form)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setForm({ ...item })
    setIsEditing(false)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Fade out → swap content → fade in
  const handleNavigate = (newItem, newType) => {
    setFade(true)
    setTimeout(() => {
      onNavigate(newItem, newType)
      setFade(false)
    }, 130)
  }

  const handleBack = () => {
    setFade(true)
    setTimeout(() => {
      onBack()
      setFade(false)
    }, 130)
  }

  const title = item
    ? type === 'contact'
      ? `${item.firstName} ${item.lastName}`
      : item.name
    : ''

  const prevEntry = history.length > 0 ? history[history.length - 1] : null
  const prevTitle = prevEntry
    ? prevEntry.type === 'contact'
      ? `${prevEntry.item.firstName} ${prevEntry.item.lastName}`
      : prevEntry.item.name
    : null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 w-[440px] bg-white border-l border-gray-200 h-full overflow-y-auto shadow-xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {item && (
          <>
            {/* Back breadcrumb */}
            {prevTitle && (
              <div className="px-6 pt-3 pb-0">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#111111] transition-colors group"
                >
                  <span className="group-hover:-translate-x-0.5 transition-transform">
                    <BackIcon />
                  </span>
                  <span className="truncate max-w-[280px]">{prevTitle}</span>
                </button>
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center justify-between px-6 border-b border-gray-100 sticky top-0 bg-white z-10 ${prevTitle ? 'py-3' : 'py-4'}`}>
              <h2 className="text-sm font-semibold text-gray-900 truncate pr-2">{title}</h2>
              <div className="flex items-center gap-1 shrink-0">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-medium text-[#111111] hover:underline px-2.5 py-1 rounded-md transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Body — fades when navigating */}
            <div
              className="p-6 transition-opacity duration-[130ms]"
              style={{ opacity: fade ? 0 : 1 }}
            >
              {isEditing ? (
                <EditForm
                  type={type}
                  form={form}
                  onChange={handleChange}
                  brands={brands}
                  agencies={agencies}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <>
                  {type === 'contact' && (
                    <ContactDetail
                      contact={item}
                      brandMap={brandMap}
                      agencyMap={agencyMap}
                      onNavigate={handleNavigate}
                    />
                  )}
                  {type === 'brand' && (
                    <BrandDetail
                      brand={item}
                      agencies={agencies}
                      contacts={contacts}
                      onNavigate={handleNavigate}
                    />
                  )}
                  {type === 'agency' && (
                    <AgencyDetail
                      agency={item}
                      contacts={contacts}
                      brands={brands}
                      onNavigate={handleNavigate}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mb-3 opacity-40">
        <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21L28 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ── Add modals ─────────────────────────────────────────────────────────────

function AddContactModal({ onClose, onAdd, brands, agencies }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: '',
    brandId: null, agencyId: null,
  })
  const [errors, setErrors] = useState({})
  const ch = (field, val) => { setForm(p => ({ ...p, [field]: val })); setErrors(p => ({ ...p, [field]: '' })) }
  const inputCls = (field) => `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  const handleSubmit = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = true
    if (!form.lastName.trim()) errs.lastName = true
    if (!form.email.trim()) errs.email = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Contact</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">First Name <span className="text-red-400">*</span></label>
              <input value={form.firstName} onChange={e => ch('firstName', e.target.value)} placeholder="Emily" className={inputCls('firstName')} />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Last Name <span className="text-red-400">*</span></label>
              <input value={form.lastName} onChange={e => ch('lastName', e.target.value)} placeholder="Santos" className={inputCls('lastName')} />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Email <span className="text-red-400">*</span></label>
            <input type="email" value={form.email} onChange={e => ch('email', e.target.value)} placeholder="emily@brand.com" className={inputCls('email')} />
            {errors.email && <p className="text-xs text-red-500 mt-1">Required</p>}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Phone</label>
            <input value={form.phone} onChange={e => ch('phone', e.target.value)} placeholder="+1 (555) 000-0000" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Role / Title</label>
            <input value={form.role} onChange={e => ch('role', e.target.value)} placeholder="Brand Partnerships Manager" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Brand</label>
            <select value={form.brandId || ''} onChange={e => ch('brandId', e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
              <option value="">No brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Agency</label>
            <select value={form.agencyId || ''} onChange={e => ch('agencyId', e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
              <option value="">No agency</option>
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={handleSubmit} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>Add Contact</button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddBrandModal({ onClose, onAdd, agencies }) {
  const BRAND_NICHES = ['Beauty & Skincare','Sports & Fitness','Food & Wellness','Technology','Travel & Lifestyle','Fashion','Entertainment','Health & Wellness','Finance','Home & Living','Other']
  const [form, setForm] = useState({
    name: '', niche: 'Other', website: '', agencyId: null,
    billing_name: '', billing_address: '', billing_email: '', tax_id: '', notes: '',
  })
  const [errors, setErrors] = useState({})
  const ch = (field, val) => { setForm(p => ({ ...p, [field]: val })); setErrors(p => ({ ...p, [field]: '' })) }
  const inputCls = (field) => `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  const handleSubmit = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Brand</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Brand Name <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={e => ch('name', e.target.value)} placeholder="Luminary Beauty" className={inputCls('name')} />
            {errors.name && <p className="text-xs text-red-500 mt-1">Required</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Niche</label>
              <select value={form.niche} onChange={e => ch('niche', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                {BRAND_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Website</label>
              <input value={form.website} onChange={e => ch('website', e.target.value)} placeholder="brand.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Agency</label>
            <select value={form.agencyId || ''} onChange={e => ch('agencyId', e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
              <option value="">No agency</option>
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Billing Details</p>
            <div className="space-y-2">
              <input value={form.billing_name} onChange={e => ch('billing_name', e.target.value)} placeholder="Legal entity name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
              <input value={form.billing_address} onChange={e => ch('billing_address', e.target.value)} placeholder="Billing address" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
              <div className="grid grid-cols-2 gap-2">
                <input type="email" value={form.billing_email} onChange={e => ch('billing_email', e.target.value)} placeholder="billing@brand.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                <input value={form.tax_id} onChange={e => ch('tax_id', e.target.value)} placeholder="EIN / Tax ID" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => ch('notes', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={handleSubmit} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>Add Brand</button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddAgencyModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', type: 'talent', website: '', notes: '' })
  const [errors, setErrors] = useState({})
  const ch = (field, val) => { setForm(p => ({ ...p, [field]: val })); setErrors(p => ({ ...p, [field]: '' })) }
  const inputCls = (field) => `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  const handleSubmit = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onAdd(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Agency</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Agency Name <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={e => ch('name', e.target.value)} placeholder="Apex Talent Group" className={inputCls('name')} />
            {errors.name && <p className="text-xs text-red-500 mt-1">Required</p>}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Type</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {['talent', 'marketing'].map(t => (
                <button key={t} type="button" onClick={() => ch('type', t)} className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${form.type === t ? 'text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} style={form.type === t ? { background: '#111111' } : {}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Website</label>
            <input value={form.website} onChange={e => ch('website', e.target.value)} placeholder="agency.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => ch('notes', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={handleSubmit} className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>Add Agency</button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Contacts page ─────────────────────────────────────────────────────

const TAB_ADD_LABELS = { contacts: 'Add Contact', brands: 'Add Brand', agencies: 'Add Agency' }

export default function Contacts() {
  const [searchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const urlOpen = parseInt(searchParams.get('open'))

  const [tab, setTab] = useState(urlTab && ['contacts', 'brands', 'agencies'].includes(urlTab) ? urlTab : 'contacts')
  const [search, setSearch] = useState('')

  // Editable state
  const [contacts, setContacts] = useState(contactsData)
  const [brands, setBrands] = useState(brandsData)
  const [agencies, setAgencies] = useState(agenciesData)

  const [showAdd, setShowAdd] = useState(false)

  const handleAddContact = (newContact) => {
    const id = Math.max(0, ...contacts.map(c => c.id)) + 1
    setContacts(prev => [...prev, { ...newContact, id }])
  }
  const handleAddBrand = (newBrand) => {
    const id = Math.max(0, ...brands.map(b => b.id)) + 1
    setBrands(prev => [...prev, { ...newBrand, id }])
  }
  const handleAddAgency = (newAgency) => {
    const id = Math.max(0, ...agencies.map(a => a.id)) + 1
    setAgencies(prev => [...prev, { ...newAgency, id }])
  }

  // Drawer state: keep item alive during close animation; history for back nav
  const [drawerState, setDrawerState] = useState(() => {
    if (urlOpen && urlTab) {
      const typeMap = { contacts: 'contact', brands: 'brand', agencies: 'agency' }
      const type = typeMap[urlTab]
      let item = null
      if (type === 'contact') item = contactsData.find(c => c.id === urlOpen)
      else if (type === 'brand') item = brandsData.find(b => b.id === urlOpen)
      else if (type === 'agency') item = agenciesData.find(a => a.id === urlOpen)
      if (item) return { open: true, item, type, history: [] }
    }
    return { open: false, item: null, type: null, history: [] }
  })

  // Lookup maps
  const brandMap = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b])), [brands])
  const agencyMap = useMemo(() => Object.fromEntries(agencies.map((a) => [a.id, a])), [agencies])

  // Derived helpers
  const getPrimaryContactForBrand = (brandId) => contacts.find((c) => c.brandId === brandId)
  const getPrimaryContactForAgency = (agencyId) => contacts.find((c) => c.agencyId === agencyId)
  const getBrandCountForAgency = (agencyId) =>
    new Set(contacts.filter((c) => c.agencyId === agencyId).map((c) => c.brandId)).size

  // Filtered lists
  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase()
    return contacts.filter((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
      return (
        fullName.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (brandMap[c.brandId]?.name || '').toLowerCase().includes(q)
      )
    })
  }, [contacts, search, brandMap])

  const filteredBrands = useMemo(() => {
    const q = search.toLowerCase()
    return brands.filter(
      (b) => b.name.toLowerCase().includes(q) || b.niche.toLowerCase().includes(q)
    )
  }, [brands, search])

  const filteredAgencies = useMemo(() => {
    const q = search.toLowerCase()
    return agencies.filter(
      (a) => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q)
    )
  }, [agencies, search])

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setSearch('')
    setDrawerState({ open: false, item: null, type: null })
  }

  const openDrawer = (item, type) => {
    setDrawerState({ open: true, item, type, history: [] })
  }

  const closeDrawer = () => {
    // Keep item so content stays visible during slide-out
    setDrawerState((prev) => ({ ...prev, open: false }))
  }

  const navigateDrawer = (newItem, newType) => {
    setDrawerState((prev) => ({
      ...prev,
      history: [...prev.history, { item: prev.item, type: prev.type }],
      item: newItem,
      type: newType,
    }))
  }

  const goBack = () => {
    setDrawerState((prev) => {
      const history = [...prev.history]
      const previous = history.pop()
      return { ...prev, history, item: previous.item, type: previous.type }
    })
  }

  const handleSave = (type, updatedItem) => {
    if (type === 'contact') {
      setContacts((prev) => prev.map((c) => (c.id === updatedItem.id ? updatedItem : c)))
    } else if (type === 'brand') {
      setBrands((prev) => prev.map((b) => (b.id === updatedItem.id ? updatedItem : b)))
    } else if (type === 'agency') {
      setAgencies((prev) => prev.map((a) => (a.id === updatedItem.id ? updatedItem : a)))
    }
    setDrawerState((prev) => ({ ...prev, item: updatedItem }))
  }

  const tabConfig = [
    { key: 'contacts', label: 'Contacts', count: contacts.length },
    { key: 'brands', label: 'Brands', count: brands.length },
    { key: 'agencies', label: 'Agencies', count: agencies.length },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Contacts"
        subtitle="Manage your contacts, brands, and agency relationships."
        action={
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors" style={{ background: '#111111', color: '#fff' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {TAB_ADD_LABELS[tab]}
          </button>
        }
      />

      {/* Tabs + Search */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1">
          {tabConfig.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${tab === t.key ? '#111111' : '#EEEEEE'}`,
                borderRadius: 6,
                padding: '6px 14px',
                fontFamily: '"Inter", system-ui, sans-serif',
                fontWeight: 500,
                fontSize: 13,
                color: tab === t.key ? '#111111' : '#888888',
                cursor: 'pointer',
              }}
            >
              {t.label}
              <span style={{ marginLeft: 6, fontSize: 11, color: '#AAAAAA' }}>{t.count}</span>
            </button>
          ))}
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={`Search ${tab}...`}
        />
      </div>

      {/* Contacts grid */}
      {tab === 'contacts' && (
        filteredContacts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredContacts.map((contact, i) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                index={i}
                brandMap={brandMap}
                agencyMap={agencyMap}
                onClick={(c) => openDrawer(c, 'contact')}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No contacts match your search." />
        )
      )}

      {/* Brands list */}
      {tab === 'brands' && (
        filteredBrands.length > 0 ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #EEEEEE', borderRadius: 12, overflow: 'hidden' }}>
            {filteredBrands.map((brand, i) => (
              <BrandRow
                key={brand.id}
                brand={brand}
                primaryContact={getPrimaryContactForBrand(brand.id)}
                isLast={i === filteredBrands.length - 1}
                onClick={(b) => openDrawer(b, 'brand')}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No brands match your search." />
        )
      )}

      {/* Agencies grid */}
      {tab === 'agencies' && (
        filteredAgencies.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredAgencies.map((agency, i) => (
              <AgencyCard
                key={agency.id}
                agency={agency}
                index={i}
                primaryContact={getPrimaryContactForAgency(agency.id)}
                brandCount={getBrandCountForAgency(agency.id)}
                onClick={(a) => openDrawer(a, 'agency')}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No agencies match your search." />
        )
      )}

      {/* Detail drawer — always mounted for smooth animation */}
      <DetailDrawer
        drawerState={drawerState}
        onClose={closeDrawer}
        onSave={handleSave}
        onNavigate={navigateDrawer}
        onBack={goBack}
        brands={brands}
        agencies={agencies}
        contacts={contacts}
        brandMap={brandMap}
        agencyMap={agencyMap}
      />

      {showAdd && tab === 'contacts' && <AddContactModal onClose={() => setShowAdd(false)} onAdd={handleAddContact} brands={brands} agencies={agencies} />}
      {showAdd && tab === 'brands' && <AddBrandModal onClose={() => setShowAdd(false)} onAdd={handleAddBrand} agencies={agencies} />}
      {showAdd && tab === 'agencies' && <AddAgencyModal onClose={() => setShowAdd(false)} onAdd={handleAddAgency} />}
    </div>
  )
}
