import { useEffect, useState } from 'react'

const KEY = 'cookie_consent'

function grantAnalytics() {
  window.gtag?.('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' })
  window.gtag?.('event', 'page_view')
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(KEY)
    if (stored === 'accepted') {
      grantAnalytics()
    } else if (!stored) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(KEY, 'accepted')
    grantAnalytics()
    setVisible(false)
  }

  function refuse() {
    localStorage.setItem(KEY, 'refused')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Consentement cookies">
      <div className="cookie-banner-inner">
        <div className="cookie-banner-text">
          <strong>🍪 Cookies & vie privée</strong>
          <p>
            Ce site utilise Google Analytics pour mesurer son audience (pages visitées, durée de session).
            Aucune donnée publicitaire n'est collectée. Vous pouvez refuser sans impact sur votre navigation.
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button className="cookie-refuse" onClick={refuse}>Refuser</button>
          <button className="cookie-accept" onClick={accept}>Accepter</button>
        </div>
      </div>
    </div>
  )
}
