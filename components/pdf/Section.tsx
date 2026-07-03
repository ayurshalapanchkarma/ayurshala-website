/**
 * Generic section component
 * Reusable heading + content
 */

interface SectionProps {
  title: string
  content: string | string[]
}

export function Section({ title, content }: SectionProps) {
  return (
    <div className="section mb-4">
      <h3 className="text-sm font-bold text-gray-900 mb-2 border-b-2 border-orange-500 pb-1">
        {title}
      </h3>
      
      {Array.isArray(content) ? (
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
          {content.map((item, i) => (
            <li key={i} className="break-inside-avoid page-break-inside-avoid">
              {item || '—'}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {content || '—'}
        </p>
      )}
    </div>
  )
}
