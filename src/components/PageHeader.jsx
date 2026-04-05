export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1
          className="leading-tight mb-1"
          style={{
            fontFamily: '"Inter", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: '24px',
            color: '#111111',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: '#999999', fontWeight: 400, fontSize: '13px' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
