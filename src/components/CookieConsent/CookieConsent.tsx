import { useConsent } from '../../context/ConsentContext';
import styles from './CookieConsent.module.css';

export default function CookieConsent() {
  const { consent, accept, decline } = useConsent();

  if (consent !== null) return null; // already decided

  return (
    <div className={styles.banner} role="dialog" aria-label="Cookie consent">
      <div className={styles.text}>
        <strong>🍪 We use cookies</strong>
        <p>
          This site stores your map preference in your browser's local storage
          to remember which map layer you last used. No tracking or analytics
          data is collected.
        </p>
      </div>
      <div className={styles.actions}>
        <button className={styles.btnDecline} onClick={decline}>
          Decline
        </button>
        <button className={styles.btnAccept} onClick={accept}>
          Accept
        </button>
      </div>
    </div>
  );
}
